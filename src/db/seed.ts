import 'dotenv/config';
import { db } from './index';
import { 
  user, 
  buyerProfile, 
  sellerProfile, 
  project, 
  carbonCredit, 
  transaction,
  wasteLedger,
  certificateRecord,
  creditOwnershipHistory,
  donation,
  platformSettings,
  verification,
  account,
  session
} from './schema';

async function seed() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 0. CLEANUP EXISTING DATA (in dependency order)
  // ============================================
  console.log('🧹 Cleaning up existing data...');
  
  // Delete in reverse dependency order
  await db.delete(platformSettings);
  await db.delete(wasteLedger);
  await db.delete(donation);
  await db.delete(creditOwnershipHistory);
  await db.delete(certificateRecord);
  await db.delete(transaction);
  await db.delete(carbonCredit);
  await db.delete(project);
  await db.delete(buyerProfile);
  await db.delete(sellerProfile);
  await db.delete(verification);
  await db.delete(account);
  await db.delete(session);
  await db.delete(user);
  
  console.log('✅ Database cleaned up!');

  // ============================================
  // 1. ADMIN USER
  // ============================================
  const [admin] = await db.insert(user).values({
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@carboncredits.com',
    emailVerified: true,
    role: 'admin',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  }).returning();

  // ============================================
  // 2. SELLER USERS & PROFILES
  // ============================================
  const [seller1] = await db.insert(user).values({
    id: 'seller-001',
    name: 'Green Earth Foundation',
    email: 'contact@greenearthfoundation.org',
    emailVerified: true,
    role: 'seller',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=GEF',
  }).returning();

  await db.insert(sellerProfile).values({
    id: 'sp-001',
    userId: seller1.id,
    organizationName: 'Green Earth Foundation',
    organizationType: 'NGO',
    registrationNumber: 'NGO-2015-001',
    taxId: 'TAX-GEF-2015',
    website: 'https://greenearthfoundation.org',
    address: '123 Forest Lane, Eco Valley',
    city: 'Portland',
    state: 'Oregon',
    country: 'United States',
    postalCode: '97201',
    bankName: 'Green Bank',
    accountNumber: '1234567890',
    accountHolderName: 'Green Earth Foundation',
    ifscCode: 'GRNB0001234',
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-01-15'),
    totalEarnings: '245000.00',
    totalWithdrawn: '200000.00',
    availableBalance: '45000.00',
  });

  const [seller2] = await db.insert(user).values({
    id: 'seller-002',
    name: 'Amazon Reforestation Initiative',
    email: 'info@amazonreforest.org',
    emailVerified: true,
    role: 'seller',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=ARI',
  }).returning();

  await db.insert(sellerProfile).values({
    id: 'sp-002',
    userId: seller2.id,
    organizationName: 'Amazon Reforestation Initiative',
    organizationType: 'Cooperative',
    registrationNumber: 'COOP-2018-BR-045',
    taxId: 'TAX-ARI-2018',
    website: 'https://amazonreforest.org',
    address: 'Rua Verde 456, Manaus',
    city: 'Manaus',
    state: 'Amazonas',
    country: 'Brazil',
    postalCode: '69000-000',
    bankName: 'Banco do Brasil',
    accountNumber: '9876543210',
    accountHolderName: 'Amazon Reforestation Initiative',
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-02-20'),
    totalEarnings: '180000.00',
    totalWithdrawn: '150000.00',
    availableBalance: '30000.00',
  });

  const [seller3] = await db.insert(user).values({
    id: 'seller-003',
    name: 'SolarTech Innovations',
    email: 'sales@solartech.com',
    emailVerified: true,
    role: 'seller',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=STI',
  }).returning();

  await db.insert(sellerProfile).values({
    id: 'sp-003',
    userId: seller3.id,
    organizationName: 'SolarTech Innovations',
    organizationType: 'Company',
    registrationNumber: 'REG-IN-2020-789',
    taxId: 'GSTIN-29ABCDE1234F1Z5',
    website: 'https://solartech.in',
    address: 'Tech Park, Block C, 789 Solar Avenue',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560001',
    bankName: 'HDFC Bank',
    accountNumber: '50100123456789',
    accountHolderName: 'SolarTech Innovations Pvt Ltd',
    ifscCode: 'HDFC0001234',
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-03-10'),
    totalEarnings: '320000.00',
    totalWithdrawn: '280000.00',
    availableBalance: '40000.00',
  });

  // ============================================
  // 3. BUYER USERS & PROFILES
  // ============================================
  const [buyer1] = await db.insert(user).values({
    id: 'buyer-001',
    name: 'TechCorp Industries',
    email: 'sustainability@techcorp.com',
    emailVerified: true,
    role: 'buyer',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=TCI',
  }).returning();

  await db.insert(buyerProfile).values({
    id: 'bp-001',
    userId: buyer1.id,
    companyName: 'TechCorp Industries',
    industry: 'Technology',
    address: JSON.stringify({
      street: '500 Tech Boulevard',
      city: 'San Francisco',
      state: 'California',
      country: 'United States',
      zipCode: '94105'
    }),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-01-20'),
    employeeCount: 5000,
    annualRevenue: '500000000.00',
    energyConsumption: '12000000.00',
    businessTravelDistance: '5000000.00',
    calculatedCarbonFootprint: '8500.00',
    recommendedCredits: 8500,
    totalCreditsOwned: '5000.00',
    totalCreditsRetired: '3000.00',
  });

  const [buyer2] = await db.insert(user).values({
    id: 'buyer-002',
    name: 'GlobalShip Logistics',
    email: 'esg@globalship.com',
    emailVerified: true,
    role: 'buyer',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=GSL',
  }).returning();

  await db.insert(buyerProfile).values({
    id: 'bp-002',
    userId: buyer2.id,
    companyName: 'GlobalShip Logistics',
    industry: 'Transportation & Logistics',
    address: JSON.stringify({
      street: '1000 Harbor Drive',
      city: 'Rotterdam',
      state: 'South Holland',
      country: 'Netherlands',
      zipCode: '3011 BN'
    }),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-02-15'),
    employeeCount: 3000,
    annualRevenue: '300000000.00',
    energyConsumption: '18000000.00',
    businessTravelDistance: '15000000.00',
    calculatedCarbonFootprint: '12000.00',
    recommendedCredits: 12000,
    totalCreditsOwned: '7000.00',
    totalCreditsRetired: '5000.00',
  });

  const [buyer3] = await db.insert(user).values({
    id: 'buyer-003',
    name: 'EcoRetail Group',
    email: 'green@ecoretail.com',
    emailVerified: true,
    role: 'buyer',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=ERG',
  }).returning();

  await db.insert(buyerProfile).values({
    id: 'bp-003',
    userId: buyer3.id,
    companyName: 'EcoRetail Group',
    industry: 'Retail',
    address: JSON.stringify({
      street: '250 Green Street',
      city: 'London',
      state: 'England',
      country: 'United Kingdom',
      zipCode: 'SW1A 1AA'
    }),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-03-01'),
    employeeCount: 1500,
    annualRevenue: '150000000.00',
    energyConsumption: '8000000.00',
    businessTravelDistance: '2000000.00',
    calculatedCarbonFootprint: '4500.00',
    recommendedCredits: 4500,
    totalCreditsOwned: '2500.00',
    totalCreditsRetired: '2000.00',
  });

  const [buyer4] = await db.insert(user).values({
    id: 'buyer-004',
    name: 'Indian Manufacturing Co',
    email: 'csr@indianmfg.in',
    emailVerified: true,
    role: 'buyer',
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=IMC',
  }).returning();

  await db.insert(buyerProfile).values({
    id: 'bp-004',
    userId: buyer4.id,
    companyName: 'Indian Manufacturing Co',
    industry: 'Manufacturing',
    address: JSON.stringify({
      street: 'Industrial Area Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '411019'
    }),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-03-15'),
    employeeCount: 2500,
    annualRevenue: '200000000.00',
    energyConsumption: '15000000.00',
    businessTravelDistance: '3000000.00',
    calculatedCarbonFootprint: '9500.00',
    recommendedCredits: 9500,
    totalCreditsOwned: '4000.00',
    totalCreditsRetired: '2500.00',
  });

  // ============================================
  // 4. PROJECTS
  // ============================================
  const [project1] = await db.insert(project).values({
    id: 'proj-001',
    sellerId: 'sp-001',
    name: 'Pacific Northwest Reforestation',
    description: 'Large-scale reforestation project in the Pacific Northwest, planting over 1 million native trees across 5,000 acres of degraded forest land. The project focuses on biodiversity restoration and carbon sequestration.',
    type: 'reforestation',
    location: 'Cascade Range, Oregon',
    latitude: '44.3776',
    longitude: '-121.6905',
    country: 'United States',
    registry: 'Verra',
    vintageYear: 2023,
    startDate: new Date('2023-01-15'),
    estimatedCreditsPerYear: '50000.00',
    projectImages: JSON.stringify([
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
    ]),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2023-02-01'),
  }).returning();

  const [project2] = await db.insert(project).values({
    id: 'proj-002',
    sellerId: 'sp-002',
    name: 'Amazon Rainforest Conservation',
    description: 'Conservation and afforestation project protecting 10,000 hectares of Amazon rainforest and planting indigenous species to restore degraded areas. Includes community engagement and sustainable livelihood programs.',
    type: 'afforestation',
    location: 'Amazonas State, Brazil',
    latitude: '-3.4653',
    longitude: '-62.2159',
    country: 'Brazil',
    registry: 'Gold Standard',
    vintageYear: 2023,
    startDate: new Date('2023-03-01'),
    estimatedCreditsPerYear: '75000.00',
    projectImages: JSON.stringify([
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19'
    ]),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2023-04-15'),
  }).returning();

  const [project3] = await db.insert(project).values({
    id: 'proj-003',
    sellerId: 'sp-003',
    name: 'Karnataka Solar Farm Initiative',
    description: '100 MW solar power plant providing clean energy to over 50,000 homes. The project displaces coal-based electricity generation and contributes to India\'s renewable energy targets.',
    type: 'solar_energy',
    location: 'Pavagada, Karnataka',
    latitude: '14.0995',
    longitude: '77.2865',
    country: 'India',
    registry: 'Verra',
    vintageYear: 2024,
    startDate: new Date('2024-01-10'),
    estimatedCreditsPerYear: '120000.00',
    projectImages: JSON.stringify([
      'https://images.unsplash.com/photo-1509391366360-2e959784a276',
      'https://images.unsplash.com/photo-1497440001374-f26997328c1b'
    ]),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-02-20'),
  }).returning();

  const [project4] = await db.insert(project).values({
    id: 'proj-004',
    sellerId: 'sp-001',
    name: 'Urban Waste-to-Energy Conversion',
    description: 'Advanced waste management facility converting 500 tons of municipal solid waste per day into clean energy, preventing methane emissions from landfills.',
    type: 'waste_management',
    location: 'Seattle, Washington',
    latitude: '47.6062',
    longitude: '-122.3321',
    country: 'United States',
    registry: 'Gold Standard',
    vintageYear: 2024,
    startDate: new Date('2024-02-01'),
    estimatedCreditsPerYear: '40000.00',
    projectImages: JSON.stringify([
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9'
    ]),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-03-10'),
  }).returning();

  const [project5] = await db.insert(project).values({
    id: 'proj-005',
    sellerId: 'sp-003',
    name: 'Wind Energy Farm Tamil Nadu',
    description: '50 MW wind energy project with 25 turbines generating clean electricity and reducing dependence on fossil fuels in southern India.',
    type: 'wind_energy',
    location: 'Kanyakumari, Tamil Nadu',
    latitude: '8.0883',
    longitude: '77.5385',
    country: 'India',
    registry: 'Verra',
    vintageYear: 2024,
    startDate: new Date('2024-03-15'),
    estimatedCreditsPerYear: '60000.00',
    projectImages: JSON.stringify([
      'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51',
      'https://images.unsplash.com/photo-1548337138-e87d889cc369'
    ]),
    verificationStatus: 'verified',
    verifiedBy: admin.id,
    verifiedAt: new Date('2024-04-05'),
  }).returning();

  // ============================================
  // 5. CARBON CREDITS
  // ============================================
  const credits = [];
  
  // Project 1 credits
  for (let i = 1; i <= 10; i++) {
    const [credit] = await db.insert(carbonCredit).values({
      id: `credit-001-${String(i).padStart(3, '0')}`,
      projectId: project1.id,
      serialNumber: `VCS-2023-PNW-${String(i).padStart(6, '0')}`,
      quantity: 100,
      availableQuantity: i <= 5 ? 0 : 100,
      pricePerCredit: '25.00',
      status: i <= 5 ? 'sold' : 'available',
      currentOwnerId: i <= 5 ? buyer1.id : null,
    }).returning();
    credits.push(credit);
  }

  // Project 2 credits
  for (let i = 1; i <= 8; i++) {
    const [credit] = await db.insert(carbonCredit).values({
      id: `credit-002-${String(i).padStart(3, '0')}`,
      projectId: project2.id,
      serialNumber: `GS-2023-AMZ-${String(i).padStart(6, '0')}`,
      quantity: 150,
      availableQuantity: i <= 4 ? 0 : 150,
      pricePerCredit: '30.00',
      status: i <= 4 ? 'sold' : 'available',
      currentOwnerId: i <= 4 ? buyer2.id : null,
    }).returning();
    credits.push(credit);
  }

  // Project 3 credits
  for (let i = 1; i <= 12; i++) {
    const [credit] = await db.insert(carbonCredit).values({
      id: `credit-003-${String(i).padStart(3, '0')}`,
      projectId: project3.id,
      serialNumber: `VCS-2024-KAR-${String(i).padStart(6, '0')}`,
      quantity: 200,
      availableQuantity: i <= 6 ? 0 : 200,
      pricePerCredit: '22.00',
      status: i <= 6 ? 'sold' : 'available',
      currentOwnerId: i <= 6 ? (i % 2 === 0 ? buyer3.id : buyer4.id) : null,
    }).returning();
    credits.push(credit);
  }

  // Project 4 credits
  for (let i = 1; i <= 6; i++) {
    const [credit] = await db.insert(carbonCredit).values({
      id: `credit-004-${String(i).padStart(3, '0')}`,
      projectId: project4.id,
      serialNumber: `GS-2024-SEA-${String(i).padStart(6, '0')}`,
      quantity: 80,
      availableQuantity: i <= 3 ? 0 : 80,
      pricePerCredit: '28.00',
      status: i <= 3 ? 'sold' : 'available',
      currentOwnerId: i <= 3 ? buyer1.id : null,
    }).returning();
    credits.push(credit);
  }

  // Project 5 credits
  for (let i = 1; i <= 10; i++) {
    const [credit] = await db.insert(carbonCredit).values({
      id: `credit-005-${String(i).padStart(3, '0')}`,
      projectId: project5.id,
      serialNumber: `VCS-2024-TN-${String(i).padStart(6, '0')}`,
      quantity: 120,
      availableQuantity: i <= 4 ? 0 : 120,
      pricePerCredit: '24.00',
      status: i <= 4 ? 'sold' : 'available',
      currentOwnerId: i <= 4 ? buyer4.id : null,
    }).returning();
    credits.push(credit);
  }

  // ============================================
  // 6. TRANSACTIONS
  // ============================================
  const transactions = [];

  // TechCorp purchases from Green Earth
  const [txn1] = await db.insert(transaction).values({
    id: 'txn-001',
    buyerId: 'bp-001',
    sellerId: 'sp-001',
    creditId: 'credit-001-001',
    quantity: 100,
    totalPrice: '2500.00',
    platformFee: '125.00',
    netAmount: '2375.00',
    status: 'completed',
    transactionDate: new Date('2024-03-15'),
    completedAt: new Date('2024-03-15'),
    paymentMethod: 'bank_transfer',
    paymentReference: 'TXN-2024-03-15-001',
    blockchainTxHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    registry: 'Verra',
    certificateUrl: 'https://certificates.example.com/cert-001.pdf',
  }).returning();
  transactions.push(txn1);

  const [txn2] = await db.insert(transaction).values({
    id: 'txn-002',
    buyerId: 'bp-002',
    sellerId: 'sp-002',
    creditId: 'credit-002-001',
    quantity: 150,
    totalPrice: '4500.00',
    platformFee: '225.00',
    netAmount: '4275.00',
    status: 'completed',
    transactionDate: new Date('2024-04-10'),
    completedAt: new Date('2024-04-10'),
    paymentMethod: 'credit_card',
    paymentReference: 'TXN-2024-04-10-002',
    blockchainTxHash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u',
    registry: 'Gold Standard',
    certificateUrl: 'https://certificates.example.com/cert-002.pdf',
  }).returning();
  transactions.push(txn2);

  const [txn3] = await db.insert(transaction).values({
    id: 'txn-003',
    buyerId: 'bp-003',
    sellerId: 'sp-003',
    creditId: 'credit-003-001',
    quantity: 200,
    totalPrice: '4400.00',
    platformFee: '220.00',
    netAmount: '4180.00',
    status: 'completed',
    transactionDate: new Date('2024-05-05'),
    completedAt: new Date('2024-05-05'),
    paymentMethod: 'bank_transfer',
    paymentReference: 'TXN-2024-05-05-003',
    blockchainTxHash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v',
    registry: 'Verra',
    certificateUrl: 'https://certificates.example.com/cert-003.pdf',
  }).returning();
  transactions.push(txn3);

  const [txn4] = await db.insert(transaction).values({
    id: 'txn-004',
    buyerId: 'bp-004',
    sellerId: 'sp-003',
    creditId: 'credit-005-001',
    quantity: 120,
    totalPrice: '2880.00',
    platformFee: '144.00',
    netAmount: '2736.00',
    status: 'completed',
    transactionDate: new Date('2024-06-20'),
    completedAt: new Date('2024-06-20'),
    paymentMethod: 'upi',
    paymentReference: 'TXN-2024-06-20-004',
    blockchainTxHash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w',
    registry: 'Verra',
    certificateUrl: 'https://certificates.example.com/cert-004.pdf',
  }).returning();
  transactions.push(txn4);

  // Pending transaction
  const [txn5] = await db.insert(transaction).values({
    id: 'txn-005',
    buyerId: 'bp-001',
    sellerId: 'sp-001',
    creditId: 'credit-004-001',
    quantity: 80,
    totalPrice: '2240.00',
    platformFee: '112.00',
    netAmount: '2128.00',
    status: 'pending',
    transactionDate: new Date('2024-10-14'),
    paymentMethod: 'bank_transfer',
    paymentReference: 'TXN-2024-10-14-005',
  }).returning();
  transactions.push(txn5);

  // ============================================
  // 7. CERTIFICATES
  // ============================================
  await db.insert(certificateRecord).values([
    {
      id: 'cert-001',
      certId: 'CERT-2024-001',
      transactionId: txn1.id,
      issuedToBuyerId: 'bp-001',
      verificationUrl: 'https://verify.carbonmarketplace.com/CERT-2024-001',
    },
    {
      id: 'cert-002',
      certId: 'CERT-2024-002',
      transactionId: txn2.id,
      issuedToBuyerId: 'bp-002',
      verificationUrl: 'https://verify.carbonmarketplace.com/CERT-2024-002',
    },
    {
      id: 'cert-003',
      certId: 'CERT-2024-003',
      transactionId: txn3.id,
      issuedToBuyerId: 'bp-003',
      verificationUrl: 'https://verify.carbonmarketplace.com/CERT-2024-003',
    },
    {
      id: 'cert-004',
      certId: 'CERT-2024-004',
      transactionId: txn4.id,
      issuedToBuyerId: 'bp-004',
      verificationUrl: 'https://verify.carbonmarketplace.com/CERT-2024-004',
    },
  ]);

  // ============================================
  // 8. OWNERSHIP HISTORY
  // ============================================
  await db.insert(creditOwnershipHistory).values([
    {
      id: 'hist-001',
      creditId: 'credit-001-001',
      transactionId: txn1.id,
      fromUserId: seller1.id,
      toUserId: buyer1.id,
      action: 'purchased',
      notes: 'Initial purchase by TechCorp Industries',
    },
    {
      id: 'hist-002',
      creditId: 'credit-002-001',
      transactionId: txn2.id,
      fromUserId: seller2.id,
      toUserId: buyer2.id,
      action: 'purchased',
      notes: 'Purchased for shipping fleet offset',
    },
    {
      id: 'hist-003',
      creditId: 'credit-003-001',
      transactionId: txn3.id,
      fromUserId: seller3.id,
      toUserId: buyer3.id,
      action: 'purchased',
      notes: 'Part of annual sustainability commitment',
    },
    {
      id: 'hist-004',
      creditId: 'credit-005-001',
      transactionId: txn4.id,
      fromUserId: seller3.id,
      toUserId: buyer4.id,
      action: 'purchased',
      notes: 'Manufacturing emissions offset',
    },
  ]);// ============================================
