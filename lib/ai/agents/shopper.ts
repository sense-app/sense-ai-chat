import { CoreMessage, DataStreamWriter } from "ai";

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
    Visit,
    Learn,
    Aggregate,
    Answer,
    Invalid
}

export const allActions = new Set([Action.Reflect, Action.Search, Action.Visit, Action.Learn, Action.Aggregate, Action.Answer, Action.Invalid]);

const actionMap: Record<Action, string> = {
    [Action.Reflect]: `Breakdown user's intent and questions to smaller shopping related questions that you can first the find the answer. 
    This helps to answer the user's question in a more efficient way. Choose questions that narrows down the product, stores that sell the product, etc. `,
    [Action.Search]: "Query external sources using a public search engine. Focus on solving one specific aspect of the question. Only give keywords search query, not full sentences",
    [Action.Visit]: "Visit any URLs from the available URLs to get more information",
    [Action.Learn]: `Identify key learnings from the content. Focus on the products that matches user's query, stores that sell the product and key metrics to find the best matching results.`,
    [Action.Aggregate]: "Aggregate the products from different stores into structured json format. Include as many details as possible. Include product name, price, description, reviews, store name, offers, images, delivery details etc.",
    [Action.Answer]: "Answer the user's query full and complete with structured product data",
    [Action.Invalid]: "If user asks any non-shopping related query, politely decline saying sorry and explain why the user's query is not shopping related"
};

type BaseAction = {
    action: Action; 
    thoughts: string;
};

export type SearchAction = BaseAction & {
    action: "search";
    searchQuery: string;
};

export type LearnAction = BaseAction & {
    action: "answer";
    answer: string;
    references: Array<{
        exactQuote: string;
        url: string;
    }>;
};

export type ReflectAction = BaseAction & {
        action: "reflect";
questionsToAnswer: string[];
};

export type VisitAction = BaseAction & {
    action: "visit";
    URLTargets: string[];
};

export type StepAction = SearchAction | LearnAction | ReflectAction | VisitAction;

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
    steps?: string[];
    urls?: string[];
    availableActions: Set<Action>;
    learnings?: Learning[];
    questions?: string[];
}

export interface ChatState {
    dataStream: DataStreamWriter;
    knowledgeBank: KnowledgeBank;
  }

export const getPrompt = (knowledgeBank: KnowledgeBank) => {
    const { coreMessages, steps, urls, availableActions, learnings, questions } = knowledgeBank;
    const sections: string[] = [];

    sections.push(`you are an advanced shopping assistant. 
        Your role is to understand the user's intent and get the best products that match the results. 
        You should use your prior training knowledge as well search web in real-time to find products and with your best effort, get name, price, description, reviews, store name, delivery details etc. 
        Generally, if the product is a branded product, then find the product in the stores that are near to the user's location or able to deliver online. Compare the prices, latest offers and other details for the products across different stores.
        If the product is common non-branded product, then first find all the stores that sell product nearer to user's location and then find the product.
        If the user asks a non-shopping related query, then politely decline saying sorry and explain why the user's query is not shopping related`);

    const userQuestion = coreMessages[coreMessages.length - 1].content;
    sections.push(`## User's question
        ${userQuestion}`);

    if (steps) {
        sections.push(`## Steps
            You have taken following steps: 
            ${steps.join('\n')}`);
    }

    if (learnings) {
        sections.push(`## Learnings
            You have learned the following:
            ${learnings.map(learning => `
                Question: ${learning.question}
                Answer: ${learning.answer}
                Is Acceptable: ${learning.isAcceptable}
                Evaluation: ${learning.evaluation}
                Improvement: ${learning.improvement}
                Recap: ${learning.recap}`).join('\n')}`);
    }

    if (questions) {
        sections.push(`## Questions
            You have the following questions unanswered. You can decide to answer them or not based on your knowledge:
            ${questions.join('\n')}`);
    }

    if (urls) {
        sections.push(`## URLs
            You have collected all these URLs. You can decide to visit them or not based on your knowledge to get more information:
            ${urls.join('\n')}`);
    }

    if (availableActions) {
        sections.push(`## Available Actions
            You can take the following actions that best suits the current context:
            ${Array.from(availableActions).map(action => `${action} - ${actionMap[action]}`).join('\n')}`);
    }

    return sections.join('\n\n');
}


