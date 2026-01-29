const app = require("../src/server.js");

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    origin: origin,
    headers: req.headers
  });
  
  // Allow all Vercel deployments + localhost for development
  const allowedPatterns = [
    /^https:\/\/job-app-frontend.*\.vercel\.app$/,
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/
  ];
  
  const isAllowed = origin && allowedPatterns.some(pattern => pattern.test(origin));
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    console.log('CORS headers set for origin:', origin);
  } else {
    console.log('Origin not allowed:', origin);
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Pass to Express
  return app(req, res);
};