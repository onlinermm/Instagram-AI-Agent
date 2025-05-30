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
import { InteractionResult } from "../types/webhookTypes";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(
    AdblockerPlugin({
        // Optionally enable Cooperative Mode for several request interceptors
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    })
);

interface WebhookParams {
    profileUrl?: string;
    username?: string;
    timestamp?: string;
    message?: string;
    profiles?: string[];
    // New interaction control parameters
    enableLiking?: boolean;
    enableCommenting?: boolean;
    enableScreenshots?: boolean;
    enableContentFiltering?: boolean;
    [key: string]: any;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runInstagram(webhookParams?: WebhookParams): Promise<InteractionResult[] | void> {
    let server: Server | null = null;
    let browser: any = null;
    
    try {
        server = new Server({ port: 8000 });
        await server.listen();
        const proxyUrl = `http://localhost:8000`;
        browser = await puppeteer.launch({
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

        // Load profiles from configuration or webhook
        let profiles: string[] = [];
        
        if (webhookParams && webhookParams.profiles) {
            profiles = webhookParams.profiles;
            logger.info(`Using profiles from webhook: ${profiles.length} profiles`);
        } else if (webhookParams && webhookParams.profileUrl) {
            profiles = [webhookParams.profileUrl];
            logger.info(`Using single profile from webhook: ${webhookParams.profileUrl}`);
        } else {
            profiles = loadProfiles();
            logger.info(`Using profiles from configuration: ${profiles.length} profiles`);
        }
        
        if (profiles.length === 0) {
            logger.error("No profiles found. Please provide profile URLs via webhook or add them to src/config/profiles.json");
            return;
        }

        logger.info(`Processing ${profiles.length} profiles`);

        // Логіка залежно від того, чи є це вебхук чи звичайний режим
        if (webhookParams) {
            // Режим вебхука: обробити профілі один раз і завершити
            try {
                const results = await interactWithProfiles(page, profiles, webhookParams);
                logger.info("Webhook processing completed successfully");
                return results;
            } catch (error) {
                logger.error("Error during webhook profile interaction:", error);
                throw error; // Re-throw to ensure proper cleanup
            }
        } else {
            // Звичайний режим: циклічна обробка
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
    } catch (error) {
        logger.error("Error in runInstagram function:", error);
        throw error;
    } finally {
        // Always clean up resources
        try {
            if (browser) {
                await browser.close();
                logger.info("Browser closed successfully");
            }
            if (server) {
                await server.close(true); // Close forcefully
                logger.info("Proxy server closed successfully");
            }
        } catch (cleanupError) {
            logger.error("Error during cleanup:", cleanupError);
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
