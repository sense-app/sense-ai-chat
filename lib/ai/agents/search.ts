import { tool } from 'ai';
import { z } from 'zod';
import { allActions, ChatState } from './shopper';
import { SafeSearchType, search as duckduckgoSearch} from "duck-duck-scrape";
import { rewriteQuery } from './query-rewriter';

export interface SearchResult {
    title: string;
    url: string;
    description: string;
    icon: string;   
}

export const search = ({dataStream, knowledgeBank}: ChatState) =>  tool({
    description: 'Do web search on the internet for given search queries',
    parameters: z.object({
      queries: z.array(z.string())
    }),
      execute: async(params) => {
        const { queries } = params;
        dataStream.writeData(`Searching web for ${queries.join(', ')}`);
        console.log(`Searching web for ${queries.join(', ')}`);
        const seachQueries = await rewriteQuery(queries);

        const results = (await Promise.all(
            seachQueries.queries.map(query =>
                duckduckgoSearch(query, {
                    safeSearch: SafeSearchType.STRICT,
                })
            )
        ));

        const searchResults: SearchResult[] = results.flatMap(results => results.results).map(result => ({
            title: result.title,
            url: result.url,
            description: result.description,
            icon: result.icon
        }));

        const relatedSearchTerms = results.flatMap(results => results.related).map(result => result?.text).filter(result => result !== undefined) as string[];

        knowledgeBank.searchResults?.push(...searchResults);
        knowledgeBank.questions?.push(...relatedSearchTerms);
        knowledgeBank.availableActions = allActions;

        dataStream.writeData(`Found ${searchResults?.length || 'no'} results`);
        console.dir(knowledgeBank, {depth: null});
      },
  });