export const config = {
  // Amazon Affiliate ID
  affiliateTag: 'your-tag-20', // TODO: Replace with real tag
  
  // AliExpress
  aliexpressAppKey: process.env.ALIEXPRESS_APP_KEY || '',
  
  // Categories to monitor
  categories: [
    { name: 'tech', keywords: ['laptop', 'headphones', 'keyboard', 'monitor', 'ssd', 'usb'], minDiscount: 30 },
    { name: 'home', keywords: ['desk', 'chair', 'lamp', 'organizer'], minDiscount: 40 },
    { name: 'gaming', keywords: ['gaming', 'controller', 'rgb', 'mechanical'], minDiscount: 25 },
    { name: 'phone', keywords: ['iphone', 'samsung', 'phone case', 'charger'], minDiscount: 35 },
  ],
  
  // Price thresholds
  minPrice: 20,
  maxPrice: 500,
  
  // How often to check (minutes)
  checkInterval: 60,
  
  // Output channels
  channels: {
    blog: true,
    twitter: false, // Enable when ready
    telegram: false,
  },
  
  // Data paths
  dataDir: '/home/obanj/smart/projects/deal-hunter/data',
  logDir: '/home/obanj/smart/projects/deal-hunter/logs',
  
  // How many deals to keep
  maxDeals: 1000,
  maxDealsPerCategory: 50,
};
