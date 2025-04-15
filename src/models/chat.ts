export interface IChatMessage {
  role: "system" | "user" | "assistant" | "tool",
  content: string,
}