const { HttpTestClient } = require('./dist/http/HttpTestClient.js');

async function testAuth() {
  console.log('Testing authentication...');
  
  const client = new HttpTestClient({
    timeout: 10000  // 10 seconds
  });
  
  // Test 1: Without auth
  console.log('\n1. Testing without auth:');
  try {
    const res1 = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ Success without auth:', res1.status);
  } catch (err) {
    console.log('❌ Error without auth:', err.message);
  }
  
  // Test 2: With Bearer auth
  console.log('\n2. Testing with Bearer auth:');
  try {
    client.setAuth({
      type: 'bearer',
      token: 'dummy-token-123'
    });
    const res2 = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ Success with Bearer auth:', res2.status);
  } catch (err) {
    console.log('❌ Error with Bearer auth:', err.message);
  }
  
  // Test 3: Clear auth and test again
  console.log('\n3. Testing after clearing auth:');
  try {
    client.clearAuthToken();
    const res3 = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ Success after clearing auth:', res3.status);
  } catch (err) {
    console.log('❌ Error after clearing auth:', err.message);
  }
}

testAuth().catch(console.error);