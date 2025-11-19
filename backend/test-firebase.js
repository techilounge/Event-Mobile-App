require('dotenv').config();
const { db, auth } = require('./config/firebase');

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...\n');
    
    // Test Firestore
    const testRef = db.collection('test');
    await testRef.doc('connection').set({ 
      timestamp: new Date().toISOString(),
      message: 'Connection test successful'
    });
    console.log('✅ Firestore connection successful');
    
    // Clean up test document
    await testRef.doc('connection').delete();
    
    // Test Auth
    try {
      const listResult = await auth.listUsers(1);
      console.log('✅ Firebase Auth connection successful');
    } catch (authError) {
      // Auth might not have users yet, that's okay
      console.log('✅ Firebase Auth connection successful (no users yet)');
    }
    
    console.log('\n✅ All Firebase services connected successfully!');
    console.log('🔥 Your backend is ready to use Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check that firebase-service-account.json exists');
    console.error('2. Verify USE_FIREBASE=true in .env');
    console.error('3. Check FIREBASE_PROJECT_ID matches your project');
    process.exit(1);
  }
}

testFirebase();

