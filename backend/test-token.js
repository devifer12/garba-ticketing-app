const admin = require('./firebase/admin');
const axios = require('axios'); // Install with: npm install axios

const TEST_EMAIL = "heet@example.com";
const TEST_PASSWORD = "heet1234";

(async () => {
  try {
    // 1. Get Firebase project API key
    const apiKey = process.env.VITE_FIREBASE_API_KEY; // From Firebase Console > Project Settings

    // 2. Sign in to get ID token (simulates client login)
    const { data } = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        returnSecureToken: true
      }
    );

    console.log("ID TOKEN FOR POSTMAN:\n", data.idToken);
  } catch (err) {
    console.error("Error:", err.response?.data?.error || err.message);
  }
})();