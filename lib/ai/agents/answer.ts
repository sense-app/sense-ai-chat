import { DataStreamWriter, tool } from 'ai';
import { Currency } from 'lucide-react';
import { z } from 'zod';

export const answer = (dataStream: DataStreamWriter) =>  tool({
  description: 'answer a question',
  parameters: z.object({
    question: z.string(),
    answer: z.string(),
    product: z.object({
      name: z.string(),
      description: z.string(),
      price: z.number(),
      shopUrl: z.string().url(),
      imageUrl: z.string().url(),
      category: z.string(),
      review: z.string(),
      originalPrice: z.number(),
      currencyCode: z.string(),
    })
  }),
    execute: async(question) => {

    },
});