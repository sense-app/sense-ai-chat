import { tool } from 'ai';
import { z } from 'zod';
import {
  Action,
  type ChatState,
  excludeActions,
  getPrompt,
} from './shopper1';
import { deduplicate } from './deduplicator';

export const reflect = ({ dataStream, knowledgeBank }: ChatState) =>
  tool({
    description:
      'List of shopping related questions to find answers so that to narrow down the search space.',
    parameters: z.object({
      questions: z.array(z.string()),
    }),
    execute: async (params) => {
      const { questions } = params;
      dataStream.writeData({
        type: 'reflect',
        content: `Reflecting on the user's question: ${questions.join(', ')}`,
      });

      console.log(`Reflecting on the user's question: ${questions.join(', ')}`);

      let uniqueQueries = questions;
      if (knowledgeBank.questions.length > 0) {
        const result = await deduplicate(questions, knowledgeBank.questions);
        uniqueQueries = result.uniqueQueries;
      }
      knowledgeBank.questions = uniqueQueries;
      knowledgeBank.availableActions = excludeActions([Action.Reflect]);

      dataStream.writeData({
        type: 'reflect',
        content: `Reasoning the following questions: ${uniqueQueries.join(', ')}`,
      });
      console.dir(knowledgeBank, { depth: null });

      return getPrompt(knowledgeBank);
    },
  });
