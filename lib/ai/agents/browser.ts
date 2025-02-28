// import { chromium } from 'playwright';
// import { PlaywrightAgent } from '@midscene/web';

// const browseStore = async (shopSearchTerm: string, searchQueries: string[]) => {
//   (async () => {
//     const browser = await chromium.launch();
//     // Create pages, interact with UI elements, assert values
//     const page = await browser.newPage();
//     await page.goto('google.com');
//     const agent = new PlaywrightAgent(page);
//     await agent.aiAction(`type ${shopSearchTerm} into the search bar and hit Enter`);
//     await agent.aiWaitFor(`search results to load on the page`);
//     await agent.aiAction(`click on the ${shopSearchTerm} website link from the search results`);
//     await agent.aiWaitFor(`the e-commerce website to load`);

//     for (const searchQuery of searchQueries) {
//       await agent.aiAction(`type ${searchQuery} into the search bar and hit Enter`);
//       await agent.aiWaitFor(`search results to load on the page`);
//       const results = await agent.aiQuery(``);
//     }

//     await browser.close();
//   })();
// };
