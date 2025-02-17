import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { rewriteQuery } from '@/lib/ai/agents/query-rewriter';
import { serpSearch } from '@/lib/services/serp';
import { jsonToLLMFormat } from '@/lib/llm-formatter';

export interface Research {
    queries: string[];
    searchResults: string[];
    contents: string[];
    learnings: string[];
    thoughts: string[];
}

export const research = (dataStream: DataStreamWriter) =>  tool({
    description: 'Do research on the following queries by searching online and reading websites',
    parameters: z.object({
        thoughts: z.string().describe(`Explain why choose this action, what's the thought process behind choosing this action`),
        queries: z.array(z.string()).describe(`List of queries to research online to find the user's desired products and the online stores that sell them`),
    }),
      execute: async(params) => {
        const { thoughts, queries } = params;
        dataStream.writeMessageAnnotation(thoughts);
        const research: Research = {
            queries,
            searchResults: [],
            contents: [],
            learnings: [],
            thoughts: [],
        };

        const result = researcher(research);

      },
  });

  export const query = (dataStream: DataStreamWriter, research: Research) =>  tool({
    description: 'Use an online search engine to look up the following queries and provide the search results',
    parameters: z.object({
        thoughts: z.string().describe(`Explain why choose this action, what's the thought process behind choosing this action`),
        queries: z.array(z.string()).describe(`Search queries to find the user's desired products and the online stores that sell them`),
    }),
      execute: async(params) => {
        const { thoughts, queries } = params;
        dataStream.writeMessageAnnotation(thoughts);
        dataStream.writeMessageAnnotation(`Reasoning...${queries.join(', ')}`);
        const seachQueries = await rewriteQuery(queries);
        const searchResults = await serpSearch(seachQueries.queries);

        const totalResults = searchResults.reduce((total: number, result: any) => total + (result?.organic?.length ?? 0) + (result?.topStories?.length ?? 0), 0);
        
        dataStream.writeMessageAnnotation(`Found ${totalResults} search results`);
        const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);

        research.queries.push(...seachQueries.queries);
        research.searchResults.push(...searchResultsLLMFormatted);

        return research;
      },
  });

  const RESEARCHER_SYSTEM_PROMPT = `
    You are an intelligent shopping researcher.
    Your role is to do shopping research to find the best matching products and the online stores selling them.

    You have access to the following tools:
    Visit - to visit any websites and read content given their url
    Query - to ask any queries that might help with your shopping research. This tool will use an online search engine to search the queries and returns the search results
  `;

  const getResearchPrompt = (research: Research) => {
    const sections = [];
    sections.push(`
      <queries>
        ${research.queries.join('\n')}
      </queries>
    `);

    sections.push(`
      <searchResults>
        ${research.searchResults.join('\n')}
      </searchResults>
    `);

    if (research.contents.length > 0) {
      sections.push(`
        <contents>
          ${research.contents.join('\n')}
        </contents>
      `);
    }

    if (research.learnings.length > 0) {
      sections.push(`
        <learnings>
          ${research.learnings.join('\n')}
        </learnings>
      `);
    }

    if (research.thoughts.length > 0) {
      sections.push(`
        <thoughts>
          ${research.thoughts.join('\n')}
        </thoughts>
      `);
    }

    return sections.join('\n');
  }


  const researcher = async (research: Research) => {
    const prompt = getResearchPrompt(research);
  }
