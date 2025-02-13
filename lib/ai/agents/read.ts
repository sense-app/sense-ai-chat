import { tool } from 'ai';
import { z } from 'zod';
import { allActions, ChatState } from './shopper';
import { learn } from './learn';

const JINA_URL = `https://r.jina.ai/`;


export const read = ({dataStream, knowledgeBank}: ChatState) =>  tool({
    description: 'Visit webpages given their urls, read the content and learn from it.',
    parameters: z.object({
      urls: z.array(z.string().url())
    }),
      execute: async(params) => {
        const { urls } = params;
        const domains = urls.map(url => new URL(url).hostname);
        dataStream.writeData(`Learning from domains: ${domains.join(', ')}`);
        console.log(`Learning from domains: ${domains.join(', ')}`);

        const contents = (await Promise.all(
            urls.map(url => readWebpageContent(url))
        )).filter(content => content.length > 0);

        const userQuery = knowledgeBank.coreMessages[knowledgeBank.coreMessages.length - 1].content.toString();

        const result = await learn(userQuery, knowledgeBank.questions ?? [], contents);
        knowledgeBank.learnings.push(...result.learnings);
        knowledgeBank.questions.push(...result.followUpQuestions);
        knowledgeBank.products.push(...result.products);
        knowledgeBank.availableActions = allActions;
        if (result.products?.length > 0) {
            knowledgeBank.products.push(...result.products);
            dataStream.writeData(`Found ${result.products.length} products`);
        }
        if (result.learnings?.length > 0) {
            knowledgeBank.learnings.push(...result.learnings);
        }
        if (result.followUpQuestions?.length > 0) {
            knowledgeBank.questions.push(...result.followUpQuestions);
        }

        // Remove the processed URLs from searchResults
        const urlSet = new Set(urls);
        knowledgeBank.searchResults = knowledgeBank.searchResults.filter(
            result => !urlSet.has(result.url)
        );

        console.dir(knowledgeBank, {depth: null})
      },
});

const readWebpageContent = async(url: string) => {
    const response = await fetch(`${JINA_URL}${url}`, { 
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.JINA_API_KEY!
        }
    });
    if (!response.ok) {
        console.log(`Error reading webpage status: ${response.statusText} url: ${url}`)
        return '';
    }
    const text = await response.text();
    return text;
}