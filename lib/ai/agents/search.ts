import { tool } from 'ai';
import { z } from 'zod';
import pLimit from 'p-limit';
import { allActions, ChatState, getPrompt } from './shopper';
import {
  SafeSearchType,
  SearchResults,
  search as duckduckgoSearch,
} from 'duck-duck-scrape';
import { rewriteQuery } from './query-rewriter';
import { sleep } from '@/lib/utils';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  icon: string;
}

const limit = pLimit(2);

export const search = ({ dataStream, knowledgeBank }: ChatState) =>
  tool({
    description: 'Do web search on the internet for given search queries',
    parameters: z.object({
      queries: z.array(z.string()),
    }),
    execute: async (params) => {
      const { queries } = params;
      dataStream.writeData({
        type: 'search',
        content: `Searching web for ${queries.join(', ')}`,
      });
      console.log(`Searching web for ${queries.join(', ')}`);
      const seachQueries = await rewriteQuery(queries);
      console.log('seachQueries');
      console.dir(seachQueries, { depth: null });

      // const results = (await Promise.all(
      //     seachQueries.queries.map(
      //         query => limit(async () => {
      //             await sleep(1000);
      //             return duckduckgoSearch(query, { safeSearch: SafeSearchType.STRICT });
      //         })
      //     )
      // ));

      const results: SearchResults[] = [];
      for (const query of seachQueries.queries) {
        try {
          const result = await duckduckgoSearch(query, {
            safeSearch: SafeSearchType.STRICT,
          });
          results.push(result);
        } catch (error) {
          console.error(error);
        }
        await sleep(1000);
      }

      const searchResults: SearchResult[] = results
        .flatMap((results) => results.results)
        .map((result) => ({
          title: result.title,
          url: result.url,
          description: result.description,
          icon: result.icon,
        }));

      const relatedSearchTerms = results
        .flatMap((results) => results.related)
        .map((result) => result?.text)
        .filter((result) => result !== undefined) as string[];

      if (searchResults.length > 0) {
        knowledgeBank.searchResults?.push(...searchResults);
      }

      if (relatedSearchTerms.length > 0) {
        knowledgeBank.questions?.push(...relatedSearchTerms);
      }

      knowledgeBank.availableActions = allActions;

      dataStream.writeData({
        type: 'search',
        content: `Found ${searchResults?.length || 'no'} results`,
      });
      console.log('search knowledgeBank');
      console.dir(knowledgeBank, { depth: null });

      return getPrompt(knowledgeBank);
    },
  });
