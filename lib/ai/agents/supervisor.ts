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

// export const SUPERVISOR_SYSTEM_PROMPT = `
//     You are an intelligent shopping search engine.
//     Your task is to understand user queries and past responses to determine the next action:

//     Research - Analyze the user's intent and generate relevant search queries for online shopping.
//     Invalid - If the query is unrelated to shopping, politely decline with an explanation.
// `;

export const supervisorResultsSchema = z.object({
  isInvalid: z.boolean().describe('Is the conversation unrelated to shopping?'),
  thoughts: z.string().describe('Explain your thought process'),
  queries: z.array(z.string()).describe('List of queries to be search online'),
});

export const supervisor = async (dataStream: DataStreamWriter, messages: CoreMessage[]) => {
  const result = await generateObject({
    model: myProvider.languageModel('chat-model-large'),
    schema: supervisorResultsSchema,
    system: SUPERVISOR_SYSTEM_PROMPT,
    messages,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
    // onFinish: async ({ response, reasoning }) => {
    //   if (session.user?.id) {
    //     try {
    //       const sanitizedResponseMessages = sanitizeResponseMessages({
    //         messages: response.messages,
    //         reasoning,
    //       });
    //       await saveMessages({
    //         messages: sanitizedResponseMessages.map((message) => {
    //           return {
    //             id: message.id,
    //             chatId: id,
    //             role: message.role,
    //             content: message.content,
    //             createdAt: new Date(),
    //           };
    //         }),
    //       });
    //     } catch (error) {
    //       console.error('Failed to save chat');
    //     }
    //   }
    // },
  });

  return result;
};
