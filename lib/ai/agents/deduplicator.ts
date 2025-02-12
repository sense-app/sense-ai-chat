import { generateObject } from "ai";
import { myProvider } from "../models";
import { z } from "zod";

const DeduplicatedResultSchema = z.object({
    thoughts: z.string().describe('The thought process'),
    uniqueQueries: z.array(z.string()).describe('List of unique queries'),
});
export type DeduplicatedResult = z.infer<typeof DeduplicatedResultSchema>;

function getPrompt(newQueries: string[], existingQueries: string[]): string {
    return `You are an expert in semantic similarity analysis. Given a set of new queries (A) and existing queries (B), identify which queries from set A are semantically unique when compared BOTH to other queries within A AND to queries in set B.
  
  Core Rules:
  1. Consider semantic meaning and query intent, not just lexical similarity
  2. Account for different phrasings of the same information need
  3. A query is considered duplicate ONLY if:
     - It has identical base keywords AND identical operators to another query in set A
     - OR it has identical base keywords AND identical operators to a query in set B
  4. Queries with same base keywords but different operators are NOT duplicates
  5. Different aspects or perspectives of the same topic are not duplicates
  6. Consider query specificity - a more specific query is not a duplicate of a general one
  7. Search operators that make queries behave differently:
     - Different site: filters (e.g., site:youtube.com vs site:github.com)
     - Different file types (e.g., filetype:pdf vs filetype:doc)
     - Different language/location filters (e.g., lang:en vs lang:es)
     - Different exact match phrases (e.g., "exact phrase" vs no quotes)
     - Different inclusion/exclusion (+/- operators)
     - Different title/body filters (intitle: vs inbody:)
  
  Examples:
  
  Set A: [
    "python tutorial site:youtube.com",
    "python tutorial site:udemy.com",
    "python tutorial filetype:pdf",
    "best restaurants brooklyn",
    "best restaurants brooklyn site:yelp.com",
    "python tutorial site:youtube.com -beginner"
  ]
  Set B: [
    "python programming guide",
    "brooklyn dining recommendations"
  ]
  Thought: Let's analyze each query in set A considering operators:
  1. First query targets YouTube tutorials - unique
  2. Second query targets Udemy - different site operator, so unique
  3. Third query targets PDF files - different filetype operator, so unique
  4. Fourth query is basic restaurant search - unique
  5. Fifth query adds Yelp filter - different site operator, so unique
  6. Sixth query has same site as first but adds exclusion - different operator combo, so unique
  None of the queries in set B have matching operators, so they don't cause duplicates.
  Unique Queries: [
    "python tutorial site:youtube.com",
    "python tutorial site:udemy.com",
    "python tutorial filetype:pdf",
    "best restaurants brooklyn",
    "best restaurants brooklyn site:yelp.com",
    "python tutorial site:youtube.com -beginner"
  ]
  
  Set A: [
    "machine learning +tensorflow filetype:pdf",
    "machine learning +pytorch filetype:pdf",
    "machine learning tutorial lang:en",
    "machine learning tutorial lang:es"
  ]
  Set B: [
    "machine learning guide"
  ]
  Thought: Analyzing queries with attention to operators:
  1. First query specifies tensorflow PDFs - unique
  2. Second query targets pytorch PDFs - different inclusion operator, so unique
  3. Third query targets English content - unique due to language filter
  4. Fourth query targets Spanish content - different language filter, so unique
  The query in set B has no operators and different base terms, so it doesn't affect our decisions.
  Unique Queries: [
    "machine learning +tensorflow filetype:pdf",
    "machine learning +pytorch filetype:pdf",
    "machine learning tutorial lang:en",
    "machine learning tutorial lang:es"
  ]
  
  Now, analyze these sets:
  Set A: ${JSON.stringify(newQueries)}
  Set B: ${JSON.stringify(existingQueries)}`;
}

export const deduplicate = async (newQueries: string[], existingQueries: string[]) : Promise<DeduplicatedResult> => {
    const response = await generateObject({
        model: myProvider.languageModel('chat-model-small'),
        schema: DeduplicatedResultSchema,
        prompt: getPrompt(newQueries, existingQueries)
    });

    return response.object as DeduplicatedResult;
}