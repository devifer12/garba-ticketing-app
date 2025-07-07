const admin = require("../firebase/admin");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    // Verify ID Token (not custom token)
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log("Auth error:", err.message);
    }
    res.status(401).json({
      error: "Invalid token",
      details:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Authentication failed",
    });
  }
};

module.exports = verifyToken;