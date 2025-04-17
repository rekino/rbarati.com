import pug from "pug";
import path from "path";
import { generateChatResponse } from "../config/together";
import { IChatMessage } from "../models/chat";
import AppConfig from "../appconfig";

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
