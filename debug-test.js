require('dotenv').config();
const axios = require('axios');

const testCampaignCreation = async () => {
  const API_BASE = 'http://localhost:5002/api';
  
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@marketingllm.com',
      password: 'Demo123!'
    });
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    console.log('👥 Getting personas...');
    const personasResponse = await axios.get(`${API_BASE}/personas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const personaId = personasResponse.data.data.personas[0]._id;
    console.log(`✅ Got persona: ${personaId}`);
    
    console.log('📋 Creating minimal campaign...');
    const minimalCampaign = {
      name: 'Test Campaign',
      description: 'Testing',
      objective: 'awareness',
      budget: 1000,
      currency: 'USD',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      personaId: personaId
    };
    
    console.log('📤 Sending campaign data:', JSON.stringify(minimalCampaign, null, 2));
    
    const campaignResponse = await axios.post(`${API_BASE}/campaigns`, minimalCampaign, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Campaign created successfully!');
    console.log('📋 Campaign ID:', campaignResponse.data.data.campaign._id);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Errors:', error.response?.data?.errors);
    console.error('Full error:', error.message);
  }
};

testCampaignCreation();
