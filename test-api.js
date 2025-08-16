require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  companyName: 'Test Company'
};

const testPersona = {
  name: 'Test Persona',
  description: 'A test persona for verification',
  demographics: {
    age: '25-35',
    income: '$50K-$75K',
    location: 'Test City'
  },
  psychographics: {
    values: ['Innovation', 'Quality'],
    interests: ['Technology', 'Business']
  },
  painPoints: ['Limited time', 'Budget constraints'],
  goals: ['Increase efficiency', 'Save money'],
  preferredChannels: ['email', 'linkedin']
};

// Helper function for API requests
const apiRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('🏥 Testing health check...');
  const result = await apiRequest('GET', '/health');
  console.log(result.success ? '✅ Health check passed' : '❌ Health check failed');
  return result.success;
};

const testUserRegistration = async () => {
  console.log('👤 Testing user registration...');
  const result = await apiRequest('POST', '/auth/register', testUser);
  
  if (result.success) {
    authToken = result.data.data.accessToken;
    console.log('✅ User registration successful');
    return true;
  } else {
    console.log('❌ User registration failed:', result.error.message);
    return false;
  }
};

const testUserLogin = async () => {
  console.log('🔐 Testing user login...');
  const result = await apiRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success) {
    authToken = result.data.data.accessToken;
    console.log('✅ User login successful');
    return true;
  } else {
    console.log('❌ User login failed:', result.error.message);
    return false;
  }
};

const testDemoLogin = async () => {
  console.log('🔐 Testing demo user login...');
  const result = await apiRequest('POST', '/auth/login', {
    email: 'demo@marketingllm.com',
    password: 'Demo123!'
  });
  
  if (result.success) {
    authToken = result.data.data.accessToken;
    console.log('✅ Demo user login successful');
    return true;
  } else {
    console.log('❌ Demo user login failed:', result.error.message);
    return false;
  }
};

const testGetProfile = async () => {
  console.log('👤 Testing get profile...');
  const result = await apiRequest('GET', '/auth/profile', null, authToken);
  console.log(result.success ? '✅ Get profile successful' : '❌ Get profile failed');
  return result.success;
};

const testGetPersonas = async () => {
  console.log('👥 Testing get personas...');
  const result = await apiRequest('GET', '/personas', null, authToken);
  
  if (result.success) {
    console.log(`✅ Get personas successful - Found ${result.data.count} personas`);
    return true;
  } else {
    console.log('❌ Get personas failed:', result.error.message);
    return false;
  }
};

const testCreatePersona = async () => {
  console.log('➕ Testing create persona...');
  const result = await apiRequest('POST', '/personas', testPersona, authToken);
  
  if (result.success) {
    console.log('✅ Create persona successful');
    return result.data.data.persona._id;
  } else {
    console.log('❌ Create persona failed:', result.error.message);
    return null;
  }
};

const testUpdatePersona = async (personaId) => {
  console.log('✏️ Testing update persona...');
  const updatedData = {
    ...testPersona,
    name: 'Updated Test Persona',
    description: 'An updated test persona'
  };
  
  const result = await apiRequest('PUT', `/personas/${personaId}`, updatedData, authToken);
  console.log(result.success ? '✅ Update persona successful' : '❌ Update persona failed');
  return result.success;
};

const testDeletePersona = async (personaId) => {
  console.log('🗑️ Testing delete persona...');
  const result = await apiRequest('DELETE', `/personas/${personaId}`, null, authToken);
  console.log(result.success ? '✅ Delete persona successful' : '❌ Delete persona failed');
  return result.success;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API Tests...');
  console.log('=' .repeat(50));
  
  let passedTests = 0;
  let totalTests = 0;
  
  const tests = [
    testHealthCheck,
    testUserRegistration,
    testUserLogin,
    testGetProfile,
    testGetPersonas,
    async () => {
      const personaId = await testCreatePersona();
      if (personaId) {
        totalTests += 2; // count update and delete tests
        const updateSuccess = await testUpdatePersona(personaId);
        const deleteSuccess = await testDeletePersona(personaId);
        return updateSuccess && deleteSuccess;
      }
      return false;
    }
  ];
  
  // Run tests with demo user login as fallback
  for (const test of tests) {
    totalTests++;
    try {
      const result = await test();
      if (result) passedTests++;
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
      
      // If registration fails, try demo login
      if (test === testUserRegistration) {
        console.log('💡 Trying demo user login instead...');
        const demoResult = await testDemoLogin();
        if (demoResult) passedTests++;
      }
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📋 Available Demo Credentials:');
  console.log('   📧 Email: demo@marketingllm.com');
  console.log('   🔑 Password: Demo123!');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run the tests
runTests();
