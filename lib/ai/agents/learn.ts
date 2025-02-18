import { generateObject } from "ai";
import { myProvider } from "../models";
import { z } from "zod";
import { productSchema } from "./shopper";

const LearningsSchema = z.object({
  learnings: z.array(z.string()).describe("Learnings from the contents"),
  followUpQuestions: z
    .array(z.string())
    .describe("Follow up questions to search online"),
  products: z
    .array(productSchema)
    .describe("Products that best matches the user query")
});
export type Learnings = z.infer<typeof LearningsSchema>;

const getPrompt = (
  userQuery: string,
  questions: string[],
  contents: string[]
) => {
  return `
    Your are an advanced shopping assistant. 
    The user has asked you for <query>${userQuery}</query>.
    ${
      questions?.length > 0
        ? `To understand the user's query, you have breakdown the following questions: 
    ${questions.join(", ")}.`
        : ""
    }
    
    Then, you have searched the web and retreived the following contents from webpages. Based on this, generate a list of learnings that answers the questions, 
    and aggregate all the products from the webpages that are relevant to the questions. Include as much product metadata as possible like product name, price, description, image url, shop url, reviews, offers, stores that sell them etc.
    Lastly, if you think the contents does not answer the questions and user query or does not have actual product information to buy, 
    then generate a list of further questions to search online and get the relevant information. 
    The learnings should be descriptive and include key details.

    The contents are: 
    ${contents.join("\n")}
    `;
};

export const learn = async (
  userQuery: string,
  questions: string[],
  contents: string[]
): Promise<Learnings> => {
  const prompt = getPrompt(userQuery, questions, contents);
  const response = await generateObject({
    model: myProvider.languageModel("chat-model-large"),
    schema: LearningsSchema,
    prompt: getPrompt(userQuery, questions, contents)
  });
  console.log("learn");
  console.dir(response, { depth: null });
  return response.object as Learnings;
};
