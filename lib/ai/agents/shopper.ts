import { jsonToLLMFormat } from '@/lib/llm-formatter';
import { serpSearch, type SerpShoppingResult } from '@/lib/services/serp';
import { type DataStreamWriter, tool } from 'ai';
import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';
import { shoppingResultsSchemaForGemini } from './shopping-results-schema';

import { z } from 'zod';

import { writeToFile } from '@/lib/server/file-utils';

const productSearchSchema = z.object({
  searchTerm: z.string().describe('Best search term of product (name/kind/category etc.)'),
  filter: z
    .string()
    .optional()
    .describe('Any additional filter criteria about the product that can help to narrow down the search'),
  stores: z
    .array(
      z.object({
        name: z.string().min(1).describe('Name of the e-commerce store'),
      }),
    )
    .optional()
    .describe(`List of stores recommended to buy the product`),
});

export const productGroupSchema = z.object({
  name: z.string(),
  shortDescription: z.string().optional().describe('A short 1 liner about the product'),
  imageUrl: z
    .string()
    .describe('URL of the product image from the e-commerce store where this product can be purchased'),
  category: z.string(),
  stores: z
    .array(
      z.object({
        name: z.string().min(1).describe('Name of the e-commerce store'),
        reason: z.string().describe('Why did you choose this store to buy this product?'),
        imageUrl: z.string().describe('URL of the store image. The image url should come from the e-commerce store'),
        shopUrl: z.string().describe('URL of this e-commerce store'),
        price: z.number(),
        productURL: z.string().describe('The product URL to purchase from this e-commerce store'),
        review: z.string().optional(),
        originalPrice: z.number().optional().describe('Original price of the product before any discount'),
        currencyCode: z.string().describe('short 3 letter currency code like INR, USD, EUR etc.'),
        currencySymbol: z.string().optional().describe('Currency symbol like ₹, $, € etc.'),
        deliveryDetails: z.string().optional().describe('Delivery details like delivery time, delivery options, etc.'),
        remarks: z.string().optional(),
        latestOffers: z.string().optional().describe('Latest offers on the product'),
      }),
    )
    .describe(`List of stores to buy the product`),
});

export const storeGroupSchema = z.object({
  name: z.string().min(1).describe('Name of the e-commerce store'),
  imageUrl: z.string().describe('URL of the store image. The image url should come from the e-commerce store'),
  shopUrl: z.string().describe('URL of this e-commerce store'),
  products: z
    .array(
      z.object({
        name: z.string(),
        shortDescription: z.string().optional().describe('A short 1 liner about the product'),
        price: z.number(),
        productURL: z.string().describe('The product URL to purchase from this e-commerce store'),
        imageUrl: z
          .string()
          .describe('URL of the product image from the e-commerce store where this product can be purchased'),
        category: z.string(),
        review: z.string().optional(),
        originalPrice: z.number().optional().describe('Original price of the product before any discount'),
        currencyCode: z.string().describe('short 3 letter currency code like INR, USD, EUR etc.'),
        currencySymbol: z.string().optional().describe('Currency symbol like ₹, $, € etc.'),
        deliveryDetails: z.string().optional().describe('Delivery details like delivery time, delivery options, etc.'),
        remarks: z.string().optional(),
        latestOffers: z.string().optional().describe('Latest offers on the product'),
      }),
    )
    .describe('list of products from this store'),
});

export const shoppingResultsSchema = z.object({
  summary: z.string().describe('Summary of the all shopping results and recommendations'),
  productsGroup: z
    .array(productGroupSchema)
    .describe(
      'List of products grouped by product name from various e-commerce stores. This is helpful to compare the prices, offers, delivery details of the same product across different e-commerce stores',
    ),
  storeGroup: z.array(storeGroupSchema).describe('List of products grouped by store'),
});

export type ProductGroup = z.infer<typeof productGroupSchema>;
export type StoreGroup = z.infer<typeof storeGroupSchema>;
export type ShoppingResults = z.infer<typeof shoppingResultsSchema>;

export interface Shopping {
  query: string;
  searchTerm: string;
  searchResults: string[];
}

