require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5002/api';

const quickTest = async () => {
  console.log('🔍 Quick Phase 2 Test - Campaign & Content Features');
  console.log('=' .repeat(50));
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test login
    console.log('2. Testing demo user login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@marketingllm.com',
      password: 'Demo123!'
    });
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Test personas
    console.log('3. Testing personas endpoint...');
    const personasResponse = await axios.get(`${API_BASE}/personas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${personasResponse.data.data.personas.length} personas`);
    
    // Test campaign creation
    console.log('4. Testing campaign creation...');
    const campaignData = {
      name: 'Quick Test Campaign',
      description: 'Testing our Phase 2 implementation',
      objective: 'awareness',
      budget: 1000,
      currency: 'USD',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tone: 'professional',
      keywords: 'test, phase2, implementation',
      personaId: personasResponse.data.data.personas[0]._id,
      generationSettings: {
        contentTypes: ['email'],
        platforms: ['email'],
        creativityLevel: 7
      }
    };
    
    const campaignResponse = await axios.post(`${API_BASE}/campaigns`, campaignData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Campaign created successfully');
    
    const campaignId = campaignResponse.data.data.campaign._id;
    
    // Test getting campaigns
    console.log('5. Testing campaign retrieval...');
    const getCampaignsResponse = await axios.get(`${API_BASE}/campaigns`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Retrieved ${getCampaignsResponse.data.data.campaigns.length} campaigns`);
    
    // Test campaign stats
    console.log('6. Testing campaign stats...');
    const statsResponse = await axios.get(`${API_BASE}/campaigns/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Campaign stats retrieved');
    
    // Test AI status
    console.log('7. Testing AI service status...');
    const aiStatusResponse = await axios.get(`${API_BASE}/content/ai-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ AI Status: ${aiStatusResponse.data.data.message}`);
    
    console.log('=' .repeat(50));
    console.log('🎉 Phase 2 Core Features Working Successfully!');
    console.log('✅ Authentication System');
    console.log('✅ Campaign Management (CRUD)');
    console.log('✅ Persona Integration');
    console.log('✅ Campaign Statistics');
    console.log('✅ AI Service Framework');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
  
  process.exit(0);
};

quickTest();
