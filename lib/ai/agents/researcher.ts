import { type DataStreamWriter, generateText, Output, tool } from 'ai';
import { z } from 'zod';
import { rewriteQuery } from '@/lib/ai/agents/query-rewriter';
import { serpSearch } from '@/lib/services/serp';
import { jsonToLLMFormat } from '@/lib/llm-formatter';
import { myProvider } from '@/lib/ai/models';
import { isValidUrl } from '@/lib/utils';
import { readWebpageContent } from '@/lib/ai/agents/read';

export interface Research {
  queries: string[];
  searchResults: string[];
  contents: string[];
  visitedUrls: Set<string>;
  learnings: string[];
  thoughts: string[];
}

export const research = (dataStream: DataStreamWriter) =>
  tool({
    description: 'Do research on the following queries by searching online and reading websites',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      queries: z
        .array(z.string())
        .describe(
          `List of queries to research online to find the user's desired products and the online stores that sell them`,
        ),
    }),
    execute: async (params) => {
      const { thoughts, queries } = params;
      dataStream.writeMessageAnnotation(thoughts);
      dataStream.writeMessageAnnotation(`Reasoning...${queries.join(', ')}`);
      const searchResults = await websearch(queries);

      dataStream.writeMessageAnnotation(`Found ${searchResults.total} search results`);

      const research: Research = {
        queries,
        searchResults: [searchResults.results],
        contents: [],
        visitedUrls: new Set(),
        learnings: [],
        thoughts: [],
      };

      const result = researcher(dataStream, research);
      console.dir(result, { depth: null });
      return result;
    },
  });

export const search = (dataStream: DataStreamWriter, research: Research) =>
  tool({
    description: 'Use an online search engine to look up the following queries and provide the search results',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      queries: z
        .array(z.string())
        .describe(`Search queries to find the user's desired products and the online stores that sell them`),
    }),
    execute: async (params) => {
      const { thoughts, queries } = params;
      dataStream.writeMessageAnnotation(thoughts);
      dataStream.writeMessageAnnotation(`Reasoning...${queries.join(', ')}`);
      const searchResults = await websearch(queries);

      dataStream.writeMessageAnnotation(`Found ${searchResults.total} search results`);

      research.queries.push(...queries);
      research.searchResults.push(...searchResults.results);

      return research;
    },
  });

const websearch = async (queries: string[]) => {
  const searchQueries = await rewriteQuery(queries);
  const searchResults = await serpSearch(searchQueries.queries);
  const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);

  const totalResults = searchResults.reduce(
    (total: number, result: any) => total + (result?.organic?.length ?? 0) + (result?.topStories?.length ?? 0),
    0,
  );

  return { total: totalResults, results: searchResultsLLMFormatted };
};

export const read = (dataStream: DataStreamWriter, research: Research) =>
  tool({
    description: 'Read contents from any webpage given their url',
    parameters: z.object({
      thoughts: z
        .string()
        .describe(`Explain why choose this action, what's the thought process behind choosing this action`),
      urls: z.array(z.string()).describe(`List of urls to visit and read contents`),
    }),
    execute: async (params) => {
      const { thoughts, urls } = params;
      dataStream.writeMessageAnnotation(thoughts);

      const webpageUrls = urls
        .filter((url) => !research.visitedUrls.has(url))
        .filter((url) => isValidUrl(url))
        .map((url) => new URL(url));
      const domains = webpageUrls.map((url) => url.hostname);
      dataStream.writeMessageAnnotation(`Learning from ${domains.join(', ')}`);

      const contents = await Promise.all(urls.map((url) => readWebpageContent(url)));

      research.contents.push(...contents);
      webpageUrls.forEach((url) => research.visitedUrls.add(url.toString()));
      return research;
    },
  });

const RESEARCHER_SYSTEM_PROMPT = `
    You are an intelligent shopping researcher.
    Your role is to do shopping research to find the best matching products and the online stores selling them.

    You have access to the following tools:
    Read - to visit any websites and read content given their url
    Search - to ask any queries that might help with your shopping research. This tool will use an online search engine to search the queries and returns the search results
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
};

const researchResultsSchema = z.object({
  learnings: z.string().describe('What you learned from the research'),
  thoughts: z.string().describe('What are your thoughts about the research'),
  products: z
    .array(
      z.object({
        name: z.string().describe('Name of the product'),
        reason: z.string().describe('Why did you choose this product?'),
        stores: z
          .array(
            z.object({
              name: z.string().describe('Name of the e-commerce store'),
              reason: z.string().describe('Why did you choose this store to buy this product?'),
            }),
          )
          .optional()
          .describe(`List of stores found from the research recommended to buy the product`),
      }),
    )
    .describe(`List of products found from the research that match the user's query`),
});

export type ResearchResults = z.infer<typeof researchResultsSchema>;

const researcher = async (dataStream: DataStreamWriter, research: Research) => {
  const prompt = getResearchPrompt(research);
  const { experimental_output } = await generateText({
    model: myProvider.languageModel('chat-model-large'),
    system: RESEARCHER_SYSTEM_PROMPT,
    prompt,
    experimental_output: Output.object({
      schema: researchResultsSchema,
    }),
    tools: {
      query: search(dataStream, research),
      read: read(dataStream, research),
    },
    maxSteps: 10,
  });

  console.log('researcher');
  console.dir(experimental_output, { depth: null });

  return experimental_output;
};
