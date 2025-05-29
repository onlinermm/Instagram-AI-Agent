## Instagram-AI-Agent 🌸

Instagram-AI-Agent is an AI-powered automation tool designed for **Instagram** to automate social media interactions such as posting, liking, and commenting. It leverages advanced AI models to generate engaging content, automate interactions, and manage Instagram accounts efficiently.

Before using the automation features, you can personalize the agent by training with the following, including:

- **YouTube Video URL** 🎥
- **Audio File** 🎙️
- **Portfolio or Website Link** 🌐
- **File Formats Supported**: PDF, DOC, DOCX, TXT 📄

## Features

- **Instagram Automation**: Automatically log in, post photos, like posts and reels, and leave thoughtful comments.
- **AI-Powered Content Generation**: Use Google Generative AI to create engaging captions and comments.
- **Smart Content Filtering v3.0**: AI-powered filtering with **Gemini Vision API** to analyze both text and images for real estate relevance.
- **Image Analysis**: Real-time visual content analysis using Gemini Vision API to identify property-related images.
- **Combined Analysis**: Intelligent scoring system that combines text (60%) and image (40%) analysis for better accuracy.
- **Reels Support**: Full support for Instagram Reels with specialized interaction logic.
- **Smart Content Selection**: Automatically chooses between posts and reels when both are available.
- **Profile Screenshots**: Capture full-page screenshots of Instagram profiles and send them via webhook.
- **Configurable Features**: Enable/disable liking, commenting, screenshots, and content filtering independently.
- **Webhook Integration**: Send screenshots and data to external services via HTTP POST.
- **Proxy Support**: Use proxies to manage multiple accounts and avoid rate limits.
- **Cookie Management**: Save and load cookies to maintain sessions across restarts.

**Upcoming Features:**

- **Twitter Automation**: (Coming soon) Automatically tweet, retweet, and like tweets.
- **GitHub Automation**: (Coming soon) Automatically manage repositories, issues, and pull requests.

## Installation

1. **Clone the repository**:

   ```sh
   git clone https://github.com/david-patrick-chuks/Instagram-AI-Agent.git
   cd Instagram-AI-Agent
   ```

2. **Install dependencies**:

   ```sh
   npm install
   ```

