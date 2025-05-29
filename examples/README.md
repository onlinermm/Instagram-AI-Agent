# 📸 Webhook Server Example

This is a simple Express.js server that demonstrates how to receive and handle screenshot webhooks from the Instagram AI Agent.

## Features

- Receives screenshot webhooks via HTTP POST
- Saves screenshots to local filesystem
- Provides REST API to list and view screenshots
- Health check endpoint
- Automatic directory creation

## Quick Start

1. **Install dependencies**:
   ```bash
   cd examples
   npm install
   ```

2. **Start the webhook server**:
   ```bash
   npm start
   ```

3. **Configure the Instagram AI Agent**:
   ```bash
   # From the main project directory
   npm run toggle-features -- --set-webhook-url=http://localhost:3000/webhook/screenshots
   npm run toggle-features -- --enable-screenshots
   ```

4. **Run the Instagram AI Agent**:
   ```bash
   # From the main project directory
   npm start
   ```

## API Endpoints

### POST /webhook/screenshots
Receives screenshot data from the Instagram AI Agent.

**Request Body:**
```json
{
  "profileUrl": "https://www.instagram.com/username/",
  "username": "username",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "filename": "profile_username_2024-01-15T10-30-00-000Z.jpg",
  "image": {
    "data": "base64-encoded-image-data",
    "type": "image/jpeg"
  },
  "metadata": {
    "fileSize": 1234567,
    "capturedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Screenshot received and saved",
  "savedPath": "/path/to/screenshot.png",
  "username": "username",
  "profileUrl": "https://www.instagram.com/username/"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "screenshotsReceived": 5
}
```

### GET /screenshots
List all received screenshots.

**Response:**
```json
{
  "total": 3,
  "screenshots": [
    {
      "filename": "profile_user1_2024-01-15T10-30-00-000Z.jpg",
      "size": 1234567,
      "created": "2024-01-15T10:30:00.000Z",
      "modified": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /screenshots/:filename
View a specific screenshot file.

## File Storage

Screenshots are saved in the `received-screenshots/` directory with the original filename from the webhook payload.

## Development

For development with auto-reload:

```bash
npm run dev
```

## Customization

You can modify the webhook server to:

- Send screenshots to cloud storage (AWS S3, Google Cloud Storage, etc.)
- Forward screenshots to other services (Discord, Slack, etc.)
- Process images (resize, compress, analyze)
- Store metadata in a database
- Implement authentication and security

## Example Integrations

### Send to Discord

```javascript
app.post('/webhook/screenshots', async (req, res) => {
  const { profileUrl, image } = req.body;
  
  // Save locally
  const imageBuffer = Buffer.from(image.data, 'base64');
  // ... save logic ...
  
  // Send to Discord
  const discordWebhook = 'YOUR_DISCORD_WEBHOOK_URL';
  const formData = new FormData();
  formData.append('file', imageBuffer, 'screenshot.jpg');
  formData.append('content', `Screenshot from ${profileUrl}`);
  
  await fetch(discordWebhook, {
    method: 'POST',
    body: formData
  });
  
  res.json({ success: true });
});
```

### Upload to AWS S3

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

app.post('/webhook/screenshots', async (req, res) => {
  const { filename, image } = req.body;
  
  const imageBuffer = Buffer.from(image.data, 'base64');
  
  const uploadParams = {
    Bucket: 'your-bucket-name',
    Key: `screenshots/${filename}`,
    Body: imageBuffer,
    ContentType: 'image/jpeg'
  };
  
  await s3.upload(uploadParams).promise();
  
  res.json({ success: true });
});
```

## Security Considerations

- Implement authentication for production use
- Validate incoming webhook data
- Set up rate limiting
- Use HTTPS in production
- Monitor disk space usage
- Implement proper error handling and logging 