export const shop = (dataStream: DataStreamWriter) =>
  tool({
    description:
      'Search for the given product search terms on all relevant e-commerce stores and return full product details',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      query: z.string().describe('What does the user want?'),
      searchTerms: z
        .array(productSearchSchema)
        .describe(
          'List of product search terms - name/kind/type/categories. Each search term has to be explicit and clear',
        ),
    }),
    execute: async (params) => {
      const { thoughts, query, searchTerms } = params;

      // const searchResults = await shoppingSearch(
      //   searchTerms.map((product) => `${product.searchTerm} ${product?.filter ?? ''}`),
      // );
      const searchResults = await shoppingSearch([`${searchTerms[0].searchTerm} ${searchTerms[0]?.filter ?? ''}`]);
      const shoppingItems = searchResults.results.map((result) => ({
        query,
        searchTerm: result.searchQuery,
        searchResults: [result.results],
      })) as Shopping[];

      const allShoppingResults = await Promise.all(shoppingItems.map((item) => shopper(dataStream, item)));

      // Combine all results into a single shopping result
      const combinedResults: ShoppingResults = {
        summary: allShoppingResults.map((result) => result.summary).join('\n\n'),
        productsGroup: allShoppingResults.flatMap((result) => result.productsGroup),
        storeGroup: allShoppingResults.flatMap((result) => result.storeGroup),
      };

      return combinedResults;
    },
  });

export const shoppingSearch = async (queries: string[]) => {
  const searchResults = (await serpSearch({ queries, type: 'shopping' })) as SerpShoppingResult[];
  const totalResults = searchResults.reduce((acc, result) => acc + (result?.shopping?.length ?? 0), 0);

  const searchResultsLLMFormatted = searchResults.map((results) => ({
    searchQuery: results.searchParameters.q,
    results: jsonToLLMFormat(results.shopping),
  }));

  return { totalResults, results: searchResultsLLMFormatted };
};

const SHOPPER_SYSTEM_PROMT = `
Evaluate the user query, product search terms with the product details from the search results and return the best matching product details.
Return as many product details as possible. Sort and group the search results by quality, relevance, price, and other important factors. 
Omit irrelevant or incorrect results, and provide only accurate and relevant details.

All results should be specific to the Singapore context.
You should not ask the user to gather additional information. 

Your response should consist of a structured JSON output with two primary groupings:

- Grouped by Store: List all products sold by the same store.
- Grouped by Product: If the same product is available across multiple stores, group it by product, showing all purchase options from different stores. 
This allows for easy comparison of prices, offers, and delivery details for the same product across different e-commerce platforms.

Do not exceed 8000 tokens per output. Return partial results and then continu

Each product should appear only once, either in the "store" or "product" grouping, not both.
Be careful with JSON errors. Structure the response accurarely in JSON format. Handle URLs correctly and do not edit them.


JSON Schema for output":

`;

const getShoppingPrompt = (shopping: Shopping) => {
  const sections = [];

  sections.push(`
      <Userquery>
        ${shopping.query}
      </Userquery>
    `);

  sections.push(`
      <productSearchTerm>
        ${shopping.searchTerm}
      </productSearchTerm>
    `);

  sections.push(`
      <searchResults>
        ${shopping.searchResults.join('\n')}
      </searchResults>
    `);

  const prompt = sections.join('\n');

  // Write the prompt to a file in tmp directory
  writeToFile(prompt, 'shopping-prompt');

  return prompt;
};

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);

export const shopper = async (dataStream: DataStreamWriter, shopping: Shopping) => {
  const prompt = getShoppingPrompt(shopping);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SHOPPER_SYSTEM_PROMT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: shoppingResultsSchemaForGemini as Schema,
    },
  });

  const result = await model.generateContent(prompt);
  const response: ShoppingResults = JSON.parse(result.response.text());
  writeToFile(JSON.stringify(response), 'shopping-results');
  return response;

  // const result = await generateObject({
  //   model: myProvider.languageModel('chat-model-large'),
  //   system: SHOPPER_SYSTEM_PROMT,
  //   prompt,
  //   maxTokens: 50000,
  //   maxRetries: 3,
  //   schema: shoppingResultsSchema,
  // });

  // return result.object;

  // const result = await generateText({
  //   model: myProvider.languageModel('chat-model-large'),
  //   system: SHOPPER_SYSTEM_PROMT,
  //   prompt,
  //   maxSteps: 5,
  //   maxRetries: 3,
  //   maxTokens: 50000,
  //   experimental_output: Output.object({
  //     schema: shoppingResultsSchema,
  //   }),
  // });

  // return result.experimental_output;

  // try {
  //   const shoppingResults: ShoppingResults = JSON.parse(result.text);
  //   return shoppingResults;
  // } catch (error) {
  //   console.error('Error parsing JSON:', error);
  //   console.error('Result:', result.text);
  //   throw new Error('Failed to parse shopping results');
  // }
};
