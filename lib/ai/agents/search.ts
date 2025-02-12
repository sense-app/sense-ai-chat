import { tool } from 'ai';
import { z } from 'zod';
import { ChatState } from './shopper';
import { SafeSearchType, search as duckduckgoSearch} from "duck-duck-scrape";
import { rewriteQuery } from './query-rewriter';

export const search = ({dataStream, knowledgeBank}: ChatState) =>  tool({
    description: 'Do web search on the internet for given search queries',
    parameters: z.object({
      queries: z.array(z.string())
    }),
      execute: async(params) => {
        const { queries } = params;
        dataStream.writeData(`Searching web for ${queries.join(', ')}`);
        const seachQueries = await rewriteQuery(queries);

        const results = (await Promise.all(
            seachQueries.queries.map(query =>
                duckduckgoSearch(query, {
                    safeSearch: SafeSearchType.STRICT,
                })
            )
        ));

        //TODO: extract relevant information from the results and add to knowledge bank

        dataStream.writeData(`Found ${results || 'no'} results`);
        
      },
  });