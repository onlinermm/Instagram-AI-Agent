const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Increase payload limit for large screenshots
app.use(express.json({ limit: '50mb' }));

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'received-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Webhook endpoint for receiving screenshots
app.post('/webhook/screenshots', (req, res) => {
  try {
    const { profileUrl, username, timestamp, filename, image, metadata } = req.body;
    
    console.log('\n📸 Screenshot received!');
    console.log(`Profile: ${profileUrl}`);
    console.log(`Username: ${username}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Filename: ${filename}`);
    console.log(`File size: ${metadata.fileSize} bytes`);
    
    // Decode and save the image
    const imageBuffer = Buffer.from(image.data, 'base64');
    const filePath = path.join(screenshotsDir, filename);
    
    fs.writeFileSync(filePath, imageBuffer);
    console.log(`✅ Screenshot saved to: ${filePath}`);
    
    // Respond with success
    res.status(200).json({ 
      success: true, 
      message: 'Screenshot received and saved',
      savedPath: filePath,
      username: username,
      profileUrl: profileUrl
    });
    
  } catch (error) {
    console.error('❌ Error processing screenshot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    screenshotsReceived: fs.readdirSync(screenshotsDir).length
  });
});

// List received screenshots
app.get('/screenshots', (req, res) => {
  try {
    const files = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.jpg'))
      .map(file => {
        const filePath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    res.json({
      total: files.length,
      screenshots: files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve screenshot files
app.get('/screenshots/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(screenshotsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Screenshot not found' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
  console.log(`📸 Screenshots will be saved to: ${screenshotsDir}`);
  console.log('\nEndpoints:');
  console.log(`  POST /webhook/screenshots - Receive screenshots`);
  console.log(`  GET  /health             - Health check`);
  console.log(`  GET  /screenshots        - List received screenshots`);
  console.log(`  GET  /screenshots/:file  - View specific screenshot`);
  console.log('\nTo configure the bot to use this webhook:');
  console.log(`  npm run toggle-features -- --set-webhook-url=http://localhost:${PORT}/webhook/screenshots`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook server...');
  process.exit(0);
}); 