import { chromium } from 'playwright';

const browseStore = async (shopSearchTerm: string, searchQueries: string[]) => {
  (async () => {
    const browser = await chromium.launch();
    // Create pages, interact with UI elements, assert values
    const page = await browser.newPage();
    await page.goto('google.com');

    await browser.close();
  })();
};
