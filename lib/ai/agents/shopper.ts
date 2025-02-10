import { CoreMessage } from "ai";
import { url } from "inspector";

type Action = "search" | "answer" | "reflect" | "visit";
const actionMap = {
    search: "Query external sources using a public search engine. Focus on solving one specific aspect of the question. Only give keywords search query, not full sentences",
    answer: "Provide accurate answers to the question.",
    reflect: "Breakdown user's intent and question to smaller questions that you can first the find the answer. This helps to answer the user's question in a more efficient way. ",
    visit: "Visit any URL from the available URLs to get more information",
};

type BaseAction = {
    action: Action; 
    thoughts: string;
};

export type SearchAction = BaseAction & {
    action: "search";
    searchQuery: string;
};

export type AnswerAction = BaseAction & {
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

export type StepAction = SearchAction | AnswerAction | ReflectAction | VisitAction;

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
    availableActions: Action[];
    learnings?: Learning[];
    questions?: string[];
}

const getPrompt = (knowledgeBank: KnowledgeBank) => {
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
            ${availableActions.map(action => `${action} - ${actionMap[action]}`).join('\n')}`);
    }

    return sections.join('\n\n');
}