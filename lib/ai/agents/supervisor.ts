import { type CoreMessage, type DataStreamWriter, generateObject } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/models';

export const SUPERVISOR_SYSTEM_PROMPT = `
You are an intelligent shopping search engine. 
Your task is to understand user queries, research online to identify the best-matching products, and recommended relevant e-commerce stores. 
Then, retrieve accurate, real-time product details from these stores.

You have access to the following tools:

Researcher: Searches online for relevant results based on queries.
Shopper: Finds detailed product information from recommended and other stores.

If a query is unrelated to shopping, politely decline with an explanation.
`;

export const QUERY_ANALYZER_PROMPT = `
You are an intelligent shopping search engine. 
First, determine if the user's query is shopping-related. 
If it is, break it down into smaller research questions to help identify the best-matching products and recommend relevant e-commerce stores to purchase those products. 
If it's not, suggest potential shopping-related topics based on the query.
`;

export const queryAnalyzerResultsSchema = z.object({
  isShoppingRelated: z.boolean().describe('Is the conversation unrelated to shopping?'),
  thoughts: z.string().describe('Explain your reasoning'),
  queries: z
    .array(z.string())
    .describe(
      'Generate a list of online search queries to find the best-matching products and e-commerce stores for shopping-related user queries. If the query is not shopping-related, suggest a list of relevant shopping topics based on the user query',
    ),
});

export const supervisor = async (dataStream: DataStreamWriter, messages: CoreMessage[]) => {
  const queryAnalyzerResult = await generateObject({
    model: myProvider.languageModel('chat-model-large'),
    schema: queryAnalyzerResultsSchema,
    system: QUERY_ANALYZER_PROMPT,
    messages,
  });

  if (!queryAnalyzerResult.object.isShoppingRelated) {
    return queryAnalyzerResult;
  }

  //TODO Call Researcher and Shopper agents

  return queryAnalyzerResult;
};
