import { CoreMessage, DataStreamWriter } from "ai";
import { SearchResult } from "./search";
import { z } from "zod";

/*
Query: Phones under $200
1. Reflect - Breakdown the query into smaller questions (what phones are popular under $200, what stores sell smart phones?)
2. Search - Search the web for the query
3. Visit - Visit the URLs to get more information
4. Learn - get the name of products
5. Search - search the products in the stores
6. Visit - Visit the URLs to get more information
7. Aggregate - Aggregate the products from different stores
8. Answer - Answer the user's question with structured product data
*/

export enum Action {
    Reflect,
    Search,
    Read,
}

export const allActions = new Set([Action.Reflect, Action.Search, Action.Read]);

export const excludeActions = (excludeList: Action[]): Set<Action> => {
    return new Set([...allActions].filter(action => !excludeList.includes(action)));
}

const actionMap: Record<Action, string> = {
    [Action.Reflect]: `Breakdown user's intent and questions to smaller shopping related questions that you can first the find the answer. 
    This helps to answer the user's question in a more efficient way. Choose questions that narrows down the product, stores that sell the product, etc. `,
    [Action.Search]: "Query external sources using a public search engine. Focus on solving one specific aspect of the question. Only give keywords search query, not full sentences",
    [Action.Read]: "Visit any URLs from the available URLs to get more information. Identify key learnings and metrics from the content. Aggregate the products from different stores into structured json format. Include as many details as possible.",
    // [Action.Invalid]: "If user asks any non-shopping related query, politely decline saying sorry and explain why the user's query is not shopping related"
};

export const productSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    shopUrl: z.string().url(),
    imageUrl: z.string().url(),
    category: z.string(),
    review: z.string(),
    originalPrice: z.number(),
    currencyCode: z.string(),
    deliveryDetails: z.string(),
    remarks: z.string(),
    latestOffers: z.string(),
    store: z.object({
        name: z.string(),
        description: z.string(),
        imageUrl: z.string().url(),
        shopUrl: z.string().url(),
    })
});

export type Product = z.infer<typeof productSchema>;


export interface Learning {
    question: string;
    answer: string;
    isAcceptable: boolean;
    evaluation: string;
    improvement: string;
    recap: string;
    blame: string;
}

export interface KnowledgeBank {
    coreMessages: CoreMessage[];
    availableActions: Set<Action>;
    learnings: string[];
    questions: string[];
    searchResults: SearchResult[];
    products: Product[];
}

export const defaultKnowledgeBank: Omit<KnowledgeBank, 'coreMessages'> = {
    availableActions: allActions,
    questions: [],
    learnings: [],
    products: [],
    searchResults: []
};

export interface ChatState {
    dataStream: DataStreamWriter;
    knowledgeBank: KnowledgeBank;
  }

export const SHOPPING_SYSTEM_PROMPT = `
    You are an advanced shopping assistant. 
    Your role is to understand the user's intent and get the best products that match the results. 
    You should use your prior training knowledge as well search web in real-time to find products and with your best effort, get name, price, description, reviews, store name, delivery details etc. 
    Generally, if the product is a branded product, then find the product in the stores that are near to the user's location or able to deliver online. Compare the prices, latest offers and other details for the products across different stores.
    If the product is common non-branded product, then first find all the stores that sell product nearer to user's location and then find the product.
    If the user asks a non-shopping related query, then politely decline saying sorry and explain why the user's query is not shopping related
`;

export const getPrompt = (knowledgeBank: KnowledgeBank) => {
    const { coreMessages, availableActions, learnings, questions, searchResults, products } = knowledgeBank;
    const sections: string[] = [];

    const userQuestion = coreMessages[coreMessages.length - 1].content;
    sections.push(`## User's query
        ${userQuestion}`);

    if (questions) {
        sections.push(`## Questions
            You have collected all these questions that maybe relevant to answer first in order to answer the user's query
            ${questions.join('\n')}`);
    }

    if (searchResults) {
        sections.push(`## Search Results
            You have searched the web and collected all these search results. You can decide to visit them or not based on your knowledge to get more information:
            ${searchResults.map(result => `URL: ${result.url}\t title: ${result.title}\t description: ${result.description}\t icon: ${result.icon} `).join('\n')}`);
    }

    if (learnings) {
        sections.push(`## Learnings
            You have learned the following from searching the web online:
            ${learnings.join('\n')}`);
    }

    if (products) {
        sections.push(`## Products
            You have found the following products so far from searching online. You can use them or continue doing more research until you have aggregated enough relevant products to answer the user:
            ${products.map(product => `
                Name: ${product.name}
                Price: ${product.currencyCode} ${product.price}
                Original Price: ${product.currencyCode} ${product.originalPrice}
                Description: ${product.description}
                Category: ${product.category}
                Review: ${product.review}
                Delivery: ${product.deliveryDetails}
                Latest Offers: ${product.latestOffers}
                Remarks: ${product.remarks}
                Shop URL: ${product.shopUrl}
                Image URL: ${product.imageUrl}
                Store:
                    Name: ${product.store.name}
                    Description: ${product.store.description}
                    Shop URL: ${product.store.shopUrl}
                    Image URL: ${product.store.imageUrl}
            `).join('\n---\n')}`);
    }

    if (availableActions) {
        sections.push(`## Available Actions
            Based on all the above information, you can take one of the following actions.
            If you think you already have aggregated enough products to answer user's query, then simply answer and end.
            ${Array.from(availableActions).map(action => `${action} - ${actionMap[action]}`).join('\n')}`);
    }

    return sections.join('\n\n');
}


