/**
 * Test Data for Development
 * Hardcoded data to test components without backend
 */

export const testCities = [
  {
    _id: '1',
    name: 'Mumbai',
    tagline: 'Financial Capital of India',
    priority: 1,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Delhi',
    tagline: 'Capital of India',
    priority: 2,
    status: 'active',
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Bangalore',
    tagline: 'Silicon Valley of India',
    priority: 3,
    status: 'active',
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'Pune',
    tagline: 'Oxford of the East',
    priority: 4,
    status: 'active',
    createdAt: '2024-01-04T00:00:00.000Z'
  }
]

export const testAreas = [
  {
    _id: '1',
    name: 'Andheri',
    cityId: { _id: '1', name: 'Mumbai' },
    pincode: '400058',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Bandra',
    cityId: { _id: '1', name: 'Mumbai' },
    pincode: '400050',
    status: 'active',
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Connaught Place',
    cityId: { _id: '2', name: 'Delhi' },
    pincode: '110001',
    status: 'active',
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'Koramangala',
    cityId: { _id: '3', name: 'Bangalore' },
    pincode: '560034',
    status: 'active',
    createdAt: '2024-01-04T00:00:00.000Z'
  }
]

export const testRoles = [
  {
    _id: '1',
    name: 'Super Admin',
    description: 'Full system access',
    isActive: true,
    permissions: [
      { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'colonies', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'plots', actions: ['create', 'read', 'update', 'delete'] }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Colony Manager',
    description: 'Manage colonies and plots',
    isActive: true,
    permissions: [
      { module: 'colonies', actions: ['create', 'read', 'update'] },
      { module: 'plots', actions: ['create', 'read', 'update', 'delete'] }
    ],
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Sales Executive',
    description: 'Handle bookings and sales',
    isActive: true,
    permissions: [
      { module: 'bookings', actions: ['create', 'read', 'update'] },
      { module: 'plots', actions: ['read'] }
    ],
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'Buyer',
    description: 'Browse and book plots',
    isActive: true,
    permissions: [
      { module: 'colonies', actions: ['read'] },
      { module: 'plots', actions: ['read'] }
    ],
    createdAt: '2024-01-04T00:00:00.000Z'
  }
]

export const testUsers = [
  {
    _id: '1',
    name: 'Admin User',
    email: 'admin@jayshree.com',
    phone: '+91 9876543210',
    roleId: { _id: '1', name: 'Super Admin' },
    cityId: { _id: '1', name: 'Mumbai' },
    status: 'active',
    profileImage: 'https://via.placeholder.com/150',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'John Manager',
    email: 'john@jayshree.com',
    phone: '+91 9876543211',
    roleId: { _id: '2', name: 'Colony Manager' },
    cityId: { _id: '1', name: 'Mumbai' },
    status: 'active',
    profileImage: 'https://via.placeholder.com/150',
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Sarah Sales',
    email: 'sarah@jayshree.com',
    phone: '+91 9876543212',
    roleId: { _id: '3', name: 'Sales Executive' },
    cityId: { _id: '2', name: 'Delhi' },
    status: 'active',
    profileImage: 'https://via.placeholder.com/150',
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'Mike Buyer',
    email: 'mike@example.com',
    phone: '+91 9876543213',
    roleId: { _id: '4', name: 'Buyer' },
    cityId: { _id: '3', name: 'Bangalore' },
    status: 'active',
    profileImage: 'https://via.placeholder.com/150',
    createdAt: '2024-01-04T00:00:00.000Z'
  }
]

export const testColonies = [
  {
    _id: '1',
    name: 'Ganpanti Farms',
    description: 'Premium residential colony with modern amenities',
    cityId: { _id: '1', name: 'Mumbai' },
    areaId: { _id: '1', name: 'Andheri' },
    totalLandAreaGaj: 1677.78,
    basePricePerGaj: 50000,
    sellerName: 'Ganpanti Developers',
    sellerMobile: '+91 9876543210',
    sellerAddress: 'Mumbai, Maharashtra',
    purchasePrice: 5000000,
    expectedRevenue: 8000000,
    status: 'development',
    facilities: ['Water Supply', 'Electricity', 'Road Access', 'Security'],
    amenities: ['Club House', 'Swimming Pool', 'Gym', 'Garden'],
    plotStats: { total: 25, available: 15, booked: 7, sold: 3 },
    images: ['https://via.placeholder.com/400x300'],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Green Valley',
    description: 'Eco-friendly residential plots with garden view',
    cityId: { _id: '2', name: 'Delhi' },
    areaId: { _id: '3', name: 'Connaught Place' },
    totalLandAreaGaj: 2500.50,
    basePricePerGaj: 75000,
    sellerName: 'Green Developers',
    sellerMobile: '+91 9876543211',
    sellerAddress: 'Delhi, India',
    purchasePrice: 7500000,
    expectedRevenue: 12000000,
    status: 'ready',
    facilities: ['Water Supply', 'Electricity', 'Road Access'],
    amenities: ['Park', 'Playground', 'Community Hall'],
    plotStats: { total: 40, available: 20, booked: 12, sold: 8 },
    images: ['https://via.placeholder.com/400x300'],
    createdAt: '2024-01-02T00:00:00.000Z'
  }
]

export const testPlots = [
  {
    _id: '1',
    plotNo: 'GP-001',
    colonyId: { _id: '1', name: 'Ganpanti Farms' },
    size: '120',
    facing: 'North',
    status: 'Available',
    totalPrice: 6000000,
    pricePerGaj: 50000,
    areaGaj: 120,
    plotType: 'Residential',
    cornerPlot: false,
    registryDocument: 'REG-GP-001.pdf',
    registryStatus: 'Completed',
    sideMeasurements: { front: '30', back: '30', left: '36', right: '36' },
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    plotNo: 'GP-002',
    colonyId: { _id: '1', name: 'Ganpanti Farms' },
    size: '150',
    facing: 'East',
    status: 'Booked',
    totalPrice: 7500000,
    pricePerGaj: 50000,
    areaGaj: 150,
    plotType: 'Residential',
    cornerPlot: true,
    registryDocument: '',
    registryStatus: 'Pending',
    sideMeasurements: { front: '35', back: '35', left: '39', right: '39' },
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    plotNo: 'GV-001',
    colonyId: { _id: '2', name: 'Green Valley' },
    size: '200',
    facing: 'South',
    status: 'Sold',
    totalPrice: 15000000,
    pricePerGaj: 75000,
    areaGaj: 200,
    plotType: 'Commercial',
    cornerPlot: false,
    registryDocument: 'REG-GV-001.pdf',
    registryStatus: 'Completed',
    sideMeasurements: { front: '40', back: '40', left: '45', right: '45' },
    createdAt: '2024-01-03T00:00:00.000Z'
  }
]

export const testBookings = [
  {
    _id: '1',
    userId: { _id: '4', name: 'Mike Buyer', email: 'mike@example.com', phone: '+91 9876543213' },
    plotId: { 
      _id: '2', 
      plotNo: 'GP-002',
      colonyId: { _id: '1', name: 'Ganpanti Farms' }
    },
    totalAmount: 7500000,
    discount: 250000,
    finalAmount: 7250000,
    status: 'approved',
    paymentStatus: 'partial',
    bookingDate: '2024-01-15T00:00:00.000Z',
    remarks: 'Customer interested in corner plot',
    paymentReceipts: [
      {
        _id: '1',
        amount: 1000000,
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN123456',
        receiptDate: '2024-01-15T00:00:00.000Z',
        document: 'receipt1.pdf'
      },
      {
        _id: '2',
        amount: 500000,
        paymentMethod: 'Cheque',
        transactionId: 'CHQ789012',
        receiptDate: '2024-01-20T00:00:00.000Z',
        document: 'receipt2.pdf'
      }
    ],
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    _id: '2',
    userId: { _id: '4', name: 'Mike Buyer', email: 'mike@example.com', phone: '+91 9876543213' },
    plotId: { 
      _id: '1', 
      plotNo: 'GP-001',
      colonyId: { _id: '1', name: 'Ganpanti Farms' }
    },
    totalAmount: 6000000,
    discount: 0,
    finalAmount: 6000000,
    status: 'pending',
    paymentStatus: 'pending',
    bookingDate: '2024-01-20T00:00:00.000Z',
    remarks: 'Follow up required',
    paymentReceipts: [],
    createdAt: '2024-01-20T00:00:00.000Z'
  }
]

export const testStaff = [
  {
    _id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@jayshree.com',
    phone: '+91 9876543214',
    roleId: { _id: '2', name: 'Colony Manager' },
    profileImage: 'https://via.placeholder.com/150',
    status: 'active',
    joiningDate: '2024-01-01T00:00:00.000Z',
    salary: 50000,
    address: 'Mumbai, Maharashtra',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Priya Sharma',
    email: 'priya@jayshree.com',
    phone: '+91 9876543215',
    roleId: { _id: '3', name: 'Sales Executive' },
    profileImage: 'https://via.placeholder.com/150',
    status: 'active',
    joiningDate: '2024-01-05T00:00:00.000Z',
    salary: 35000,
    address: 'Delhi, India',
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Amit Patel',
    email: 'amit@jayshree.com',
    phone: '+91 9876543216',
    roleId: { _id: '3', name: 'Sales Executive' },
    profileImage: 'https://via.placeholder.com/150',
    status: 'active',
    joiningDate: '2024-01-10T00:00:00.000Z',
    salary: 35000,
    address: 'Bangalore, Karnataka',
    createdAt: '2024-01-10T00:00:00.000Z'
  }
]

export const testSettings = {
  company: {
    name: 'Jayshree Properties',
    email: 'info@jayshreeproperties.com',
    phone: '+91 9876543210',
    address: 'Mumbai, Maharashtra, India',
    website: 'https://jayshreeproperties.com',
    logo: 'https://via.placeholder.com/200x100',
    gstNumber: 'GST123456789',
    panNumber: 'PAN123456789'
  },
  system: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png', 'doc']
  },
  payment: {
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_123456',
    paytmEnabled: false,
    bankTransferEnabled: true,
    chequeEnabled: true,
    cashEnabled: true,
    minimumBookingAmount: 100000,
    processingFee: 1000,
    lateFee: 500
  }
}

// Mock API responses
export const mockApiResponses = {
  cities: { success: true, data: testCities },
  areas: { success: true, data: testAreas },
  roles: { success: true, data: testRoles },
  users: { success: true, data: testUsers },
  colonies: { success: true, data: testColonies },
  plots: { success: true, data: testPlots },
  bookings: { success: true, data: testBookings },
  staff: { success: true, data: testStaff },
  settings: { success: true, data: testSettings }
}