3. **Set up environment variables**:
   Rename the [.env.example](http://_vscodecontentref_/1) file to [.env](http://_vscodecontentref_/1) in the root directory and add your Instagram credentials. Refer to the [.env.example](http://_vscodecontentref_/2) file for the required variables.
   ```dotenv # Instagram credentials
   IGusername=your_instagram_username
   IGpassword=your_instagram_password 
   
   Xusername= #Twitter username
   Xpassword= #Twitter password

   MONGODB_URI= #MongoDB URI
   ```

## MongoDB Setup (Using Docker)

1. **Install Docker**:
   If you don't have Docker installed, download and install it from the [official website](https://www.docker.com/products/docker-desktop/)
2. **Run MongoDB using Docker Container**:

    **Option 1:**
      ```sh
      docker run -d -p 27017:27017 --name instagram-ai-mongodb mongodb/mongodb-community-server:latest
      ```
    **Option 2:**
      ```sh
      docker run -d -p 27017:27017 --name instagram-ai-mongodb -v mongodb_data:/data/db mongodb/mongodb-community-server:latest
      ```   
      (Option 2: use this if you want to have like a permanent storage in you so your data won't be lost or remove if you stop or remove your Docker container)
3. **Modify the MONGODB_URI in the .env file**:
   ```dotenv
   MONGODB_URI=mongodb://localhost:27017/instagram-ai-agent
   ```
4. **Verify the connection**:
   Open a new terminal and run the following command:
   ```sh
   docker ps
   ```
   You should see the MongoDB container running.

   Docker Commands (Additional Info):
   - To stop the MongoDB container:
     ```sh
     docker stop instagram-ai-mongodb
     ```
   - To start the MongoDB container:
       ```sh
       docker start instagram-ai-mongodb
       ```
   - To remove the MongoDB container:
      ```sh
      docker rm instagram-ai-mongodb
      ```
   - To remove the MongoDB container and its data:
      ```sh
      docker rm -v instagram-ai-mongodb
      ```

## Usage

1. **Run the Instagram agent**:
   ```sh
   npm start
   ```

**Upcoming Features:**

- **Run the Twitter agent** (Coming soon):

  ```sh
  npm run start:twitter
  ```

- **Run the GitHub agent** (Coming soon):
  ```sh
  npm run start:github
  ```

## Feature Configuration

The bot supports configurable features that can be enabled or disabled without code changes:

### Available Features
- **Liking**: Automatically like posts and reels
- **Commenting**: Generate and post AI-powered comments
- **Screenshots**: Capture profile screenshots and send via webhook
- **Content Filtering**: AI-powered filtering for real estate relevance

### Configuration Commands

```bash
# Check current configuration
npm run status

# Enable/disable features
npm run toggle-features -- --enable-commenting
npm run toggle-features -- --disable-commenting
npm run toggle-features -- --enable-liking
npm run toggle-features -- --disable-liking
npm run toggle-features -- --enable-screenshots
npm run toggle-features -- --disable-screenshots
npm run toggle-features -- --enable-content-filtering
npm run toggle-features -- --disable-content-filtering

# Configure webhook for screenshots
npm run toggle-features -- --set-webhook-url=https://your-webhook.com/endpoint
npm run toggle-features -- --clear-webhook-url

# Test content filtering
npm run test:content-filter

# Test image analysis
npm run test:image-analysis

# Test caption extraction (NEW)
npm run test:caption-extraction
```

## Content Filtering v3.0 🖼️

The bot now includes **Gemini Vision API integration** for advanced content filtering that analyzes both text and visual content to ensure interactions only with real estate-relevant posts.

### New Features in v3.0:
- **🖼️ Image Analysis**: Real-time visual content analysis using Gemini Vision API
- **🎯 Combined Scoring**: Intelligent system combining text (60%) and image (40%) analysis
- **📸 Smart Image Capture**: Automatic image extraction from Instagram posts and reels
- **🔄 Fallback System**: Graceful fallback to text-only analysis if image analysis fails
- **⚡ Performance Optimized**: Parallel processing of text and image analysis

### Visual Content Detection:
- Property exteriors and interiors
- Architectural features and designs
- Construction and renovation work
- Real estate signage and branding
- Property amenities (pools, gardens, parking)
- Floor plans and layouts
- Real estate professionals and viewings

### Quick Setup:
1. Enable content filtering: `npm run toggle-features -- --enable-content-filtering`
2. Test image analysis: `npm run test:image-analysis`
3. Configure settings in `src/config/interaction.json`
4. Test the filtering: `npm run test:content-filter`

For detailed configuration and usage, see:
- [CONTENT_FILTERING.md](CONTENT_FILTERING.md) - Basic setup and configuration
- [IMPROVED_CONTENT_FILTERING.md](IMPROVED_CONTENT_FILTERING.md) - v2.0 multi-post analysis
- [GEMINI_VISION_INTEGRATION.md](GEMINI_VISION_INTEGRATION.md) - v3.0 image analysis features
- [IMPROVED_CAPTION_EXTRACTION.md](IMPROVED_CAPTION_EXTRACTION.md) - v4.0 enhanced caption extraction

## Content Filtering v2.0

The bot includes **improved AI-powered content filtering** to ensure interactions only with real estate-relevant posts. The new system analyzes **multiple posts per profile** and selects the best one for interaction.

### Key Improvements:
- **Multi-post Analysis**: Analyzes up to 5 posts per profile instead of just one
- **Smart Selection**: Chooses the post with the highest relevance score (0-100)
- **Better Coverage**: Only skips profiles if NO posts are relevant
- **Detailed Logging**: Shows analysis of each post with scores and reasons
- **Image Analysis Ready**: Prepared for future Gemini Vision API integration

### Quick Setup:
1. Enable content filtering: `npm run toggle-features -- --enable-content-filtering`
2. Configure settings in `src/config/interaction.json`
3. Test the filtering: `npm run test:content-filter`

For detailed configuration and usage, see [CONTENT_FILTERING.md](CONTENT_FILTERING.md) and [IMPROVED_CONTENT_FILTERING.md](IMPROVED_CONTENT_FILTERING.md).

### Screenshot Functionality

The bot can capture full-page screenshots of Instagram profiles and send them to your webhook endpoint. This is useful for:
- Profile monitoring and archiving
- Content analysis and research
- Integration with external systems

For detailed screenshot setup and webhook implementation examples, see the [Screenshot Guide](SCREENSHOT_GUIDE.md).

### Profile List Configuration

Configure which profiles to interact with by editing `src/config/profiles.json`:

```json
{
  "profiles": [
    "https://www.instagram.com/username1/",
    "https://www.instagram.com/username2/",
    "https://www.instagram.com/username3/"
  ]
}
```

For detailed setup instructions, see the [Profile Interaction Guide](PROFILE_INTERACTION_GUIDE.md).

## Project Structure

- **src/client**: Contains the main logic for interacting with social media platforms like Instagram.
- **src/config**: Configuration files, including the logger setup.
- **src/utils**: Utility functions for handling errors, cookies, data saving, etc.
- **src/Agent**: Contains the AI agent logic and training scripts.
- **src/Agent/training**: Training scripts for the AI agent.
- **src/schema**: Schema definitions for AI-generated content and database models.
- **src/test**: Contains test data and scripts, such as example tweets.

## Logging

The project uses a custom logger to log information, warnings, and errors. Logs are saved in the [logs](http://_vscodecontentref_/3) directory.

## Error Handling

Process-level error handlers are set up to catch unhandled promise rejections, uncaught exceptions, and process warnings. Errors are logged using the custom logger.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- [Google Generative AI](https://ai.google/tools/) for providing the AI models.
- [Puppeteer](https://github.com/puppeteer/puppeteer) for browser automation.
- [puppeteer-extra](https://github.com/berstend/puppeteer-extra) for additional plugins and enhancements.

## Content Filtering v4.1 🖼️📝

The bot now includes **enhanced caption extraction** and **Gemini Vision API integration** for advanced content filtering that analyzes both text and visual content to ensure interactions only with real estate-relevant posts.

### New Features in v4.1:
- **📝 Enhanced Caption Extraction**: Intelligent extraction of full post descriptions with hashtags instead of header content
- **🎯 Header Detection**: Advanced filtering to avoid usernames and follow buttons in multiple languages
- **🖼️ Image Analysis**: Real-time visual content analysis using Gemini Vision API
- **🎯 Combined Scoring**: Intelligent system combining text (60%) and image (40%) analysis
- **📸 Smart Image Capture**: Automatic image extraction from Instagram posts and reels
- **🔄 Fallback System**: Graceful fallback to text-only analysis if image analysis fails
- **⚡ Performance Optimized**: Parallel processing of text and image analysis
- **🔍 Smart Selectors**: Advanced selectors that avoid header content and navigation elements

### Caption Extraction Improvements (v4.1):
- **Before**: `"michaelwright_re • Стежити"` → Score: 5, Category: not_relevant
- **After**: `"Congratulations to my clients on their accepted offer! 🏠🎉✨ I'm honored to be apart of it! #realestate #sold #congratulations #dreamhome"` → Score: 95, Category: residential
