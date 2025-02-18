import { generateObject, tool } from "ai";
import { myProvider } from "../models";
import { z } from "zod";
import { getPrompt, KnowledgeBank, productSchema } from "./shopper";

export type ProductType = z.infer<typeof productSchema>;

export const answer = tool({
  description:
    "Return the results of the search query or page read. The results are the products that best matches the user query",
  parameters: z.object({
    knowledgeBank: z
      .string()
      .describe("The knowledge bank that contains the search results")
  }),
  execute: async (params) => {
    const response = await generateObject({
      model: myProvider.languageModel("chat-model-large"),
      schema: z.array(productSchema),
      prompt: params.knowledgeBank
    });

    return response.object as ProductType[];
  }
});
