# 🤖 Instagram AI Agent - Comprehensive Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Content Filtering System](#content-filtering-system)
- [Screenshot Functionality](#screenshot-functionality)
- [Profile Interaction System](#profile-interaction-system)
- [AI-Powered Features](#ai-powered-features)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

**Instagram AI Agent** is an advanced AI-powered automation tool designed for Instagram social media management. It leverages cutting-edge AI models (Google Generative AI with Gemini Vision API) to automate interactions, generate engaging content, and intelligently filter real estate-relevant posts.

The agent operates in two modes:
- **Webhook Mode**: Responds to external triggers via HTTP endpoints
- **Continuous Mode**: Automatically processes predefined Instagram profiles in cycles

### Key Capabilities
- 🤖 **AI-Powered Content Generation**: Smart captions and comments using Google Generative AI
- 🖼️ **Advanced Image Analysis**: Real-time visual content analysis using Gemini Vision API
- 📸 **Profile Screenshots**: Full-page profile capture with webhook integration  
- 🎯 **Smart Content Filtering**: Multi-layer filtering for real estate relevance
- 🎬 **Reels Support**: Full support for Instagram Reels with specialized logic
- 🔄 **Configurable Features**: Toggle liking, commenting, screenshots independently
- 🌐 **Webhook Integration**: External service integration capabilities
- 🛡️ **Security Features**: Proxy support, cookie management, anti-spam measures

## Features

### Core Automation Features
- **Instagram Login**: Automatic authentication with cookie persistence
- **Profile Interaction**: Visit and interact with specific Instagram profiles  
- **Smart Content Selection**: Automatically choose between posts and reels
- **Intelligent Liking**: Like posts and reels with duplicate detection
- **AI Comments**: Generate contextual, relevant comments based on content
- **Anti-Spam Protection**: Random intervals and natural behavior simulation

### Advanced AI Features (v4.1)
- **Enhanced Caption Extraction**: Intelligent extraction of full post descriptions
- **Multi-Language Support**: Header detection in English, Ukrainian, Russian
- **Style-Based Filtering**: Advanced filtering to avoid header content
- **Combined Text & Image Analysis**: 60% text + 40% image scoring system
- **Real Estate Focus**: Specialized filtering for real estate content

### Content Filtering System (v3.0 - v4.1)
- **Multi-Post Analysis**: Analyzes up to 5 posts per profile
- **Visual Content Detection**: Property exteriors, interiors, architectural features
- **Smart Scoring**: Relevance scores from 0-100 with configurable thresholds
- **Fallback Systems**: Graceful degradation when services are unavailable

### Technical Features
- **TypeScript Implementation**: Fully typed codebase for reliability
- **Comprehensive Logging**: Winston-based logging with daily rotation
- **MongoDB Integration**: Data persistence and analytics
- **Docker Support**: MongoDB containerization
- **Error Handling**: Robust error recovery and reporting
- **Testing Suite**: Comprehensive test coverage

## Installation & Setup

### Prerequisites
- **Node.js**: Version 18.20.8 or higher (managed via Volta)
- **npm**: Comes with Node.js
- **Docker**: Required for MongoDB (optional but recommended)
- **Instagram Account**: Valid Instagram credentials

### Step 1: Clone Repository
```bash
git clone https://github.com/david-patrick-chuks/Instagram-AI-Agent.git
cd Instagram-AI-Agent
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file from the example template:

```bash
# Copy example file
cp .env.example .env
```

Configure the following variables:
```env
# Instagram Credentials
IGusername=your_instagram_username
IGpassword=your_instagram_password

# Future Social Media Platforms
Xusername=your_twitter_username
Xpassword=your_twitter_password

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/instagram-ai-agent

# AI API Keys (obtained from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3000

# Webhook Configuration (optional)
WEBHOOK_URL=https://your-webhook.com/endpoint
```

### Step 4: MongoDB Setup (Docker)

#### Option 1: Basic Setup
```bash
docker run -d -p 27017:27017 --name instagram-ai-mongodb mongodb/mongodb-community-server:latest
```

#### Option 2: Persistent Storage
```bash
docker run -d -p 27017:27017 --name instagram-ai-mongodb -v mongodb_data:/data/db mongodb/mongodb-community-server:latest
```

#### Docker Management Commands
```bash
# Check container status
docker ps

# Stop MongoDB
docker stop instagram-ai-mongodb

# Start MongoDB
docker start instagram-ai-mongodb

# Remove container
docker rm instagram-ai-mongodb

# Remove container and data
docker rm -v instagram-ai-mongodb
```

### Step 5: Verify Installation
```bash
# Check project status
npm run status

# Run tests
npm run test:content-filter
npm run test:image-analysis
npm run test:caption-extraction
```

## Configuration

### Profile Configuration
Configure target profiles in `src/config/profiles.json`:

```json
{
  "profiles": [
    "https://www.instagram.com/realestate_agent1/",
    "https://www.instagram.com/property_showcase/",
    "https://www.instagram.com/architecture_firm/"
  ]
}
```

### Feature Configuration
Control bot features via `src/config/interaction.json`:

```json
{
  "features": {
    "liking": true,
    "commenting": false,
    "screenshots": true,
    "contentFiltering": true
  },
  "contentFilter": {
    "minRelevanceScore": 70,
    "allowedCategories": [
      "residential",
      "commercial",
      "investment",
      "rental",
      "construction",
      "renovation",
      "market_analysis"
    ]
  },
  "webhook": {
    "url": "https://your-webhook.com/endpoint",
    "timeout": 10000
  },
  "timing": {
    "delayBetweenProfiles": [15000, 25000],
    "delayBetweenCycles": [60000, 90000],
    "delayOnError": 30000
  }
}
```

## Usage

### Quick Start Commands

#### Basic Operations
```bash
# Start agent in continuous mode
npm start

# Start agent with profiles flag (continuous profile processing)
npm start -- --profiles

# Check current feature status
npm run status
```

#### Feature Management
```bash
# Enable/disable commenting
npm run toggle-features -- --enable-commenting
npm run toggle-features -- --disable-commenting

# Enable/disable liking
npm run toggle-features -- --enable-liking
npm run toggle-features -- --disable-liking

# Enable/disable screenshots
npm run toggle-features -- --enable-screenshots
npm run toggle-features -- --disable-screenshots

# Enable/disable content filtering
npm run toggle-features -- --enable-content-filtering
npm run toggle-features -- --disable-content-filtering

# Configure webhook URL
npm run toggle-features -- --set-webhook-url=https://your-webhook.com/endpoint
npm run toggle-features -- --clear-webhook-url
```

#### Testing & Validation
```bash
# Test caption extraction (v4.1)
npm run test:caption-extraction

# Test image analysis
npm run test:image-analysis

# Test content filtering
npm run test:content-filter
```

### Operation Modes

#### Continuous Mode
```bash
npm start -- --profiles
```
- Continuously processes profiles from `profiles.json`
- Runs in cycles with configurable delays
- Automatic retry on errors
- Suitable for 24/7 automation

#### Webhook Mode
```bash
npm start
```
- Responds to external webhook triggers
- HTTP endpoints for external integration
- Manual control over processing
- Suitable for event-driven automation

## Content Filtering System

### Evolution History

#### v1.0 - Basic Filtering
- Simple keyword-based filtering
- Manual relevance scoring
- Single post analysis

#### v2.0 - Multi-Post Analysis
- Analyzes up to 5 posts per profile
- Smart post selection with highest relevance
- Improved accuracy and coverage

#### v3.0 - Gemini Vision Integration
- Real-time image analysis using Gemini Vision API
- Combined text (60%) and image (40%) scoring
- Advanced visual content detection

#### v4.1 - Enhanced Caption Extraction
- Intelligent header content filtering
- Multi-language support (English, Ukrainian, Russian)
- Style-based content validation
- Improved text extraction accuracy

### Current Capabilities (v4.1)

#### Text Analysis Features
- **Smart Caption Extraction**: Full post descriptions with hashtags
- **Header Filtering**: Excludes usernames, follow buttons, navigation
- **Style Validation**: Filters bold header text and UI elements
- **Content Validation**: Ensures meaningful, relevant text content

#### Visual Analysis Features
- **Property Detection**: Exteriors, interiors, architectural features
- **Real Estate Elements**: Signage, branding, amenities, floor plans
- **Professional Content**: Agents, viewings, construction work
- **Contextual Analysis**: Property-related vs. personal content

#### Scoring System
```typescript
// Combined scoring formula
finalScore = (textScore * 0.6) + (imageScore * 0.4)

// Relevance categories
enum RelevanceCategory {
  residential = "residential",
  commercial = "commercial", 
  investment = "investment",
  rental = "rental",
  construction = "construction",
  renovation = "renovation",
  market_analysis = "market_analysis",
  not_relevant = "not_relevant"
}
```

### Configuration Examples

#### High Precision (Conservative)
```json
{
  "contentFilter": {
    "minRelevanceScore": 85,
    "allowedCategories": ["residential", "commercial"]
  }
}
```

#### Balanced (Recommended)
```json
{
  "contentFilter": {
    "minRelevanceScore": 70,
    "allowedCategories": [
      "residential", "commercial", "investment", 
      "rental", "construction", "renovation"
    ]
  }
}
```

#### High Coverage (Permissive)
```json
{
  "contentFilter": {
    "minRelevanceScore": 60,
    "allowedCategories": [
      "residential", "commercial", "investment",
      "rental", "construction", "renovation", 
      "market_analysis"
    ]
  }
}
```

## Screenshot Functionality

### Overview
The screenshot system captures full-page Instagram profiles and sends them to external services via webhooks, enabling profile monitoring, archiving, and analysis.

### Features
- **Full-Page Capture**: Complete profile screenshots including all visible content
- **JPG Optimization**: Quality 85 compression for optimal file size
- **Webhook Delivery**: Automatic sending to configured endpoints
- **Base64 Encoding**: Ready-to-use image data in webhook payload
- **Automatic Cleanup**: Configurable retention policy for local files

### Webhook Payload Structure
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

### Implementation Examples

#### Node.js Express Webhook Handler
```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/webhook/screenshots', (req, res) => {
  const { profileUrl, username, filename, image, metadata } = req.body;
  
  // Save screenshot
  const imageBuffer = Buffer.from(image.data, 'base64');
  fs.writeFileSync(`./screenshots/${filename}`, imageBuffer);
  
  console.log(`Screenshot captured: ${profileUrl}`);
  console.log(`File size: ${metadata.fileSize} bytes`);
  
  res.status(200).json({ success: true });
});
```

#### Python Flask Webhook Handler
```python
from flask import Flask, request, jsonify
import base64
import os

app = Flask(__name__)

@app.route('/webhook/screenshots', methods=['POST'])
def handle_screenshot():
    data = request.json
    
    # Decode and save image
    image_data = base64.b64decode(data['image']['data'])
    filename = data['filename']
    
    with open(f'./screenshots/{filename}', 'wb') as f:
        f.write(image_data)
    
    return jsonify({'success': True})
```

## Profile Interaction System

### Interaction Workflow

1. **Profile Loading**: Read target profiles from configuration
2. **Login & Authentication**: Instagram login with cookie persistence  
3. **Profile Iteration**: Visit each profile sequentially
4. **Content Discovery**: Find latest posts or reels
5. **Content Analysis**: Apply filtering and relevance scoring
6. **Interaction Execution**: Like, comment, or screenshot based on configuration
7. **Cycle Management**: Wait between profiles and cycles

### Content Selection Algorithm

```typescript
// Content selection logic
1. Scan profile for available content types (posts, reels)
2. Apply random selection: 50% chance for reels if both available
3. Fallback to available type if one is missing
4. Apply content filtering if enabled
5. Select highest scoring content for interaction
```

### Anti-Spam Protection

#### Timing Randomization
```json
{
  "timing": {
    "delayBetweenProfiles": [15000, 25000],  // 15-25 seconds
    "delayBetweenCycles": [60000, 90000],     // 1-1.5 minutes  
    "delayOnError": 30000                     // 30 seconds
  }
}
```

#### Duplicate Detection
- Like button state verification
- Comment history checking
- Profile interaction tracking

#### Natural Behavior Simulation
- Random timing variations
- Human-like interaction patterns
- Error recovery and retry logic

## AI-Powered Features

### Content Generation

#### AI Comment Generation
```typescript
// AI-powered commenting system
const comment = await generateComment({
  content: extractedCaption,
  contentType: 'post' | 'reel',
  maxLength: 300,
  style: 'professional_empathetic'
});
```

#### Comment Characteristics
- **Relevance**: Based on actual post content
- **Length**: Optimized for engagement (50-300 characters)
- **Style**: Professional, empathetic, real estate-focused
- **Safety**: Compliant with Instagram community standards

### AI Training Capabilities

The agent supports training with various content types:

#### Training Data Sources
- 🎥 **YouTube Videos**: Extract and analyze video content
- 🎙️ **Audio Files**: Process spoken content and transcripts
- 🌐 **Websites**: Scrape and analyze web content  
- 📄 **Documents**: PDF, DOC, DOCX, TXT file processing

#### Training Commands
```bash
# Train with website content
npm run train:link

# Train with audio files  
npm run train:audio

# Train AI model
npm run train-model
```

### AI Models Used

#### Google Generative AI (Gemini)
- **Model**: `gemini-2.0-flash`
- **Capabilities**: Text generation, image analysis, content understanding
- **Use Cases**: Comment generation, content analysis, relevance scoring

#### Content Analysis Pipeline
1. **Text Extraction**: Enhanced caption extraction with header filtering
2. **Image Processing**: Automatic image capture and base64 conversion
3. **AI Analysis**: Parallel text and image analysis using Gemini
4. **Score Combination**: Weighted scoring (60% text, 40% image)
5. **Decision Making**: Relevance thresholding and category filtering

## Project Structure

```
Instagram-AI-Agent/
├── src/
│   ├── Agent/              # AI agent logic and training
│   │   ├── characters/     # AI character definitions
│   │   ├── training/       # Training scripts and data processing
│   │   ├── index.ts        # Agent initialization
│   │   └── imageAnalysis.ts # Gemini Vision API integration
│   ├── client/             # Instagram interaction logic
│   │   └── profileInteraction.ts # Profile processing and interaction
│   ├── config/             # Configuration files
│   │   ├── profiles.json   # Target Instagram profiles
│   │   ├── interaction.json # Feature configuration
│   │   └── logger.ts       # Logging configuration
│   ├── controllers/        # HTTP controllers
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   │   ├── configLoader.ts # Configuration management
│   │   ├── cookieManager.ts # Cookie persistence
│   │   └── errorHandler.ts # Error handling
│   ├── test/               # Test suites
│   │   ├── contentFilterTest.ts
│   │   ├── imageAnalysisTest.ts
│   │   └── captionExtractionTest.ts
│   ├── scripts/            # Build and utility scripts
│   ├── types/              # TypeScript type definitions
│   └── index.ts            # Application entry point
├── build/                  # Compiled JavaScript output
├── logs/                   # Application logs
├── screenshots/            # Captured profile screenshots
├── cookies/                # Saved browser cookies
├── examples/               # Usage examples and samples
├── Guides/                 # Additional documentation
├── docs/                   # Generated documentation
├── package.json            # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env                   # Environment variables
└── README.md              # Project overview
```

### Key Files & Directories

#### Core Application
- `src/index.ts`: Main application entry point with mode selection
- `src/app.ts`: Express application setup and routing
- `src/client/profileInteraction.ts`: Instagram interaction logic

#### AI & Content Analysis  
- `src/Agent/imageAnalysis.ts`: Gemini Vision API integration
- `src/utils/configLoader.ts`: Content filtering and analysis
- `src/Agent/training/`: AI model training scripts

#### Configuration
- `src/config/profiles.json`: Target Instagram profiles
- `src/config/interaction.json`: Feature toggles and settings
- `.env`: Environment variables and credentials

#### Testing
- `src/test/`: Comprehensive test suites for all features
- Tests cover caption extraction, image analysis, and content filtering

## API Reference

### HTTP Endpoints

#### Server Information
```http
GET /health
# Returns: { status: "ok", timestamp: "..." }

GET /status  
# Returns: Current bot configuration and feature status

GET /
# Returns: API documentation and available endpoints
```

#### Webhook Endpoints
```http
POST /webhook
# Trigger manual profile processing
# Body: { "profiles": ["url1", "url2"] } (optional)

POST /webhook/screenshots
# Receive screenshot data from external systems
# Body: Screenshot payload format (see Screenshot section)
```

### Configuration API

#### Feature Management
```bash
# Toggle features via CLI
npm run toggle-features -- [options]

Options:
  --enable-commenting     Enable AI commenting
  --disable-commenting    Disable AI commenting
  --enable-liking        Enable post/reel liking
  --disable-liking       Disable post/reel liking
  --enable-screenshots   Enable profile screenshots
  --disable-screenshots  Disable profile screenshots
  --enable-content-filtering   Enable AI content filtering
  --disable-content-filtering  Disable AI content filtering
  --set-webhook-url=URL  Set webhook endpoint URL
  --clear-webhook-url    Clear webhook endpoint URL
  --status              Show current configuration
```

### Response Formats

#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Standard Error Response  
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Status Response
```json
{
  "features": {
    "liking": true,
    "commenting": false,
    "screenshots": true,
    "contentFiltering": true
  },
  "profiles": {
    "total": 5,
    "configured": ["url1", "url2", "..."]
  },
  "lastActivity": "2024-01-15T10:30:00.000Z",
  "uptime": "2h 15m 30s"
}
```

## Testing

### Test Suites

#### Caption Extraction Test
```bash
npm run test:caption-extraction
```
**Validates:**
- Smart selector functionality
- Header content filtering  
- Multi-language support
- Style-based validation

#### Image Analysis Test
```bash
npm run test:image-analysis
```
**Validates:**
- Gemini Vision API connectivity
- Image processing pipeline
- Error handling and fallbacks
- Analysis accuracy

#### Content Filter Test
```bash
npm run test:content-filter
```
**Validates:**
- Text analysis accuracy
- Category classification
- Score calculation
- Threshold application

### Test Coverage

#### Caption Extraction (v4.1)
```
✅ Found caption using enhanced selectors
📝 Extracted full post description (386 chars)
✅ Avoided header content (username • Follow)
✅ Multi-language header detection
✅ Style-based filtering active
🎉 Caption extraction test PASSED!
```

#### Image Analysis (v3.0)
```
📸 Testing Gemini Vision API connectivity...
✅ Image analysis test completed successfully!
🖼️ Correctly identified test image relevance
✅ Base64 encoding/decoding functional
🎉 Image analysis test PASSED!
```

#### Content Filtering (v4.1)
```
🎯 Testing content relevance analysis...
✅ Test Results: 8/8 tests passed
📊 Accuracy: 100% on test dataset
🎉 All content filtering tests PASSED!
```

### Continuous Integration

#### Automated Testing
- Run tests before each deployment
- Validate all critical functionality
- Ensure API compatibility
- Check feature toggling

#### Test Data Management
- Mock Instagram content for testing
- Real estate sample data
- Edge case scenarios
- Multi-language test cases

## Troubleshooting

### Common Issues & Solutions

#### Installation Problems

**Issue**: `npm install` fails with dependency errors
```bash
# Solution: Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript compilation errors
```bash
# Solution: Update TypeScript and rebuild
npm install -g typescript@latest
npm install typescript@latest
npm start
```

#### Authentication Issues

**Issue**: Instagram login fails
```bash
# Solutions:
1. Verify credentials in .env file
2. Check for account restrictions
3. Clear cookies: rm -rf cookies/*
4. Try manual login first
```

**Issue**: Session expires frequently
```bash
# Solutions:
1. Enable cookie persistence
2. Reduce activity frequency
3. Use different IP/proxy
4. Check account security settings
```

#### Content Filtering Issues

**Issue**: All posts marked as irrelevant
```bash
# Diagnosis:
npm run test:content-filter

# Solutions:
1. Lower relevance threshold (min 60-70)
2. Add more allowed categories
3. Check Gemini API key validity
4. Review profile content manually
```

**Issue**: Caption extraction returns usernames
```bash
# Diagnosis:
npm run test:caption-extraction

# Solutions:
1. Instagram layout may have changed
2. Update selectors in profileInteraction.ts
3. Clear browser cache
4. Check for login issues
```

#### Performance Issues

**Issue**: Slow processing speed
```bash
# Solutions:
1. Reduce number of profiles
2. Increase timing intervals
3. Disable content filtering temporarily
4. Check system resources
```

**Issue**: Memory usage increasing
```bash
# Solutions:
1. Restart bot regularly
2. Clear logs and screenshots
3. Reduce screenshot quality
4. Monitor browser instances
```

#### API Connectivity Issues

**Issue**: Gemini API failures
```bash
# Diagnosis:
1. Check API key validity
2. Verify rate limits
3. Test connectivity: npm run test:image-analysis

# Solutions:
1. Regenerate API key
2. Implement retry logic
3. Enable fallback to text-only
```

### Debugging Tools

#### Logging Analysis
```bash
# View recent logs
tail -f logs/app-YYYY-MM-DD.log

# Search for errors
grep -i error logs/app-*.log

# Monitor API calls
grep -i "gemini\|api" logs/app-*.log
```

#### Debug Mode
```bash
# Enable verbose logging
DEBUG=true npm start

# Enable browser DevTools
HEADLESS=false npm start
```

#### Health Checks
```bash
# System status
npm run status

# Test all components
npm run test:caption-extraction
npm run test:image-analysis  
npm run test:content-filter

# Verify configuration
cat src/config/interaction.json
```

### Recovery Procedures

#### Complete Reset
```bash
# Stop all processes
pkill -f "node.*instagram"

# Clear temporary data
rm -rf cookies/* screenshots/* logs/*

# Reset configuration
cp src/config/interaction.json.example src/config/interaction.json

# Restart fresh
npm start
```

#### Profile List Reset
```bash
# Backup current profiles
cp src/config/profiles.json src/config/profiles.json.backup

# Start with minimal profile set
echo '{"profiles": ["https://www.instagram.com/test_profile/"]}' > src/config/profiles.json

# Test and gradually add more profiles
```

## Contributing

### Development Setup

```bash
# Fork and clone repository
git clone https://github.com/your-username/Instagram-AI-Agent.git
cd Instagram-AI-Agent

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run test:content-filter
npm run test:image-analysis
npm run test:caption-extraction

# Commit and push
git commit -m "Add your feature description"
git push origin feature/your-feature-name

# Create pull request
```

### Code Standards

#### TypeScript Standards
- Use strict TypeScript configuration
- Implement proper type definitions
- Follow naming conventions
- Add comprehensive comments

#### Testing Requirements
- Write tests for new features
- Maintain existing test coverage
- Test edge cases and error scenarios
- Update documentation

#### Documentation Standards
- Update relevant documentation files
- Include code examples
- Document API changes
- Maintain changelog

### Feature Development Guidelines

#### Content Filtering Enhancements
- Test with diverse content types
- Validate multi-language support
- Ensure backward compatibility
- Monitor performance impact

#### AI Integration Improvements
- Test API reliability
- Implement proper error handling
- Consider rate limiting
- Validate response quality

#### UI/UX Improvements
- Maintain CLI consistency
- Provide clear error messages
- Enhance logging output
- Improve configuration management

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### MIT License Summary

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

### Third-Party Licenses

This project uses several open-source libraries. Key dependencies include:

- **Google Generative AI**: Google's terms of service apply
- **Puppeteer**: Apache License 2.0
- **Express.js**: MIT License
- **TypeScript**: Apache License 2.0
- **Winston**: MIT License

## Acknowledgements

### Technology Partners
- **Google AI**: For providing the Generative AI and Gemini Vision APIs
- **Instagram**: For providing the platform and APIs
- **Puppeteer Team**: For browser automation capabilities
- **Node.js Community**: For the robust JavaScript runtime

### Open Source Libraries
- **puppeteer & puppeteer-extra**: Browser automation and stealth plugins
- **@google/generative-ai**: Google's Generative AI SDK
- **express**: Web application framework
- **winston**: Logging library
- **mongoose**: MongoDB object modeling
- **typescript**: Typed JavaScript development

### Documentation Credits
- Technical writing and documentation structure
- Code examples and implementation guides
- Testing frameworks and quality assurance
- Community contributions and feedback

---

**Version**: 4.1.0  
**Last Updated**: January 2024  
**Documentation Maintained By**: Instagram AI Agent Development Team

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/david-patrick-chuks/Instagram-AI-Agent) or contact the development team. 