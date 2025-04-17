import Together from "together-ai";
import { IChatMessage } from "../models/chat";

if (!process.env.TOGETHER_API_KEY)
    throw new Error("TOGETHER_API_KEY is missing from env.");

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

export async function generateChatResponse(messages: IChatMessage[], model: string) {
    const response = await together.chat.completions.create({ model, messages });

    if (!response.choices[0].message || !response.choices[0].message.content)
        throw new Error("The response from Together API does not contain a message or it's content is empty.")

    return response.choices[0].message.content;
}