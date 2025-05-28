import { Browser, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import UserAgent from "user-agents";
import { Server } from "proxy-chain";
import { IGpassword, IGusername } from "../secret";
import logger from "../config/logger";
import { Instagram_cookiesExist, loadCookies, saveCookies } from "../utils";
import { loadProfiles } from "../utils/profileLoader";
import { interactWithProfiles } from "./profileInteraction";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(
    AdblockerPlugin({
        // Optionally enable Cooperative Mode for several request interceptors
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    })
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runInstagram() {
    const server = new Server({ port: 8000 });
    await server.listen();
    const proxyUrl = `http://localhost:8000`;
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--proxy-server=${proxyUrl}`],
    });

    const page = await browser.newPage();
    const cookiesPath = "./cookies/Instagramcookies.json";

    const checkCookies = await Instagram_cookiesExist();
    logger.info(`Checking cookies existence: ${checkCookies}`);

    if (checkCookies) {
        const cookies = await loadCookies(cookiesPath);
        await page.setCookie(...cookies);
        logger.info('Cookies loaded and set on the page.');

        // Navigate to Instagram to verify if cookies are valid
        await page.goto("https://www.instagram.com/", { waitUntil: 'networkidle2' });

        // Check if login was successful by verifying page content (e.g., user profile or feed)
        const isLoggedIn = await page.$("a[href='/direct/inbox/']");
        if (isLoggedIn) {
            logger.info("Login verified with cookies.");
        } else {
            logger.warn("Cookies invalid or expired. Logging in again...");
            await loginWithCredentials(page, browser);
        }
    } else {
        // If no cookies are available, perform login with credentials
        await loginWithCredentials(page, browser);
    }

    // Optionally take a screenshot after loading the page
    await page.screenshot({ path: "logged_in.png" });

    // Load profiles from configuration
    const profiles = loadProfiles();
    
    if (profiles.length === 0) {
        logger.error("No profiles found in configuration. Please add Instagram profile URLs to src/config/profiles.json");
        await browser.close();
        return;
    }

    logger.info(`Loaded ${profiles.length} profiles for interaction`);

    // Continuously interact with profiles
    while (true) {
        try {
            await interactWithProfiles(page, profiles);
            logger.info("Completed one cycle of profile interactions");
            
            // Wait before starting the next cycle
            const cycleWaitTime = Math.floor(Math.random() * 30000) + 60000; // 1-1.5 minutes
            logger.info(`Waiting ${cycleWaitTime / 1000} seconds before starting next cycle...`);
            await delay(cycleWaitTime);
            
        } catch (error) {
            logger.error("Error during profile interaction cycle:", error);
            await delay(30000); // Wait 30 seconds before retrying
        }
    }
}

const loginWithCredentials = async (page: any, browser: Browser) => {
    try {
        await page.goto("https://www.instagram.com/accounts/login/");
        await page.waitForSelector('input[name="username"]');

        // Fill out the login form
        await page.type('input[name="username"]', IGusername); // Replace with your username
        await page.type('input[name="password"]', IGpassword); // Replace with your password
        await page.click('button[type="submit"]');

        // Wait for navigation after login
        await page.waitForNavigation();

        // Save cookies after login
        const cookies = await browser.cookies();
        // logger.info("Saving cookies after login...",cookies);
        await saveCookies("./cookies/Instagramcookies.json", cookies);
    } catch (error) {
        // logger.error("Error logging in with credentials:", error);
        logger.error("Error logging in with credentials:");
    }
}

// Keep the old function for backward compatibility but mark it as deprecated
async function interactWithPosts(page: any) {
    logger.warn("interactWithPosts function is deprecated. Use profile-based interaction instead.", page);
    // ... existing code ...
}

export { runInstagram };
