const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3005;

// Serve static files
app.use(express.static(path.join(__dirname)));

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
