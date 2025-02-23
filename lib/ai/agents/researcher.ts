import { type DataStreamWriter, generateObject, generateText, tool } from 'ai';
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
      dataStream.writeMessageAnnotation(`Reasoning...`);
      dataStream.writeMessageAnnotation(thoughts);
      dataStream.writeMessageAnnotation(`Searching...${queries.join(', ')}`);
      const searchResults = await websearch(queries);
      dataStream.writeMessageAnnotation(`Found ${searchResults.total} search results`);

      research.thoughts.push(`Search step - ${thoughts}`);
      research.queries.push(...queries);
      research.searchResults.push(...searchResults.results);

      return research;
    },
  });

export const websearch = async (queries: string[]) => {
  // const searchQueries = await rewriteQuery(queries);
  const searchResults = await serpSearch({ queries: queries });
  const searchResultsLLMFormatted = jsonToLLMFormat(searchResults);

  const totalResults = searchResults.reduce(
    (total: number, result: any) => total + (result?.organic?.length ?? 0) + (result?.topStories?.length ?? 0),
    0,
  );

  return { total: totalResults, results: searchResultsLLMFormatted };
};

export const read = (dataStream: DataStreamWriter, research: Research) =>
  tool({
    description: 'Read contents from any webpage given their urls',
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
      research.thoughts.push(`Read step - ${thoughts}`);
      webpageUrls.forEach((url) => research.visitedUrls.add(url.toString()));
      return research;
    },
  });

const RESEARCHER_SYSTEM_PROMPT = `
    You are an intelligent shopping researcher.
    Your task is to do shopping research to find the best matching products and the online stores selling them.
    Do thorough research by reading articles, blogs and websites if needed and gather as many information as possible.
    Find many matching product results.

    You have access to the following tools:
    Search - to ask any queries that might help with your shopping research. This tool will use an online search engine to search the queries and returns the search results
    Read - to read conent from any websites given their urls
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
  summary: z
    .string()
    .describe(
      'Summary of all the findings from your research on the best matching products in Markdown format. Provide detailed findings',
    ),
  thoughts: z.string().describe('What are your thoughts about the research'),
  products: z
    .array(
      z.object({
        name: z.string().describe('Name of the product'),
        remarks: z.string().optional().describe('Any additional remarks or filter criteria about the product'),
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

type ResearchResult = z.infer<typeof researchResultsSchema>;

export const researcher = async (dataStream: DataStreamWriter, research: Research) => {
  console.log('researcher is being called');
  console.dir(research, { depth: null });

  const prompt = getResearchPrompt(research);
  const result = await generateText({
    model: myProvider.languageModel('chat-model-large'),
    system: RESEARCHER_SYSTEM_PROMPT,
    prompt,
    tools: {
      query: search(dataStream, research),
      read: read(dataStream, research),
    },
    maxSteps: 10,
  });

  const researchResults = await generateObject({
    model: myProvider.languageModel('chat-model-large'),
    system: `Given the following research results, structure the response to the output JSON format`,
    prompt: `
      <ResearchSummary>
        ${result?.text}
      </ResearchSummary>

      <context>
        ${getResearchPrompt(research)}
      </context>
    `,
    schema: researchResultsSchema,
  });

  console.dir(researchResults, { depth: null });

  const { thoughts, summary, products } = researchResults.object;
  dataStream.writeMessageAnnotation(thoughts);
  dataStream.writeMessageAnnotation(summary);
  dataStream.writeMessageAnnotation(`The best matching products are ${products.map((p) => p.name).join(', ')}`);
  return researchResults.object;
};
