const app = require("../src/server.js");

// Vercel serverless function wrapper
module.exports = async (req, res) => {
  // Set CORS headers manually for ALL requests (including OPTIONS)
  const allowedOrigins = [
    'https://job-app-frontend-omega.vercel.app',
    /^https:\/\/job-app-frontend-.*\.vercel\.app$/
  ];

  const origin = req.headers.origin;
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') return allowed === origin;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return false;
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Pass to Express app
  return app(req, res);
};