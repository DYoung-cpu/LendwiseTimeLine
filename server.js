const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3005;

// Serve static files with no caching for development
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.js')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
    }
  }
}));

// Main route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`
    ====================================
    🚀 LendWise Landing Page is live!
    ====================================
    
    Local:    http://localhost:${PORT}
    Network:  http://127.0.0.1:${PORT}
    
    Mission Control - Coming Soon!
    ====================================
    `);
});
