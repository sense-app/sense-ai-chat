import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

export const shopper = (dataStream: DataStreamWriter) =>
  tool({
    description:
      'Search for the given products on specified e-commerce stores and online, then return full product details',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      products: z
        .array(
          z.object({
            name: z.string().describe('Name of the product'),
            stores: z
              .array(
                z.object({
                  name: z.string().describe('Name of the e-commerce store'),
                  reason: z.string().describe('Why this store is recommended to buy this product?'),
                }),
              )
              .optional()
              .describe(`List of stores recommended to buy the product`),
          }),
        )
        .describe('List of products and their recommended stores to search online'),
    }),
    execute: async (params) => {
      const { thoughts, products } = params;
      dataStream.writeMessageAnnotation(thoughts);
    },
  });
