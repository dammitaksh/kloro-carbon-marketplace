import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donation, individualProfile, project, user } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { z } from "zod";

const CreateDonationSchema = z.object({
  projectId: z.string().min(1),
  amount: z.number().positive().max(100000),
  currency: z.string().default('USD'),
  donorMessage: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
  allowPublicMessage: z.boolean().default(false),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'paypal', 'stripe']).optional()
});

const DonationFilterSchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

/**
 * Create Donation - POST
 * Allows individual users to donate to projects directly
 */
export async function POST(req: NextRequest) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = CreateDonationSchema.parse(body);

    // Verify user has individual profile or create one
    const individualProfiles = await db
      .select()
      .from(individualProfile)
      .where(eq(individualProfile.userId, session.user.id as any))
      .limit(1);

    let donorProfile;
    if (individualProfiles.length === 0) {
      // Create individual profile if doesn't exist
      const userData = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id as any))
        .limit(1);
        
      if (userData.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const nameParts = userData[0].name?.split(' ') || ['', ''];
      const [firstName, ...lastNameParts] = nameParts;
      const lastName = lastNameParts.join(' ') || '';

      [donorProfile] = await db.insert(individualProfile).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        firstName: firstName || 'Anonymous',
        lastName: lastName || 'Donor',
        country: 'Unknown',
        preferredCurrency: data.currency
      } as any).returning();
    } else {
      donorProfile = individualProfiles[0];
    }

    // Verify project exists and is approved
    const projects = await db
      .select()
      .from(project)
      .where(and(
        eq(project.id, data.projectId as any),
        eq(project.projectStatus, 'active' as any)
      ))
      .limit(1);

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found or not accepting donations" }, { status: 404 });
    }

    const projectData = projects[0];

    // Calculate estimated carbon impact
    const estimatedImpact = calculateCarbonImpact(data.amount, projectData);

    // Create donation record
    const donationId = crypto.randomUUID();
    const [newDonation] = await db.insert(donation).values({
      id: donationId,
      donorId: donorProfile.id,
      projectId: data.projectId,
      amount: data.amount.toString(),
      currency: data.currency,
      status: 'pending',
      donorMessage: data.donorMessage || null,
      isAnonymous: data.isAnonymous,
      allowPublicMessage: data.allowPublicMessage,
      paymentMethod: data.paymentMethod || null,
      estimatedCarbonImpact: estimatedImpact.toString()
    } as any).returning();

    // Process payment (integrate with your payment processor)
    const paymentResult = await processPayment({
      amount: data.amount,
      currency: data.currency,
      donationId,
      paymentMethod: data.paymentMethod,
      donorEmail: session.user.email
    });

    if (paymentResult.success) {
      // Update donation status and complete
      await db
        .update(donation)
        .set({
          status: 'completed' as any,
          paymentReference: paymentResult.transactionId,
          paymentProcessorFee: paymentResult.processorFee?.toString(),
          completedAt: new Date()
        })
        .where(eq(donation.id, donationId as any));

      // Update individual profile totals
      await db
        .update(individualProfile)
        .set({
          totalDonated: sql`${individualProfile.totalDonated} + ${data.amount}`,
          donationCount: sql`${individualProfile.donationCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(individualProfile.id, donorProfile.id as any));

      // Generate impact certificate
      const certificateUrl = await generateImpactCertificate({
        donationId,
        projectName: projectData.name,
        amount: data.amount,
        impact: estimatedImpact,
        donorName: data.isAnonymous ? 'Anonymous Donor' : `${donorProfile.firstName} ${donorProfile.lastName}`
      });

      // Update with certificate URL
      await db
        .update(donation)
        .set({
          impactCertificateUrl: certificateUrl
        })
        .where(eq(donation.id, donationId as any));

      return NextResponse.json({
        success: true,
        donationId,
        amount: data.amount,
        estimatedCarbonImpact: estimatedImpact,
        certificateUrl,
        transactionId: paymentResult.transactionId
      });

    } else {
      // Mark donation as failed
      await db
        .update(donation)
        .set({
          status: 'failed' as any
        })
        .where(eq(donation.id, donationId as any));

      return NextResponse.json({
        error: "Payment processing failed",
        details: paymentResult.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Donation creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create donation' },
      { status: 500 }
    );
  }
}

/**
 * Get Donations - GET
 * Retrieve donation history for user or project
 */
export async function GET(req: NextRequest) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const filters = DonationFilterSchema.parse({
      projectId: url.searchParams.get('projectId'),
      status: url.searchParams.get('status'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0')
    });

    const whereConditions = [] as any[];

    // If user is individual, show only their donations
    if (session.user.role === 'individual') {
      const profile = await db
        .select({ id: individualProfile.id })
        .from(individualProfile)
        .where(eq(individualProfile.userId, session.user.id as any))
        .limit(1);
        
      if (profile.length === 0) {
        return NextResponse.json({ donations: [], total: 0 });
      }
      
      whereConditions.push(eq(donation.donorId, profile[0].id as any));
    }

    // Filter by project if specified
    if (filters.projectId) {
      whereConditions.push(eq(donation.projectId, filters.projectId as any));
    }

    // Filter by status if specified
    if (filters.status) {
      whereConditions.push(eq(donation.status, filters.status as any));
    }

    const donations = await db
      .select({
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        status: donation.status,
        donorMessage: donation.donorMessage,
        isAnonymous: donation.isAnonymous,
        allowPublicMessage: donation.allowPublicMessage,
        estimatedCarbonImpact: donation.estimatedCarbonImpact,
        impactCertificateUrl: donation.impactCertificateUrl,
        completedAt: donation.completedAt,
        createdAt: donation.createdAt,
        
        // Project details
        projectName: project.name,
        projectType: project.type,
        projectLocation: project.location,
        
        // Donor details (conditional on anonymity)
        donorFirstName: sql`CASE WHEN ${donation.isAnonymous} THEN 'Anonymous' ELSE ${individualProfile.firstName} END`,
        donorLastName: sql`CASE WHEN ${donation.isAnonymous} THEN 'Donor' ELSE ${individualProfile.lastName} END`,
        donorCountry: individualProfile.country
      })
      .from(donation)
      .leftJoin(project, eq(project.id, donation.projectId))
      .leftJoin(individualProfile, eq(individualProfile.id, donation.donorId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(donation.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(donation)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return NextResponse.json({
      donations,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: totalResult[0]?.count || 0
      }
    });

  } catch (error: any) {
    console.error('Donations fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

// Helper Functions

function calculateCarbonImpact(donationAmount: number, project: any): number {
  // Algorithm to estimate carbon impact based on project type and donation amount
  // This would typically integrate with project-specific impact calculations
  
  const impactRates = {
    'reforestation': 0.5, // tCO2e per dollar donated
    'afforestation': 0.45,
    'solar_energy': 0.3,
    'wind_energy': 0.35,
    'waste_management': 0.4,
    'methane_capture': 0.6,
    'hydro_power': 0.25,
    'other': 0.2
  };
  
  const rate = impactRates[project.type as keyof typeof impactRates] || 0.2;
  const baseImpact = donationAmount * rate;
  
  // Apply project efficiency multiplier if available
  let efficiency = 1.0;
  if (project.sustainabilityRating) {
    efficiency = parseFloat(project.sustainabilityRating) / 5;
  }
  
  return Math.round((baseImpact * efficiency) * 100) / 100;
}

async function processPayment(paymentData: {
  amount: number;
  currency: string;
  donationId: string;
  paymentMethod?: string;
  donorEmail?: string;
}): Promise<{
  success: boolean;
  transactionId?: string;
  processorFee?: number;
  error?: string;
}> {
  // Integrate with your payment processor (Stripe, PayPal, etc.)
  // This is a mock implementation
  
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate processor fee (typical rates)
    const feeRates = {
      'credit_card': 0.029, // 2.9%
      'bank_transfer': 0.008, // 0.8%
      'paypal': 0.034, // 3.4%
      'stripe': 0.029 // 2.9%
    };
    
    const feeRate = feeRates[paymentData.paymentMethod as keyof typeof feeRates] || 0.029;
    const processorFee = Math.round(paymentData.amount * feeRate * 100) / 100;
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        processorFee
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by processor'
      };
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
}

async function generateImpactCertificate(data: {
  donationId: string;
  projectName: string;
  amount: number;
  impact: number;
  donorName: string;
}): Promise<string> {
  // Generate a PDF certificate or return a URL to certificate generation service
  // This would typically integrate with a PDF generation service or certificate API
  
  const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // For now, return a mock certificate URL
  // In production, you'd generate an actual PDF certificate
  return `https://certificates.carbonmarketplace.com/${certificateId}.pdf`;
}