import { tool } from 'ai';
import { z } from 'zod';
import { Action, allActions, ChatState, excludeActions } from './shopper';
import { deduplicate } from './deduplicator';

export const reflect = ({dataStream, knowledgeBank}: ChatState) =>  tool({
  description: 'List of shopping related questions to find answers so that to narrow down the search space.',
  parameters: z.object({
    questions: z.array(z.string())
  }),
    execute: async(params) => {
      const { questions } = params;
      dataStream.writeData(`Reflecting on the user's question: ${questions.join(', ')}`);
      console.log(`Reflecting on the user's question: ${questions.join(', ')}`)
      const result = await deduplicate(questions, knowledgeBank.questions ?? []);
      knowledgeBank.questions?.push(...result.uniqueQueries);
      knowledgeBank.availableActions = excludeActions([Action.Reflect]);
      dataStream.writeData(`Reasoning the following questions: ${result.uniqueQueries.join(', ')}`);
      console.dir(knowledgeBank, {depth: null})
    },
});