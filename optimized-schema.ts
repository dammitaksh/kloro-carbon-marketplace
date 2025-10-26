import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum, decimal, jsonb, integer, varchar, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

// ============================================
// ENUMS (UPDATED)
// ============================================

// Updated to include all 4 actors as discussed
export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'admin', 'individual']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'rejected']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const creditStatusEnum = pgEnum('credit_status', ['available', 'reserved', 'sold', 'retired']);

// Enhanced project lifecycle
export const projectStatusEnum = pgEnum('project_status', ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'suspended']);
export const projectTypeEnum = pgEnum('project_type', ['reforestation', 'renewable_energy', 'waste_management', 'methane_capture', 'hydro_power', 'afforestation', 'solar_energy', 'wind_energy', 'other']);

// Certification standards as discussed
export const certificationStandardEnum = pgEnum('certification_standard', ['vcs', 'gold_standard', 'cdm', 'vera', 'aces', 'car', 'other']);

// Listing types for dual marketplace
export const listingTypeEnum = pgEnum('listing_type', ['direct_sale', 'marketplace_pool', 'both']);

// Donation status
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'completed', 'failed', 'refunded']);

// ============================================
// AUTHENTICATION & USER MANAGEMENT (ENHANCED)
// ============================================

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('buyer'),
    
    // Enhanced user metadata
    isActive: boolean('is_active').default(true).notNull(),
    lastLoginAt: timestamp('last_login_at'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    emailIdx: uniqueIndex('user_email_idx').on(table.email),
}));

// Keep existing auth tables
export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// BUYER PROFILE (ENHANCED FOR INDUSTRIES)
// ============================================

export const buyerProfile = pgTable("buyer_profile", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    companyName: text('company_name').notNull(),
    industry: text('industry'),
    address: jsonb('address'),
    
    // Enhanced company details
    companySize: text('company_size'), // 'startup', 'sme', 'large_enterprise'
    website: text('website'),
    taxId: text('tax_id'),
    registrationNumber: text('registration_number'),
    
    // Verification
    verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
    verifiedBy: text('verified_by').references(() => user.id),
    verifiedAt: timestamp('verified_at'),
    kycDocuments: jsonb('kyc_documents'),
    
    // Carbon calculation fields (your existing logic)
    employeeCount: integer('employee_count'),
    annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
    energyConsumption: decimal('energy_consumption', { precision: 10, scale: 2 }),
    businessTravelDistance: decimal('business_travel_distance', { precision: 10, scale: 2 }),
    calculatedCarbonFootprint: decimal('calculated_carbon_footprint', { precision: 10, scale: 2 }),
    recommendedCredits: integer('recommended_credits'),
    
    // Wallet summary (individual credit tracking)
    totalCreditsOwned: decimal('total_credits_owned', { precision: 15, scale: 2 }).default('0').notNull(),
    totalCreditsRetired: decimal('total_credits_retired', { precision: 15, scale: 2 }).default('0').notNull(),
    
    // Spending tracking
    totalSpent: decimal('total_spent', { precision: 15, scale: 2 }).default('0').notNull(),
    preferredPaymentMethod: text('preferred_payment_method'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: uniqueIndex('buyer_profile_user_idx').on(table.userId),
}));

// ============================================
// INDIVIDUAL USERS (NEW - FOR DONATIONS)
// ============================================

export const individualProfile = pgTable("individual_profile", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    
    // Optional profile info
    bio: text('bio'),
    country: text('country'),
    preferredCurrency: text('preferred_currency').default('USD'),
    
    // Donation tracking
    totalDonated: decimal('total_donated', { precision: 15, scale: 2 }).default('0').notNull(),
    donationCount: integer('donation_count').default(0).notNull(),
    favoriteProjectTypes: jsonb('favorite_project_types'), // Array of project types
    
    // Notification preferences
    emailNotifications: boolean('email_notifications').default(true),
    monthlyReports: boolean('monthly_reports').default(true),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: uniqueIndex('individual_profile_user_idx').on(table.userId),
}));

// ============================================
// SELLER PROFILE (ENHANCED)
// ============================================

