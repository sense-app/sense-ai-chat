import { tool } from 'ai';
import { z } from 'zod';
import { ChatState } from '@/lib/ai/agents/shopper';
import { rewriteQuery } from '@/lib/ai/agents/query-rewriter';
import { serpSearch } from '@/lib/services/serp';
import { jsonToLLMFormat } from '@/lib/llm-formatter';

export const research = ({dataStream, knowledgeBank}: ChatState) =>  tool({
    description: 'Do research on the following queries by searching online and reading websites',
    parameters: z.object({
        think: z.string().describe(`Explain why choose this action, what's the thought process behind choosing this action`),
        queries: z.array(z.string()).describe(`Generate search queries to identify the products the user wants and to find the online stores selling them`),
    }),
      execute: async(params) => {
        const { think, queries } = params;
        dataStream.writeMessageAnnotation(think);
        dataStream.writeMessageAnnotation(`Reasoning...${queries.join(', ')}`);
        const seachQueries = await rewriteQuery(queries);
        const searchResults = await serpSearch(seachQueries.queries);
        const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);
      },
  });