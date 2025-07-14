#!/usr/bin/env node

// Script to initialize the data service and populate cache
async function initializeDataService() {
  console.log('🚀 Initializing data service...');
  
  try {
    // Import the data service
    const { serverDataService } = await import('../src/lib/server-data-service.js');
    
    console.log('📦 Data service imported successfully');
    
    // Get initial cache stats
    const initialStats = serverDataService.getCacheStats();
    console.log('📊 Initial cache stats:', initialStats);
    
    // Trigger a full data update
    console.log('🔄 Starting initial data fetch...');
    await serverDataService.updateAll();
    
    // Get updated stats
    const updatedStats = serverDataService.getCacheStats();
    console.log('✅ Data service initialized successfully!');
    console.log('📊 Final cache stats:', updatedStats);
    
    // Start periodic updates
    console.log('🔄 Starting periodic updates...');
    serverDataService.startPeriodicUpdates();
    
    console.log('🎉 Data service is now running!');
    
  } catch (error) {
    console.error('❌ Failed to initialize data service:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDataService();
}

export { initializeDataService }; 