export const sellerProfile = pgTable("seller_profile", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    organizationName: text('organization_name').notNull(),
    organizationType: text('organization_type'),
    registrationNumber: text('registration_number'),
    taxId: text('tax_id'),
    website: text('website'),
    
    // Address
    address: text('address'),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    postalCode: text('postal_code'),
    
    // Bank details for payouts
    bankName: text('bank_name'),
    accountNumber: text('account_number'),
    accountHolderName: text('account_holder_name'),
    ifscCode: text('ifsc_code'),
    
    // Enhanced certifications
    certifications: jsonb('certifications'), // Array of certification objects
    operationalSince: timestamp('operational_since'),
    teamSize: integer('team_size'),
    
    // Verification
    verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
    verifiedBy: text('verified_by').references(() => user.id),
    verifiedAt: timestamp('verified_at'),
    kycDocuments: jsonb('kyc_documents'),
    
    // Earnings summary (your existing)
    totalEarnings: decimal('total_earnings', { precision: 15, scale: 2 }).default('0').notNull(),
    totalWithdrawn: decimal('total_withdrawn', { precision: 15, scale: 2 }).default('0').notNull(),
    availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).default('0').notNull(),
    
    // Performance metrics
    totalCreditsSold: integer('total_credits_sold').default(0),
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: uniqueIndex('seller_profile_user_idx').on(table.userId),
}));

// ============================================
// PROJECTS (ENHANCED WITH APPROVAL WORKFLOW)
// ============================================

export const project = pgTable("project", {
    id: text('id').primaryKey(),
    sellerId: text('seller_id').notNull().references(() => sellerProfile.id, { onDelete: 'cascade' }),
    
    name: text('name').notNull(),
    description: text('description'),
    type: projectTypeEnum('type').notNull(),
    
    // Location
    location: text('location'),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    country: text('country'),
    
    // Enhanced project details
    certificationStandard: certificationStandardEnum('certification_standard').notNull(),
    vintageYear: integer('vintage_year'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'), // For project completion
    
    // Credit estimation and tracking
    estimatedCreditsPerYear: decimal('estimated_credits_per_year', { precision: 15, scale: 2 }),
    totalCreditsIssued: integer('total_credits_issued').default(0),
    totalCreditsAvailable: integer('total_credits_available').default(0),
    
    // Media and documentation
    projectImages: jsonb('project_images'),
    projectDocuments: jsonb('project_documents'),
    impactMetrics: jsonb('impact_metrics'), // Additional environmental impact data
    
    // Enhanced approval workflow
    projectStatus: projectStatusEnum('project_status').default('draft').notNull(),
    submittedAt: timestamp('submitted_at'),
    reviewStartedAt: timestamp('review_started_at'),
    reviewCompletedAt: timestamp('review_completed_at'),
    
    // Verification & Status (for compatibility)
    verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
    verifiedBy: text('verified_by').references(() => user.id),
    verifiedAt: timestamp('verified_at'),
    reviewNotes: text('review_notes'),
    rejectionReason: text('rejection_reason'),
    
    // Quality metrics
    sustainabilityRating: decimal('sustainability_rating', { precision: 3, scale: 2 }),
    additionalityScore: decimal('additionality_score', { precision: 3, scale: 2 }),
    permanenceRisk: text('permanence_risk'), // 'low', 'medium', 'high'
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    sellerIdx: index('project_seller_idx').on(table.sellerId),
    typeIdx: index('project_type_idx').on(table.type),
    statusIdx: index('project_status_idx').on(table.projectStatus),
    verificationIdx: index('project_verification_status_idx').on(table.verificationStatus),
    countryIdx: index('project_country_idx').on(table.country),
}));

// ============================================
// CARBON CREDITS (INDIVIDUAL TRACKING)
// ============================================

export const carbonCredit = pgTable("carbon_credit", {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
    
    // Individual credit tracking (as discussed)
    serialNumber: text('serial_number').unique().notNull(), // Each credit gets unique serial
    batchId: text('batch_id'), // Credits can belong to batches for easier management
    
    // Credit details (simplified since each credit = 1 tCO2e)
    quantity: integer('quantity').notNull().default(1), // Always 1 for individual tracking
    pricePerCredit: decimal('price_per_credit', { precision: 10, scale: 2 }).notNull(),
    
    // Enhanced status and listing
    status: creditStatusEnum('status').default('available').notNull(),
    listingType: listingTypeEnum('listing_type').default('both').notNull(),
    
    // Ownership & lifecycle
    currentOwnerId: text('current_owner_id').references(() => user.id),
    issuedAt: timestamp('issued_at').defaultNow().notNull(),
    retiredAt: timestamp('retired_at'),
    retiredBy: text('retired_by').references(() => user.id),
    retirementReason: text('retirement_reason'),
    
    // Quality and metadata
    vintageYear: integer('vintage_year').notNull(),
    certificationDetails: jsonb('certification_details'),
    qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    projectIdx: index('carbon_credit_project_idx').on(table.projectId),
    statusIdx: index('carbon_credit_status_idx').on(table.status),
    ownerIdx: index('carbon_credit_owner_idx').on(table.currentOwnerId),
    serialIdx: uniqueIndex('carbon_credit_serial_idx').on(table.serialNumber),
    batchIdx: index('carbon_credit_batch_idx').on(table.batchId),
    listingTypeIdx: index('carbon_credit_listing_type_idx').on(table.listingType),
}));

