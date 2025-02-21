import { jsonToLLMFormat } from '@/lib/llm-formatter';
import { serpSearch } from '@/lib/services/serp';
import { type DataStreamWriter, generateText, Output, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/models';

const productSearchSchema = z.object({
  name: z.string().describe('Name of the product'),
  remarks: z.string().optional().describe('Any additional remarks or filter criteria about the product'),
  stores: z
    .array(
      z.object({
        name: z.string().min(1).describe('Name of the e-commerce store'),
        reason: z.string().describe('Why this store is recommended to buy this product?'),
      }),
    )
    .optional()
    .describe(`List of stores recommended to buy the product`),
});

type ProductSearch = z.infer<typeof productSearchSchema>;

export const productSchema = z.object({
  name: z.string(),
  shortDescription: z.string().optional().describe('A short 1 liner about the product'),
  price: z.number(),
  productURL: z
    .string()
    .describe(
      'The product URL to purchase from the online store. This has to be the url of the e-commerce store. Not any other URL like blog, articles etc.',
    ),
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
  store: z
    .object({
      name: z.string(),
      imageUrl: z.string().describe('URL of the store image. The image url should come from the e-commerce store'),
      shopUrl: z
        .string()
        .describe(
          'URL of the e-commerce store that sells the product. The product URL and shop URL should come from the same e-commerce store',
        ),
    })
    .describe('The store that sells the product'),
});

export const shoppingResultsSchema = z.object({
  thoughts: z.string().describe('Thoughts about the shopping results'),
  products: z.array(productSchema).describe('List of products that best matches the user query'),
});

export interface Shopping {
  thoughts: string;
  products: ProductSearch[];
  searchResults: string[];
}

export const shop = (dataStream: DataStreamWriter) =>
  tool({
    description:
      'Search for the given products on specified e-commerce stores and general online, then return full product details',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      products: z.array(productSearchSchema).describe('List of products and their recommended stores to search online'),
    }),
    execute: async (params) => {
      const { thoughts, products } = params;
      dataStream.writeMessageAnnotation(thoughts);
      console.log('shopper', thoughts);
      console.dir(products, { depth: null });

      const searchResults = await shoppingSearch(
        products.map((product) => `${product.name} ${product?.remarks ?? ''}`),
      );

      const shopping: Shopping = {
        thoughts,
        products,
        searchResults: [searchResults.results],
      };

      const shoppingResults = await shopper(dataStream, shopping);
      console.dir(shoppingResults, { depth: null });
      return shoppingResults;
    },
  });

const shoppingSearch = async (queries: string[]) => {
  const searchResults = await serpSearch({ queries, type: 'shopping' });
  const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);
  const totalResults = searchResults.reduce((total: number, result: any) => total + (result?.shopping?.length ?? 0), 0);

  return { total: totalResults, results: searchResultsLLMFormatted };
};

const SHOPPER_SYSTEM_PROMT = `
  You are an intelligent shopper.
  You are given a list of products names and search results of those products from a search engine.
  Your task is to sort and group the search results based on quality, relevance, price, and other factors that you think are important. 
  You may omit some search results if you think they are not relevant or incorrect.
  Provide only accurate and relevant results.

`;

const getShoppingPrompt = (shopping: Shopping) => {
  const sections = [];

  sections.push(`
      <products>
        ${shopping.products.map((product) => `${product.name} ${product?.remarks ?? ''}`).join('\n')}
      </products>
    `);

  sections.push(`
      <searchResults>
        ${shopping.searchResults.join('\n')}
      </searchResults>
    `);

  return sections.join('\n');
};

const shopper = async (dataStream: DataStreamWriter, shopping: Shopping) => {
  const prompt = getShoppingPrompt(shopping);
  const { experimental_output } = await generateText({
    model: myProvider.languageModel('chat-model-large'),
    system: SHOPPER_SYSTEM_PROMT,
    prompt,
    experimental_output: Output.object({
      schema: shoppingResultsSchema,
    }),
  });

  console.log('researcher');
  console.dir(experimental_output, { depth: null });

  return experimental_output;
};
