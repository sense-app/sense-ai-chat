import { jsonToLLMFormat } from '@/lib/llm-formatter';
import { serpSearch } from '@/lib/services/serp';
import { type DataStreamWriter, generateText, Output, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/models';

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

type ProductSearch = z.infer<typeof productSearchSchema>;

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
  thoughts: z.string().describe('Thoughts about the shopping results'),
  summary: z.string().describe('Summary of the all shopping results and recommendations'),
  productsGroup: z
    .array(productGroupSchema)
    .describe(
      'List of products grouped by product name from various e-commerce stores. This is helpful to compare the prices, offers, delivery details of the same product across different e-commerce stores',
    ),
  storeGroup: z.array(storeGroupSchema).describe('List of products grouped by store'),
});

export interface Shopping {
  thoughts: string;
  products: ProductSearch[];
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
      products: z
        .array(productSearchSchema)
        .describe(
          'List of product search terms - name/kind/type/categories. Each search term has to be explicit and clear',
        ),
    }),
    execute: async (params) => {
      const { thoughts, products } = params;
      dataStream.writeMessageAnnotation(thoughts);
      console.log('shopper', thoughts);
      console.dir(products, { depth: null });

      const searchResults = await shoppingSearch(
        products.map((product) => `${product.searchTerm} ${product?.filter ?? ''}`),
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

export const shoppingSearch = async (queries: string[]) => {
  const searchResults = await serpSearch({ queries, type: 'shopping' });
  const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);
  const totalResults = searchResults.reduce((total: number, result: any) => total + (result?.shopping?.length ?? 0), 0);

  return { total: totalResults, results: searchResultsLLMFormatted };
};

const SHOPPER_SYSTEM_PROMT = `
You are an intelligent shopper tasked with organizing a list of products and their search results from a search engine. 
Your job is to sort and group the search results by quality, relevance, price, and other important factors. 
Omit irrelevant or incorrect results, and provide only accurate and relevant details.

All results should be specific to the Singapore context.
You should not ask the user to gather additional information. 

Your response should consist of a structured JSON output with two primary groupings:

- Grouped by Store: List all products sold by the same store.
- Grouped by Product: If the same product is available across multiple stores, group it by product, showing all purchase options from different stores. 
This allows for easy comparison of prices, offers, and delivery details for the same product across different e-commerce platforms.


Each product should appear only once, either in the "store" or "product" grouping, not both.
`;

const getShoppingPrompt = (shopping: Shopping) => {
  const sections = [];

  sections.push(`
      <products>
        ${shopping.products.map((product) => `${product.searchTerm} ${product?.filter ?? ''}`).join('\n')}
      </products>
    `);

  sections.push(`
    <thoughts>
      ${shopping.thoughts}
    </thoughts>
    `);

  sections.push(`
      <searchResults>
        ${shopping.searchResults.join('\n')}
      </searchResults>
    `);

  return sections.join('\n');
};

export const shopper = async (dataStream: DataStreamWriter, shopping: Shopping) => {
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
