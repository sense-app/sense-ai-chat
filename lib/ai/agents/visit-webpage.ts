import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

export const visitWebPage = (dataStream: DataStreamWriter) =>  tool({
  description: 'visit and read a webpage url and get the content',
  parameters: z.object({
    url: z.string().url(),
  }),
    execute: async(url) => {

    },
});