// ============================================
// DONATIONS SYSTEM (NEW)
// ============================================

export const donation = pgTable('donation', {
    id: text('id').primaryKey(),
    donorId: text('donor_id').notNull().references(() => individualProfile.id, { onDelete: 'restrict' }),
    projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'restrict' }),
    
    // Donation details
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').default('USD').notNull(),
    status: donationStatusEnum('status').default('pending').notNull(),
    
    // Payment details
    paymentMethod: text('payment_method'),
    paymentReference: text('payment_reference'),
    paymentProcessorFee: decimal('payment_processor_fee', { precision: 10, scale: 2 }),
    
    // Donor preferences
    donorMessage: text('donor_message'),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    allowPublicMessage: boolean('allow_public_message').default(false).notNull(),
    
    // Impact tracking
    estimatedCarbonImpact: decimal('estimated_carbon_impact', { precision: 10, scale: 2 }),
    
    // Receipts and certificates
    receiptUrl: text('receipt_url'),
    impactCertificateUrl: text('impact_certificate_url'),
    
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    donorIdx: index('donation_donor_idx').on(table.donorId),
    projectIdx: index('donation_project_idx').on(table.projectId),
    statusIdx: index('donation_status_idx').on(table.status),
    amountIdx: index('donation_amount_idx').on(table.amount),
}));

// ============================================
// TRANSACTIONS (ENHANCED)
// ============================================

export const transaction = pgTable("transaction", {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull().references(() => buyerProfile.id, { onDelete: 'no action' }),
    sellerId: text('seller_id').notNull().references(() => sellerProfile.id, { onDelete: 'no action' }),
    
    // Individual credits (changed from batch to individual)
    creditIds: jsonb('credit_ids').notNull(), // Array of individual credit IDs
    quantity: integer('quantity').notNull(), // Number of credits = array length
    
    // Pricing
    pricePerCredit: decimal('price_per_credit', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
    netAmount: decimal('net_amount', { precision: 10, scale: 2 }),
    
    // Transaction flow
    status: transactionStatusEnum('status').default('pending').notNull(),
    transactionDate: timestamp('transaction_date').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    
    // Payment details
    paymentMethod: text('payment_method'),
    paymentReference: text('payment_reference'),
    
    // Blockchain integration (your existing)
    blockchainTxHash: text('blockchain_tx_hash'),
    registry: text('registry'),
    certificateUrl: text('certificate_url'),
    
    // Enhanced metadata
    metadata: jsonb('metadata'),
    notes: text('notes'),
    automaticRetirement: boolean('automatic_retirement').default(false),
    retirementReason: text('retirement_reason'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    buyerIdx: index('transaction_buyer_idx').on(table.buyerId),
    sellerIdx: index('transaction_seller_idx').on(table.sellerId),
    statusIdx: index('transaction_status_idx').on(table.status),
    dateIdx: index('transaction_date_idx').on(table.transactionDate),
}));

// ============================================
// KEEP EXISTING TABLES (COMPATIBILITY)
// ============================================

export const wasteLedger = pgTable("waste_ledger", {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull().references(() => buyerProfile.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    co2eAmount: decimal('co2e_amount', { precision: 10, scale: 2 }).notNull(),
    recordedDate: timestamp('recorded_date').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    buyerIdx: index('waste_ledger_buyer_idx').on(table.buyerId),
}));

export const certificateRecord = pgTable("certificate_record", {
    id: text("id").primaryKey(),
    certId: text("cert_id").unique().notNull(),
    transactionId: text("transaction_id").references(() => transaction.id).notNull(),
    issuedToBuyerId: text("issued_to_buyer_id").references(() => buyerProfile.id),
    issuedToSellerId: text("issued_to_seller_id").references(() => sellerProfile.id),
    verificationUrl: text("verification_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    certIdx: uniqueIndex('certificate_record_cert_idx').on(table.certId),
    txnIdx: index('certificate_record_txn_idx').on(table.transactionId),
}));

export const creditOwnershipHistory = pgTable('credit_ownership_history', {
    id: text('id').primaryKey(),
    creditId: text('credit_id').notNull().references(() => carbonCredit.id, { onDelete: 'restrict' }),
    transactionId: text('transaction_id').references(() => transaction.id),
    
    fromUserId: text('from_user_id').references(() => user.id),
    toUserId: text('to_user_id').references(() => user.id),
    
    action: text('action').notNull(), // 'issued', 'purchased', 'transferred', 'retired'
    notes: text('notes'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    creditIdx: index('credit_ownership_history_credit_idx').on(table.creditId),
    fromUserIdx: index('credit_ownership_history_from_user_idx').on(table.fromUserId),
    toUserIdx: index('credit_ownership_history_to_user_idx').on(table.toUserId),
}));

// Keep your platform settings as key-value pairs
export const platformSettings = pgTable('platform_settings', {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    description: text('description'),
    
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    keyIdx: uniqueIndex('platform_settings_key_idx').on(table.key),
}));

