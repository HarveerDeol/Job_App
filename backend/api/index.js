const app = require("../src/server.js");

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  
  // Allow all Vercel deployments
  if (origin && origin.match(/^https:\/\/job-app-frontend.*\.vercel\.app$/)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return app(req, res);
};