// 9. WASTE LEDGER (Carbon Footprint Tracking) - CONTINUED
// ============================================
await db.insert(wasteLedger).values([
  {
    id: 'waste-001',
    buyerId: 'bp-001',
    description: 'Q1 2024 Data Center Operations',
    co2eAmount: '850.50',
    recordedDate: new Date('2024-03-31'),
  },
  {
    id: 'waste-002',
    buyerId: 'bp-001',
    description: 'Q2 2024 Business Travel',
    co2eAmount: '320.75',
    recordedDate: new Date('2024-06-30'),
  },
  {
    id: 'waste-003',
    buyerId: 'bp-001',
    description: 'Q3 2024 Office Energy',
    co2eAmount: '450.00',
    recordedDate: new Date('2024-09-30'),
  },
  {
    id: 'waste-004',
    buyerId: 'bp-002',
    description: 'Fleet Operations - January 2024',
    co2eAmount: '1200.00',
    recordedDate: new Date('2024-01-31'),
  },
  {
    id: 'waste-005',
    buyerId: 'bp-002',
    description: 'Fleet Operations - February 2024',
    co2eAmount: '1150.00',
    recordedDate: new Date('2024-02-29'),
  },
  {
    id: 'waste-006',
    buyerId: 'bp-002',
    description: 'Fleet Operations - March 2024',
    co2eAmount: '1180.00',
    recordedDate: new Date('2024-03-31'),
  },
  {
    id: 'waste-007',
    buyerId: 'bp-003',
    description: 'Retail Stores Energy - Q1 2024',
    co2eAmount: '450.25',
    recordedDate: new Date('2024-03-31'),
  },
  {
    id: 'waste-008',
    buyerId: 'bp-003',
    description: 'Retail Stores Energy - Q2 2024',
    co2eAmount: '480.50',
    recordedDate: new Date('2024-06-30'),
  },
  {
    id: 'waste-009',
    buyerId: 'bp-003',
    description: 'Supply Chain Operations',
    co2eAmount: '320.75',
    recordedDate: new Date('2024-09-15'),
  },
  {
    id: 'waste-010',
    buyerId: 'bp-004',
    description: 'Manufacturing Plant - March 2024',
    co2eAmount: '980.00',
    recordedDate: new Date('2024-03-31'),
  },
  {
    id: 'waste-011',
    buyerId: 'bp-004',
    description: 'Manufacturing Plant - April 2024',
    co2eAmount: '1020.50',
    recordedDate: new Date('2024-04-30'),
  },
  {
    id: 'waste-012',
    buyerId: 'bp-004',
    description: 'Manufacturing Plant - May 2024',
    co2eAmount: '950.75',
    recordedDate: new Date('2024-05-31'),
  },
]);

