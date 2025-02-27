import { chromium, type BrowserContext, type Page } from 'playwright';
import { setTimeout } from 'node:timers/promises';
import { RateLimiter } from 'limiter';

interface ShoppingSearchParams {
  queries: string[];
  countryCode?: string;
  city?: string;
  proxyUrl?: string;
}

interface ShoppingResult {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  shopping: Array<{
    title: string;
    source: string;
    link: string;
    price: string;
    delivery?: string;
    imageUrl?: string;
    rating?: number;
    ratingCount?: number;
    offers?: string;
    productId?: string;
    position: number;
  }>;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
];

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds
const CONCURRENT_REQUESTS = 3;
const MAX_REQUESTS_PER_MINUTE = 30;

export class ShoppingScraper {
  private browser: any;
  private contexts: BrowserContext[] = [];
  private rateLimiter: RateLimiter;
  private isInitialized = false;
  private cleanupInProgress = false;

  constructor() {
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: MAX_REQUESTS_PER_MINUTE,
      interval: 'minute',
    });
  }

  private parseRatingCount(text: string | null): number | undefined {
    if (!text) return undefined;
    const match = text.match(/([\d,]+)/);
    if (!match) return undefined;
    return Number.parseInt(match[1].replace(/,/g, ''));
  }

  async init(proxyUrl?: string) {
    if (this.isInitialized) return;

    try {
      const launchOptions: any = {
        headless: true,
        args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
      };

      if (proxyUrl) {
        launchOptions.proxy = { server: proxyUrl };
      }

      this.browser = await chromium.launch(launchOptions);
      this.isInitialized = true;
    } catch (error: any) {
      console.error('Failed to initialize browser:', error);
      this.isInitialized = false;
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  async close() {
    if (this.cleanupInProgress) return;
    this.cleanupInProgress = true;

    try {
      // Close all contexts first
      await Promise.all(
        this.contexts.map((context) =>
          context.close().catch((error) => {
            console.error('Error closing context:', error);
          }),
        ),
      );
      this.contexts = [];

      // Then close the browser
      if (this.browser) {
        await this.browser.close().catch((error: any) => {
          console.error('Error closing browser:', error);
        });
        this.browser = null;
      }
    } finally {
      this.isInitialized = false;
      this.cleanupInProgress = false;
    }
  }

  private async createContext(): Promise<BrowserContext> {
    if (!this.browser || !this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const context = await this.browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true,
      });

      this.contexts.push(context);
      return context;
    } catch (error: any) {
      throw new Error(`Failed to create browser context: ${error.message}`);
    }
  }

  private async scrapeShoppingResults(page: Page, query: string): Promise<ShoppingResult> {
    if (!page) throw new Error('Invalid page object');

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
    const parseRatingCount = this.parseRatingCount.bind(this);

    try {
      await this.rateLimiter.removeTokens(1);

      await page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await page.waitForTimeout(Math.random() * 1000 + 500);

      const products = await page.evaluate((parseRatingCount) => {
        const items = document.querySelectorAll('div.sh-dgr__content');
        return Array.from(items).map((item, index) => {
          const titleElement = item.querySelector('.tAxDx');
          const priceElement = item.querySelector('.a8Pemb');
          const sourceElement = item.querySelector('.aULzUe');
          const imageElement = item.querySelector('img.ArOc1c');
          const ratingElement = item.querySelector('.QIrs8');
          const ratingCountElement = item.querySelector('.QIrs8 + span');
          const offersElement = item.querySelector('.dD8iuc');
          const deliveryElement = item.querySelector('.vEjUwb');

          return {
            title: titleElement?.textContent?.trim() || '',
            source: sourceElement?.textContent?.trim() || '',
            link: item.querySelector('a')?.href || '',
            price: priceElement?.textContent?.trim() || '',
            delivery: deliveryElement?.textContent?.trim(),
            imageUrl: imageElement?.getAttribute('src') || undefined,
            rating: ratingElement ? Number.parseFloat(ratingElement.textContent || '0') : undefined,
            ratingCount: ratingCountElement ? parseRatingCount(ratingCountElement.textContent) : undefined,
            offers: offersElement?.textContent?.trim(),
            productId: item.querySelector('a')?.getAttribute('data-pid'),
            position: index + 1,
          };
        });
      }, parseRatingCount);

      return {
        searchParameters: {
          q: query,
          type: 'shopping',
          engine: 'google',
        },
        shopping: products.map((product) => ({
          ...product,
          productId: product.productId || undefined,
        })),
      };
    } catch (error: any) {
      console.error(`Error scraping results for query "${query}":`, error);
      throw new Error(`Failed to scrape shopping results: ${error.message}`);
    }
  }

  private async scrapeWithRetry(query: string): Promise<ShoppingResult> {
    let lastError: Error | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        context = await this.createContext();
        page = await context.newPage();

        const result = await this.scrapeShoppingResults(page, query);
        await context.close();
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed for query "${query}":`, error);

        if (page) await page.close().catch(console.error);
        if (context) await context.close().catch(console.error);

        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAY * Math.pow(2, attempt);
          await setTimeout(delay);
        }
      }
    }

    throw new Error(`Failed to scrape results for "${query}" after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  private async processQueryBatch(queries: string[]): Promise<ShoppingResult[]> {
    const results: ShoppingResult[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < queries.length; i += CONCURRENT_REQUESTS) {
      const batch = queries.slice(i, i + CONCURRENT_REQUESTS);
      const batchPromises = batch.map((query) =>
        this.scrapeWithRetry(query).catch((error: Error) => {
          errors.push(error);
          return null;
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((result): result is ShoppingResult => result !== null));

      if (i + CONCURRENT_REQUESTS < queries.length) {
        await setTimeout(1000); // Add delay between batches
      }
    }

    if (errors.length > 0) {
      console.error(`${errors.length} queries failed:`, errors);
      if (results.length === 0) {
        throw new Error('All queries failed');
      }
    }

    return results;
  }

  async search({ queries, countryCode = 'US', city, proxyUrl }: ShoppingSearchParams): Promise<ShoppingResult[]> {
    if (!queries.length) {
      throw new Error('No queries provided');
    }

    if (!this.isInitialized) {
      await this.init(proxyUrl);
    }

    try {
      return await this.processQueryBatch(queries);
    } catch (error: any) {
      console.error('Shopping search failed:', error);
      throw new Error(`Shopping search failed: ${error.message}`);
    } finally {
      await this.close();
    }
  }
}
