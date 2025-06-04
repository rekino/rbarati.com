import pug from "pug";
import path from "path";
import { generateChatResponse } from "../config/together";
import { IChatMessage } from "../models/chat";
import AppConfig from "../appconfig";
import pc from "../config/pinecone";

import appconfig from "../appconfig";

const templatePath = path.join(__dirname, '/prompts');

export async function handleChat(experiences: string[], conversation: IChatMessage[], message: string) {
  const system_prompt: IChatMessage[] = [{
    role: "system",
    content: pug.renderFile(path.join(templatePath, "system.pug"), { first_name: "Ramin", last_name: "Barati", experiences }),
  }];

  const messages = system_prompt.concat(
    conversation,
    {
      role: "user",
      content: message,
    }
  );

  const response = await generateChatResponse(messages, AppConfig.together_llm_model);

  return response;
}

/**
 * retrieveAndRerankExperiences:
 *   1. Uses Pinecone's text query to generate an embedding internally.
 *   2. Retrieves an initial set of candidate matches.
 *   3. Uses the built-in reranker to re-score those candidates with an LLM.
 * @param question  The user’s interview question (raw text).
 * @param candidateK  How many initial candidates to fetch (e.g. 10–20).
 * @param topK        How many final top hits to return (e.g. 3–5).
 */
export async function retrieveAndRerankExperiences(
  question: string,
  candidateK = 10,
  topK = 2
) {
  const index = pc.index(appconfig.pinecone_index).namespace(appconfig.pinecone_namespace);

  // Search the dense index and rerank results
  const results = await index.searchRecords({
    query: {
      topK: candidateK,
      inputs: { text: question },
    },
    rerank: {
      model: 'bge-reranker-v2-m3',
      topN: topK,
      rankFields: ['chunk_text'],
    },
  });

  return results.result.hits.map(experience => pug.renderFile(path.join(templatePath, "experience.pug"), experience.fields));
}