// ============================================
// RELATIONS (ENHANCED)
// ============================================

export const userRelations = relations(user, ({ one, many }) => ({
    buyerProfile: one(buyerProfile, { 
        fields: [user.id], 
        references: [buyerProfile.userId] 
    }),
    sellerProfile: one(sellerProfile, { 
        fields: [user.id], 
        references: [sellerProfile.userId] 
    }),
    individualProfile: one(individualProfile, {
        fields: [user.id],
        references: [individualProfile.userId]
    }),
    ownedCredits: many(carbonCredit),
    ownershipHistory: many(creditOwnershipHistory),
}));

export const buyerProfileRelations = relations(buyerProfile, ({ one, many }) => ({
    user: one(user, { 
        fields: [buyerProfile.userId], 
        references: [user.id] 
    }),
    wasteLedgers: many(wasteLedger),
    transactions: many(transaction),
    certificates: many(certificateRecord),
}));

export const individualProfileRelations = relations(individualProfile, ({ one, many }) => ({
    user: one(user, {
        fields: [individualProfile.userId],
        references: [user.id]
    }),
    donations: many(donation),
}));

export const sellerProfileRelations = relations(sellerProfile, ({ one, many }) => ({
    user: one(user, { 
        fields: [sellerProfile.userId], 
        references: [user.id] 
    }),
    projects: many(project),
    transactions: many(transaction),
    certificates: many(certificateRecord),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
    seller: one(sellerProfile, { 
        fields: [project.sellerId], 
        references: [sellerProfile.id] 
    }),
    credits: many(carbonCredit),
    donations: many(donation),
}));

export const carbonCreditRelations = relations(carbonCredit, ({ one, many }) => ({
    project: one(project, { 
        fields: [carbonCredit.projectId], 
        references: [project.id] 
    }),
    currentOwner: one(user, {
        fields: [carbonCredit.currentOwnerId],
        references: [user.id],
    }),
    ownershipHistory: many(creditOwnershipHistory),
}));

export const donationRelations = relations(donation, ({ one }) => ({
    donor: one(individualProfile, {
        fields: [donation.donorId],
        references: [individualProfile.id],
    }),
    project: one(project, {
        fields: [donation.projectId],
        references: [project.id],
    }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
    buyer: one(buyerProfile, { 
        fields: [transaction.buyerId], 
        references: [buyerProfile.id] 
    }),
    seller: one(sellerProfile, { 
        fields: [transaction.sellerId], 
        references: [sellerProfile.id] 
    }),
}));

export const certificateRecordRelations = relations(certificateRecord, ({ one }) => ({
    transaction: one(transaction, { 
        fields: [certificateRecord.transactionId], 
        references: [transaction.id] 
    }),
    buyer: one(buyerProfile, { 
        fields: [certificateRecord.issuedToBuyerId], 
        references: [buyerProfile.id] 
    }),
    seller: one(sellerProfile, { 
        fields: [certificateRecord.issuedToSellerId], 
        references: [sellerProfile.id] 
    }),
}));

export const creditOwnershipHistoryRelations = relations(creditOwnershipHistory, ({ one }) => ({
    credit: one(carbonCredit, {
        fields: [creditOwnershipHistory.creditId],
        references: [carbonCredit.id],
    }),
    transaction: one(transaction, {
        fields: [creditOwnershipHistory.transactionId],
        references: [transaction.id],
    }),
    fromUser: one(user, {
        fields: [creditOwnershipHistory.fromUserId],
        references: [user.id],
    }),
    toUser: one(user, {
        fields: [creditOwnershipHistory.toUserId],
        references: [user.id],
    }),
}));

export const wasteLedgerRelations = relations(wasteLedger, ({ one }) => ({
    buyer: one(buyerProfile, { 
        fields: [wasteLedger.buyerId], 
        references: [buyerProfile.id] 
    }),
}));