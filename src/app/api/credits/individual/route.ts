import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { carbonCredit, project, sellerProfile } from "@/db/schema";
import { and, eq, gte, lte, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";

const FilterSchema = z.object({
  projectType: z.string().optional(),
  certificationStandard: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  location: z.string().optional(),
  listingType: z.enum(['direct_sale', 'marketplace_pool', 'both']).optional(),
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['price', 'vintage', 'quality', 'type']).default('price'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const CreateCreditBatchSchema = z.object({
  projectId: z.string().min(1),
  quantity: z.number().int().positive().max(10000),
  pricePerCredit: z.number().positive(),
  listingType: z.enum(['direct_sale', 'marketplace_pool', 'both']).default('both'),
  vintageYear: z.number().int().min(2010).max(2030),
  certificationDetails: z.object({}).optional()
});

/**
 * Individual Credit Tracking Algorithm - GET
 * Handles efficient retrieval of individual credits with advanced filtering
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters = FilterSchema.parse(body);
    
    // Build dynamic where conditions
    const whereConditions = [
      eq(carbonCredit.status, 'available' as any)
    ];
    
    // Project type filter
    if (filters.projectType) {
      whereConditions.push(eq(project.type, filters.projectType as any));
    }
    
    // Certification standard filter
    if (filters.certificationStandard) {
      whereConditions.push(eq(project.certificationStandard, filters.certificationStandard as any));
    }
    
    // Price range filter
    if (filters.priceRange) {
      whereConditions.push(
        and(
          gte(carbonCredit.pricePerCredit, filters.priceRange[0].toString()),
          lte(carbonCredit.pricePerCredit, filters.priceRange[1].toString())
        )!
      );
    }
    
    // Location filter
    if (filters.location) {
      whereConditions.push(sql`${project.location} ILIKE ${'%' + filters.location + '%'}`);
    }
    
    // Listing type filter
    if (filters.listingType) {
      whereConditions.push(
        sql`${carbonCredit.listingType} = ${filters.listingType} OR ${carbonCredit.listingType} = 'both'`
      );
    }
    
    // Build sort order
    let orderByClause;
    const sortDirection = filters.sortOrder === 'desc' ? desc : asc;
    
    switch (filters.sortBy) {
      case 'price':
        orderByClause = sortDirection(carbonCredit.pricePerCredit);
        break;
      case 'vintage':
        orderByClause = sortDirection(carbonCredit.vintageYear);
        break;
      case 'quality':
        orderByClause = sortDirection(carbonCredit.qualityScore);
        break;
      case 'type':
        orderByClause = sortDirection(project.type);
        break;
      default:
        orderByClause = asc(carbonCredit.pricePerCredit);
    }
    
    // Execute optimized query with joins
    const credits = await db
      .select({
        // Credit details
        id: carbonCredit.id,
        serialNumber: carbonCredit.serialNumber,
        batchId: carbonCredit.batchId,
        pricePerCredit: carbonCredit.pricePerCredit,
        status: carbonCredit.status,
        listingType: carbonCredit.listingType,
        vintageYear: carbonCredit.vintageYear,
        qualityScore: carbonCredit.qualityScore,
        certificationDetails: carbonCredit.certificationDetails,
        issuedAt: carbonCredit.issuedAt,
        
        // Project details
        projectId: project.id,
        projectName: project.name,
        projectType: project.type,
        projectLocation: project.location,
        projectCountry: project.country,
        certificationStandard: project.certificationStandard,
        registry: project.registry, // Legacy compatibility
        sustainabilityRating: project.sustainabilityRating,
        additionalityScore: project.additionalityScore,
        permanenceRisk: project.permanenceRisk,
        
        // Seller details (for transparency)
        sellerId: sellerProfile.id,
        sellerName: sellerProfile.organizationName,
        sellerType: sellerProfile.organizationType
      })
      .from(carbonCredit)
      .leftJoin(project, eq(project.id, carbonCredit.projectId))
      .leftJoin(sellerProfile, eq(sellerProfile.id, project.sellerId))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(filters.limit)
      .offset(filters.offset);
    
    // Calculate market statistics
    const marketStats = await calculateMarketStats(filters);
    
    // Apply AI scoring for recommendations
    const enrichedCredits = credits.map(credit => ({
      ...credit,
      aiReliabilityScore: calculateAIReliabilityScore(credit),
      marketPosition: calculateMarketPosition(credit, marketStats),
      impactScore: calculateImpactScore(credit)
    }));
    
    return NextResponse.json({
      credits: enrichedCredits,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: await getTotalCount(whereConditions)
      },
      marketStats,
      timestamp: Date.now()
    });
    
  } catch (error: any) {
    console.error('Individual credits fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch individual credits' },
      { status: 500 }
    );
  }
}

/**
 * Create Individual Credits in Batch - POST
 * For sellers to create individual credits from their projects
 */
export async function PUT(req: NextRequest) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const data = CreateCreditBatchSchema.parse(body);
    
    // Verify seller owns the project
    const sellerProfiles = await db
      .select()
      .from(sellerProfile)
      .where(eq(sellerProfile.userId, session.user.id as any))
      .limit(1);
      
    if (sellerProfiles.length === 0) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 400 });
    }
    
    const projects = await db
      .select()
      .from(project)
      .where(and(
        eq(project.id, data.projectId as any),
        eq(project.sellerId, sellerProfiles[0].id as any)
      ))
      .limit(1);
      
    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found or not owned" }, { status: 404 });
    }
    
    const projectData = projects[0];
    
    // Generate individual credits
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const credits = [];
    
    for (let i = 0; i < data.quantity; i++) {
      const creditId = crypto.randomUUID();
      const serialNumber = generateSerialNumber(projectData, data.vintageYear, i);
      
      credits.push({
        id: creditId,
        projectId: data.projectId,
        serialNumber,
        batchId,
        quantity: 1, // Always 1 for individual tracking
        pricePerCredit: data.pricePerCredit,
        status: 'available' as const,
        listingType: data.listingType,
        vintageYear: data.vintageYear,
        certificationDetails: data.certificationDetails || null,
        qualityScore: calculateInitialQualityScore(projectData),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Insert credits in batches for performance
    const batchSize = 1000;
    const insertedCredits = [];
    
    for (let i = 0; i < credits.length; i += batchSize) {
      const batch = credits.slice(i, i + batchSize);
      const inserted = await db.insert(carbonCredit).values(batch as any).returning();
      insertedCredits.push(...inserted);
    }
    
    // Update project statistics
    await db
      .update(project)
      .set({
        totalCreditsIssued: sql`${project.totalCreditsIssued} + ${data.quantity}`,
        totalCreditsAvailable: sql`${project.totalCreditsAvailable} + ${data.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(project.id, data.projectId as any));
    
    return NextResponse.json({
      success: true,
      batchId,
      creditsCreated: data.quantity,
      firstCreditId: insertedCredits[0]?.id,
      lastCreditId: insertedCredits[insertedCredits.length - 1]?.id
    });
    
  } catch (error: any) {
    console.error('Credit creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create credits' },
      { status: 500 }
    );
  }
}

// Helper Functions for AI and Market Analysis

async function calculateMarketStats(filters: any) {
  // Calculate market statistics for AI recommendations
  const stats = await db
    .select({
      avgPrice: sql<number>`AVG(CAST(${carbonCredit.pricePerCredit} AS DECIMAL))`,
      minPrice: sql<number>`MIN(CAST(${carbonCredit.pricePerCredit} AS DECIMAL))`,
      maxPrice: sql<number>`MAX(CAST(${carbonCredit.pricePerCredit} AS DECIMAL))`,
      totalAvailable: sql<number>`COUNT(*)`,
      avgQuality: sql<number>`AVG(CAST(${carbonCredit.qualityScore} AS DECIMAL))`
    })
    .from(carbonCredit)
    .leftJoin(project, eq(project.id, carbonCredit.projectId))
    .where(eq(carbonCredit.status, 'available' as any));
    
  return stats[0];
}

function calculateAIReliabilityScore(credit: any): number {
  let score = 2.5; // Base score
  
  // Project type scoring
  if (['reforestation', 'afforestation'].includes(credit.projectType)) {
    score += 0.8;
  } else if (['solar_energy', 'wind_energy'].includes(credit.projectType)) {
    score += 0.6;
  }
  
  // Certification standard scoring
  if (credit.certificationStandard === 'gold_standard') {
    score += 1.0;
  } else if (credit.certificationStandard === 'vcs') {
    score += 0.8;
  }
  
  // Vintage year scoring (newer = better)
  const currentYear = new Date().getFullYear();
  const vintageAge = currentYear - credit.vintageYear;
  if (vintageAge <= 2) {
    score += 0.5;
  } else if (vintageAge <= 5) {
    score += 0.3;
  }
  
  // Sustainability metrics
  if (credit.sustainabilityRating) {
    score += (parseFloat(credit.sustainabilityRating) / 5) * 0.5;
  }
  
  if (credit.additionalityScore) {
    score += (parseFloat(credit.additionalityScore) / 5) * 0.3;
  }
  
  // Risk assessment
  if (credit.permanenceRisk === 'low') {
    score += 0.4;
  } else if (credit.permanenceRisk === 'medium') {
    score += 0.2;
  }
  
  return Math.min(Math.round(score * 10) / 10, 5.0); // Cap at 5.0
}

function calculateMarketPosition(credit: any, marketStats: any): string {
  const price = parseFloat(credit.pricePerCredit);
  const avgPrice = marketStats.avgPrice || price;
  
  if (price <= avgPrice * 0.8) {
    return 'excellent_value';
  } else if (price <= avgPrice * 1.2) {
    return 'fair_value';
  } else {
    return 'premium';
  }
}

function calculateImpactScore(credit: any): number {
  let impact = 3.0; // Base impact
  
  // Project type impact
  const impactMultipliers = {
    'reforestation': 1.3,
    'afforestation': 1.3,
    'waste_management': 1.1,
    'solar_energy': 1.0,
    'wind_energy': 1.0,
    'methane_capture': 1.2,
    'hydro_power': 0.9,
    'other': 0.8
  };
  
  impact *= impactMultipliers[credit.projectType as keyof typeof impactMultipliers] || 1.0;
  
  // Country development factor (developing countries get bonus)
  const developingCountries = ['India', 'Brazil', 'Kenya', 'Peru', 'Indonesia'];
  if (developingCountries.includes(credit.projectCountry)) {
    impact += 0.5;
  }
  
  return Math.min(Math.round(impact * 10) / 10, 5.0);
}

async function getTotalCount(whereConditions: any[]): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(carbonCredit)
    .leftJoin(project, eq(project.id, carbonCredit.projectId))
    .where(and(...whereConditions));
    
  return result[0]?.count || 0;
}

function generateSerialNumber(project: any, vintageYear: number, index: number): string {
  const standardPrefix = {
    'vcs': 'VCS',
    'gold_standard': 'GS',
    'cdm': 'CDM',
    'vera': 'VRA',
    'aces': 'ACS',
    'car': 'CAR'
  };
  
  const prefix = standardPrefix[project.certificationStandard as keyof typeof standardPrefix] || 'UNK';
  const projectCode = project.id.slice(-4).toUpperCase();
  const creditNumber = String(index + 1).padStart(6, '0');
  
  return `${prefix}-${vintageYear}-${projectCode}-${creditNumber}`;
}

function calculateInitialQualityScore(project: any): string {
  let score = 3.0;
  
  // Based on project metrics
  if (project.sustainabilityRating) {
    score = (parseFloat(project.sustainabilityRating) + score) / 2;
  }
  
  if (project.additionalityScore) {
    score = (parseFloat(project.additionalityScore) + score) / 2;
  }
  
  return Math.round(score * 10) / 10 + '';
}