import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transaction, certificateRecord, buyerProfile, sellerProfile, carbonCredit, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsPDF } from "jspdf";

export async function POST(req: NextRequest) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, copies = 1 } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // Fetch transaction details with related data
    const transactionData = await db
      .select({
        transaction: transaction,
        buyer: buyerProfile,
        seller: sellerProfile,
        credit: carbonCredit,
        project: project,
      })
      .from(transaction)
      .leftJoin(buyerProfile, eq(transaction.buyerId, buyerProfile.id))
      .leftJoin(sellerProfile, eq(transaction.sellerId, sellerProfile.id))
      .leftJoin(carbonCredit, eq(transaction.creditId, carbonCredit.id))
      .leftJoin(project, eq(carbonCredit.projectId, project.id))
      .where(eq(transaction.id, transactionId))
      .limit(1);

    if (transactionData.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const txn = transactionData[0];
    
    // Verify user has access to this transaction
    const userRole = session.user.role;
    const userId = session.user.id;
    
    if (userRole === "buyer" && txn.buyer?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (userRole === "seller" && txn.seller?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if certificate already exists
    let cert = await db
      .select()
      .from(certificateRecord)
      .where(eq(certificateRecord.transactionId, transactionId))
      .limit(1);

    if (cert.length === 0) {
      // Generate new certificate record
      const certId = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      await db.insert(certificateRecord).values({
        id: `cert_${Date.now()}`,
        certId: certId,
        transactionId: transactionId,
        issuedToBuyerId: txn.buyer?.id || null,
        issuedToSellerId: txn.seller?.id || null,
        verificationUrl: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/verify?cert=${certId}`,
      });

      cert = await db
        .select()
        .from(certificateRecord)
        .where(eq(certificateRecord.transactionId, transactionId))
        .limit(1);
    }

    if (cert.length === 0) {
      return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
    }

    // Generate professional PDF certificate with graphics
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set up colors
    const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
    const secondaryColor: [number, number, number] = [34, 197, 94]; // Green
    const textColor: [number, number, number] = [31, 41, 55]; // Dark gray
    const lightGray: [number, number, number] = [156, 163, 175];

    // Add decorative border
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, 190, 277);
    
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(1);
    pdf.rect(15, 15, 180, 267);

    // Header section with logo placeholder
    pdf.setFillColor(37, 99, 235);
    pdf.rect(20, 25, 170, 30, 'F');
    
    // Certificate title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('CARBON CREDIT CERTIFICATE', 105, 45, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text('Verified Carbon Offset Transaction', 105, 52, { align: 'center' });

    // Reset text color for body
    pdf.setTextColor(...textColor);
    
    // Certificate ID section
    pdf.setFontSize(10);
    pdf.text('Certificate ID:', 25, 70);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cert[0].certId, 65, 70);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Transaction ID:', 25, 78);
    pdf.text('Issue Date:', 25, 86);
    
    pdf.text(txn.transaction.id, 65, 78);
    pdf.text(new Date().toLocaleDateString(), 65, 86);

    // Transaction Details Section
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, 100, 170, 60, 'F');
    
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('TRANSACTION DETAILS', 25, 110);
    
    pdf.setTextColor(...textColor);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(11);
    
    const details = [
      `Quantity: ${txn.transaction.quantity.toLocaleString()} carbon credits`,
      `Credit Type: ${txn.project?.type || 'Unknown'}`,
      `Project: ${txn.project?.name || 'N/A'}`,
      `Registry: ${txn.transaction.registry || 'N/A'}`,
      `Total Value: $${parseFloat(txn.transaction.totalPrice).toLocaleString()}`,
      `Status: ${txn.transaction.status.toUpperCase()}`
    ];
    
    details.forEach((detail, index) => {
      pdf.text(detail, 25, 120 + (index * 8));
    });

    // Parties Section
    pdf.setFillColor(34, 197, 94);
    pdf.rect(20, 170, 170, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('TRANSACTION PARTIES', 25, 180);
    
    pdf.setTextColor(...textColor);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(11);
    pdf.text(`Buyer: ${txn.buyer?.companyName || 'N/A'}`, 25, 190);
    pdf.text(`Seller: ${txn.seller?.organizationName || 'N/A'}`, 25, 198);

    // Blockchain Verification Section
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('BLOCKCHAIN VERIFICATION', 25, 220);
    
    pdf.setTextColor(...textColor);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    
    if (txn.transaction.blockchainTxHash) {
      // Blockchain verified transaction
      pdf.setFillColor(240, 253, 244); // Light green background
      pdf.rect(20, 225, 170, 25, 'F');
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('✓ BLOCKCHAIN VERIFIED', 25, 233);
      
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Transaction Hash:', 25, 240);
      pdf.setFont('courier', 'normal');
      pdf.text(txn.transaction.blockchainTxHash.substring(0, 40) + '...', 25, 246);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Polygon Testnet Explorer:', 25, 252);
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(8);
      const explorerUrl = `https://mumbai.polygonscan.com/tx/${txn.transaction.blockchainTxHash}`;
      pdf.text(explorerUrl, 25, 258);
      
      // Add QR code placeholder (simple text for now)
      pdf.setTextColor(...textColor);
      pdf.setFontSize(8);
      pdf.text('QR Code: Scan to verify on blockchain explorer', 130, 240);
      
      // Draw QR code placeholder box
      pdf.setDrawColor(...lightGray);
      pdf.rect(150, 230, 25, 25);
      pdf.setFontSize(6);
      pdf.text('QR', 160, 245, { align: 'center' });
      
    } else {
      // Database only verification
      pdf.setFillColor(254, 252, 232); // Light yellow background
      pdf.rect(20, 225, 170, 20, 'F');
      
      pdf.setTextColor(180, 83, 9); // Orange color
      pdf.setFont('helvetica', 'bold');
      pdf.text('⚠ DATABASE VERIFIED ONLY', 25, 233);
      
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('This transaction was recorded in our database but not on blockchain.', 25, 240);
    }
    
    // Certificate verification URL
    pdf.setTextColor(...textColor);
    pdf.setFontSize(9);
    pdf.text('Certificate Verification:', 25, 268);
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(8);
    pdf.text(String(cert[0].verificationUrl || ''), 25, 274);

    // Add decorative elements
    pdf.setDrawColor(...secondaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(20, 95, 190, 95); // Separator line
    pdf.line(20, 165, 190, 165); // Separator line
    pdf.line(20, 210, 190, 210); // Separator line

    // Footer
    pdf.setTextColor(...lightGray);
    pdf.setFontSize(8);
    pdf.text('This certificate represents verified carbon offset transactions on the kloro platform.', 105, 260, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toISOString()}`, 105, 268, { align: 'center' });
    
    // Add small decorative corner elements
    pdf.setFillColor(...secondaryColor);
    pdf.circle(25, 30, 2, 'F');
    pdf.circle(185, 30, 2, 'F');
    pdf.circle(25, 277, 2, 'F');
    pdf.circle(185, 277, 2, 'F');

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Set response headers for PDF download
    const filename = `certificate_${transactionId}_${Date.now()}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({ 
      error: "Failed to generate certificate", 
      details: error.message 
    }, { status: 500 });
  }
}