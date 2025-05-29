# 📸 Screenshot Functionality Guide

## Overview

The Instagram AI Agent now includes screenshot functionality that can capture profile pages and send them via webhook to a specified endpoint. This feature is useful for monitoring, archiving, or analyzing Instagram profiles.

## Features

- **Profile Screenshots**: Automatically capture full-page screenshots of Instagram profiles
- **Webhook Integration**: Send screenshots to external services via HTTP POST
- **Configurable**: Enable/disable screenshots and configure webhook settings
- **Automatic Cleanup**: Old screenshots are automatically cleaned up to save disk space
- **JPG Format**: Screenshots are saved in JPG format (quality 85) for optimal file size
- **Base64 Encoding**: Screenshots are sent as base64-encoded images in webhook payload

## Configuration

### Enable/Disable Screenshots

```bash
# Enable screenshots
npm run toggle-features -- --enable-screenshots

# Disable screenshots
npm run toggle-features -- --disable-screenshots

# Check current status
npm run toggle-features -- --status
```

### Configure Webhook

```bash
# Set webhook URL
npm run toggle-features -- --set-webhook-url=https://your-webhook.com/endpoint

# Clear webhook URL
npm run toggle-features -- --clear-webhook-url
```

### Configuration File

Screenshots are configured in `src/config/interaction.json`:

```json
{
  "features": {
    "liking": true,
    "commenting": false,
    "screenshots": true
  },
  "webhook": {
    "url": "https://your-webhook.com/endpoint",
    "timeout": 10000
  }
}
```

## Webhook Payload

When a screenshot is taken, the following JSON payload is sent to your webhook URL:

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

## Webhook Implementation Examples

### Node.js Express Server

```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/webhook/screenshots', (req, res) => {
  const { profileUrl, username, filename, image, metadata } = req.body;
  
  // Save the image
  const imageBuffer = Buffer.from(image.data, 'base64');
  fs.writeFileSync(`./screenshots/${filename}`, imageBuffer);
  
  console.log(`Screenshot received for ${profileUrl}`);
  console.log(`Username: ${username}`);
  console.log(`File size: ${metadata.fileSize} bytes`);
  
  res.status(200).json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Python Flask Server

```python
from flask import Flask, request, jsonify
import base64
import os

app = Flask(__name__)

@app.route('/webhook/screenshots', methods=['POST'])
def handle_screenshot():
    data = request.json
    
    # Decode and save the image
    image_data = base64.b64decode(data['image']['data'])
    filename = data['filename']
    
    with open(f'./screenshots/{filename}', 'wb') as f:
        f.write(image_data)
    
    print(f"Screenshot received for {data['profileUrl']}")
    print(f"Username: {data['username']}")
    print(f"File size: {data['metadata']['fileSize']} bytes")
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(port=3000)
```

## File Storage

Screenshots are stored locally in the `screenshots/` directory with the following naming convention:

```
profile_{username}_{timestamp}.jpg
```

Example: `profile_johndoe_2024-01-15T10-30-00-000Z.jpg`

## Automatic Cleanup

Old screenshots are automatically cleaned up when the bot starts. By default, screenshots older than 7 days are deleted. This can be customized in the code:

```typescript
// Clean up screenshots older than 3 days
await cleanupOldScreenshots(3 * 24 * 60 * 60 * 1000);
```

## Security Considerations

1. **Webhook Security**: Ensure your webhook endpoint is secure and validates incoming requests
2. **File Size**: Screenshots can be large (1-5MB), ensure your webhook can handle large payloads
3. **Rate Limiting**: Consider implementing rate limiting on your webhook endpoint
4. **Storage**: Monitor disk space usage for local screenshot storage

## Troubleshooting

### Screenshots Not Being Taken

1. Check if screenshots are enabled:
   ```bash
   npm run toggle-features -- --status
   ```

2. Verify the profile page loads correctly
3. Check logs for error messages

### Webhook Not Receiving Data

1. Verify webhook URL is correctly configured
2. Check if the webhook endpoint is accessible
3. Monitor webhook timeout settings (default: 10 seconds)
4. Check webhook server logs for errors

### Large File Sizes

Screenshots are full-page captures but now use JPG format (quality 85) for better compression. To further reduce size:

1. Consider implementing additional image compression in your webhook handler
2. Use viewport-only screenshots instead of full-page (requires code modification)
3. Implement image optimization on the receiving end
4. Adjust JPG quality setting in the code (currently set to 85)

## Integration Examples

### Discord Webhook

```javascript
// Send screenshot to Discord channel
app.post('/webhook/screenshots', async (req, res) => {
  const { profileUrl, username, image } = req.body;
  
  const discordWebhook = 'YOUR_DISCORD_WEBHOOK_URL';
  const imageBuffer = Buffer.from(image.data, 'base64');
  
  const formData = new FormData();
  formData.append('file', imageBuffer, 'screenshot.jpg');
  formData.append('content', `Screenshot from @${username} (${profileUrl})`);
  
  await fetch(discordWebhook, {
    method: 'POST',
    body: formData
  });
  
  res.json({ success: true });
});
```

### Slack Integration

```javascript
// Send screenshot to Slack
app.post('/webhook/screenshots', async (req, res) => {
  const { profileUrl, username, image } = req.body;
  
  // Upload to Slack files API
  const slackResponse = await fetch('https://slack.com/api/files.upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channels: 'your-channel',
      content: Buffer.from(image.data, 'base64').toString('base64'),
      filename: 'profile-screenshot.jpg',
      title: `Profile Screenshot: @${username} (${profileUrl})`
    })
  });
  
  res.json({ success: true });
});
```

## Best Practices

1. **Test Your Webhook**: Always test your webhook endpoint before enabling screenshots
2. **Monitor Storage**: Regularly check disk space usage for screenshot storage
3. **Backup Important Screenshots**: Implement backup strategies for important screenshots
4. **Error Handling**: Implement proper error handling in your webhook
5. **Logging**: Log webhook activities for debugging and monitoring

## Command Reference

```bash
# Screenshot management
npm run toggle-features -- --enable-screenshots
npm run toggle-features -- --disable-screenshots

# Webhook configuration
npm run toggle-features -- --set-webhook-url=https://example.com/webhook
npm run toggle-features -- --clear-webhook-url

# Status check
npm run toggle-features -- --status
```