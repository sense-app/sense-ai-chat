import { generateObject } from 'ai';
import { z } from 'zod';
import { myProvider } from '../models';

const searchQueriesSchema = z.object({
  thoughts: z.string().describe('Strategic reasoning about query complexity and search approach'),
  queries: z
    .array(z.string().describe('Search query with integrated operators'))
    .describe('Array of search queries with appropriate operators'),
});

type SearchQueries = z.infer<typeof searchQueriesSchema>;

function getPrompt(query: string): string {
  return `You are an expert Information Retrieval Assistant. Transform user queries into precise keyword combinations with strategic reasoning and appropriate search operators.
  
  Core Rules:
  1. Generate search queries that directly include appropriate operators
  2. Keep base keywords minimal: 2-4 words preferred
  3. Use exact match quotes for specific phrases that must stay together
  4. Apply + operator for critical terms that must appear
  5. Use - operator to exclude irrelevant or ambiguous terms
  6. Add appropriate filters (filetype:, site:, lang:, loc:) when context suggests
  7. Split queries only when necessary for distinctly different aspects
  8. Preserve crucial qualifiers while removing fluff words
  9. Make the query resistant to SEO manipulation
  
  Available Operators:
  - "phrase" : exact match for phrases
  - +term : must include term
  - -term : exclude term
  - filetype:pdf/doc : specific file type
  - site:example.com : limit to specific site
  - lang:xx : language filter (ISO 639-1 code)
  - loc:xx : location filter (ISO 3166-1 code)
  - intitle:term : term must be in title
  - inbody:term : term must be in body text
  
  Examples with Strategic Reasoning:
  
  Input Query: What's the difference between ReactJS and Vue.js for building web applications?
  Thought: This is a comparison query. User is likely looking for technical evaluation and objective feature comparisons, possibly for framework selection decisions. We'll split this into separate queries to capture both high-level differences and specific technical aspects.
  Queries: [
    "react vue comparison +advantages +disadvantages",
    "react vue performance +benchmark"
  ]
  
  Input Query: How to fix a leaking kitchen faucet?
  Thought: This is a how-to query seeking practical solutions. User likely wants step-by-step guidance and visual demonstrations for DIY repair. We'll target both video tutorials and written guides.
  Queries: [
    "kitchen faucet leak repair site:youtube.com",
    "faucet drip fix +diy +steps -professional",
    "faucet repair tools +parts +guide"
  ]
  
  Input Query: What are healthy breakfast options for type 2 diabetes?
  Thought: This is a health-specific informational query. User needs authoritative medical advice combined with practical meal suggestions. Splitting into medical guidelines and recipes will provide comprehensive coverage.
  Queries: [
    "type 2 diabetes breakfast guidelines site:edu",
    "diabetic breakfast recipes -sugar +easy"
  ]
  
  Input Query: Latest AWS Lambda features for serverless applications
  Thought: This is a product research query focused on recent updates. User wants current information about specific technology features, likely for implementation purposes. We'll target official docs and community insights.
  Queries: [
    "aws lambda features site:aws.amazon.com intitle:2024",
    "lambda serverless best practices +new -legacy"
  ]
  
  Input Query: Find Python tutorials on YouTube, but exclude beginner content
  Thought: This is an educational resource query with specific skill-level requirements. User is seeking advanced learning materials on a specific platform. We'll focus on advanced topics while explicitly filtering out basic content.
  Queries: [
    "python advanced programming site:youtube.com -beginner -basics",
    "python design patterns tutorial site:youtube.com"
  ]
  
  Now, process this query:
  Input Query: ${query}
  `;
}

export const rewriteQuery = async (queries: string[]): Promise<SearchQueries> => {
  const responses = await Promise.all(
    queries.map((query) =>
      generateObject({
        model: myProvider.languageModel('chat-model-large'),
        schema: searchQueriesSchema,
        prompt: getPrompt(query),
      }),
    ),
  );

  return {
    thoughts: responses.map((r) => r.object.thoughts).join('\n\n'),
    queries: responses.flatMap((r) => r.object.queries),
  };
};
