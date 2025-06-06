// backend/utils/test-endpoints.js
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Test functions
const testEndpoints = async () => {
  log.info('Starting Backend API Tests...\n');

  try {
    // Test 1: Health check
    log.info('Testing health check endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/`, testConfig);
    if (healthResponse.status === 200) {
      log.success('Health check passed');
      console.log('Response:', healthResponse.data);
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
  }

  try {
    // Test 2: API Status
    log.info('\nTesting API status endpoint...');
    const statusResponse = await axios.get(`${API_BASE}/status`, testConfig);
    if (statusResponse.status === 200) {
      log.success('API status check passed');
      console.log('Available routes:', statusResponse.data.routes);
    }
  } catch (error) {
    log.error(`API status check failed: ${error.message}`);
  }

  try {
    // Test 3: CORS preflight
    log.info('\nTesting CORS configuration...');
    const corsResponse = await axios.options(`${API_BASE}/google-auth/google-signin`, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    if (corsResponse.status === 200 || corsResponse.status === 204) {
      log.success('CORS configuration is working');
    }
  } catch (error) {
    log.warning(`CORS test inconclusive: ${error.message}`);
  }

  try {
    // Test 4: Protected route without token (should fail)
    log.info('\nTesting protected route without token...');
    const protectedResponse = await axios.get(`${API_BASE}/protected`, testConfig);
    log.error('Protected route should have failed but didn\'t');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log.success('Protected route correctly rejected unauthorized request');
    } else {
      log.error(`Unexpected error: ${error.message}`);
    }
  }

  try {
    // Test 5: Invalid endpoint
    log.info('\nTesting 404 error handling...');
    const invalidResponse = await axios.get(`${API_BASE}/nonexistent`, testConfig);
    log.error('404 handler should have triggered but didn\'t');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log.success('404 error handling working correctly');
    } else {
      log.error(`Unexpected error: ${error.message}`);
    }
  }

  log.info('\n🏁 Backend API tests completed!');
};

// Google Auth specific tests
const testGoogleAuthEndpoints = async (idToken) => {
  if (!idToken) {
    log.warning('No ID token provided for Google Auth tests');
    return;
  }

  log.info('\nTesting Google Auth endpoints...');

  try {
    // Test Google Sign-in
    log.info('Testing Google sign-in...');
    const signinResponse = await axios.post(`${API_BASE}/google-auth/google-signin`, {
      idToken: idToken
    }, testConfig);

    if (signinResponse.status === 200) {
      log.success('Google sign-in successful');
      const { user } = signinResponse.data;
      console.log('User data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });

      // Test profile endpoint with token
      log.info('Testing profile endpoint...');
      const profileResponse = await axios.get(`${API_BASE}/google-auth/profile`, {
        ...testConfig,
        headers: {
          ...testConfig.headers,
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (profileResponse.status === 200) {
        log.success('Profile endpoint working');
      }
    }
  } catch (error) {
    log.error(`Google Auth test failed: ${error.response?.data?.error || error.message}`);
  }
};

// Main test runner
const runTests = async () => {
  console.log(`${colors.blue}🚀 Backend API Test Suite${colors.reset}`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}\n`);

  await testEndpoints();

  // Check if ID token is provided as command line argument
  const idToken = process.argv[2];
  if (idToken) {
    await testGoogleAuthEndpoints(idToken);
  } else {
    log.info('\nTo test Google Auth endpoints, provide an ID token:');
    log.info('node utils/test-endpoints.js YOUR_ID_TOKEN');
  }
};

// Export for use in other files
module.exports = {
  testEndpoints,
  testGoogleAuthEndpoints,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}