// ============================================
// 10. PLATFORM SETTINGS
// ============================================
await db.insert(platformSettings).values([
  {
    id: 'setting-platform-fee',
    key: 'platformFeePercentage',
    value: '5.00',
    description: 'Platform fee percentage for transactions',
    updatedBy: admin.id,
  },
  {
    id: 'setting-min-transaction',
    key: 'minTransactionAmount',
    value: '100.00',
    description: 'Minimum transaction amount in USD',
    updatedBy: admin.id,
  },
  {
    id: 'setting-max-transaction',
    key: 'maxTransactionAmount',
    value: '1000000.00',
    description: 'Maximum transaction amount in USD',
    updatedBy: admin.id,
  },
  {
    id: 'setting-currency',
    key: 'currency',
    value: 'USD',
    description: 'Default platform currency',
    updatedBy: admin.id,
  },
  {
    id: 'setting-timezone',
    key: 'timeZone',
    value: 'UTC',
    description: 'Default platform timezone',
    updatedBy: admin.id,
  },
  {
    id: 'setting-maintenance',
    key: 'maintenanceMode',
    value: 'false',
    description: 'Maintenance mode status',
    updatedBy: admin.id,
  },
  {
    id: 'setting-support-email',
    key: 'supportEmail',
    value: 'support@carbonmarketplace.com',
    description: 'Support email address',
    updatedBy: admin.id,
  },
  {
    id: 'setting-support-phone',
    key: 'supportPhone',
    value: '+1-800-CARBON-1',
    description: 'Support phone number',
    updatedBy: admin.id,
  },
  {
    id: 'setting-terms-url',
    key: 'termsOfServiceUrl',
    value: 'https://carbonmarketplace.com/terms',
    description: 'Terms of service URL',
    updatedBy: admin.id,
  },
  {
    id: 'setting-privacy-url',
    key: 'privacyPolicyUrl',
    value: 'https://carbonmarketplace.com/privacy',
    description: 'Privacy policy URL',
    updatedBy: admin.id,
  },
  {
    id: 'setting-bank-fee',
    key: 'bankTransferFee',
    value: '5.00',
    description: 'Bank transfer fee',
    updatedBy: admin.id,
  },
  {
    id: 'setting-card-fee',
    key: 'creditCardFee',
    value: '2.50',
    description: 'Credit card processing fee percentage',
    updatedBy: admin.id,
  },
  {
    id: 'setting-upi-fee',
    key: 'upiTransferFee',
    value: '1.00',
    description: 'UPI transfer fee',
    updatedBy: admin.id,
  },
  {
    id: 'setting-min-withdrawal',
    key: 'minWithdrawalAmount',
    value: '500.00',
    description: 'Minimum withdrawal amount',
    updatedBy: admin.id,
  },
  {
    id: 'setting-max-withdrawal',
    key: 'maxWithdrawalAmount',
    value: '50000.00',
    description: 'Maximum withdrawal amount',
    updatedBy: admin.id,
  },
  {
    id: 'setting-withdrawal-time',
    key: 'withdrawalProcessingTime',
    value: '2-3 business days',
    description: 'Withdrawal processing time',
    updatedBy: admin.id,
  },
  {
    id: 'setting-countries',
    key: 'supportedCountries',
    value: JSON.stringify(['United States', 'Brazil', 'India', 'Netherlands', 'United Kingdom']),
    description: 'List of supported countries',
    updatedBy: admin.id,
  },
  {
    id: 'setting-currencies',
    key: 'supportedCurrencies',
    value: JSON.stringify(['USD', 'EUR', 'INR', 'BRL']),
    description: 'List of supported currencies',
    updatedBy: admin.id,
  },
]);

  console.log('✅ Seed completed successfully!');
  console.log(`
📊 Summary:
  - Admin users: 1
  - Seller profiles: 3
  - Buyer profiles: 4
  - Projects: 5
  - Carbon credits: 46
  - Completed transactions: 4
  - Pending transactions: 1
  - Certificates: 4
  - Waste ledger entries: 12
  - Platform settings: 18
`);
}

// Call the seed function
seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
