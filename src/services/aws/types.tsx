export interface Message {
    role: "user" | "assistant";
    content: string;
}

export interface PromptResponse {
    completion: string;
}
