// A chatbot class that retains conversation history and can call tools
import { History } from "./history.js";
import { Tools } from "./tools.js";

async function openAiCall(history, tools = [], model = "gpt-4o-mini", apiKey = null) {
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: history,
            tools: tools,
            temperature: 0.7
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error.message}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
    }

    const message = responseData.choices[0].message.content || '';
    const tool_calls = responseData.choices[0].message.tool_calls || null;
    return { message, tool_calls };
}

const openAiModels = ["gpt-4o-mini"];
const anthropicModels = ["claude-3-sonnet-20240229"]; // TODO: integrate anthropic models
const otherModels = ["deepseek-r1", "llama", "gemini"]; // TODO: integrate other models

class Chatbot {
    constructor(options = {}) {
        const defaults = {
            systemMessage: "",
            model: "gpt-4o-mini",
            tools: new Tools(),
            apiKey: null,
            history: new History(),
            maxToolCalls: 5,
        };
        const settings = { ...defaults, ...options };
        
        this.history = settings.history;
        this.model = settings.model;
        this.systemMessage = settings.systemMessage;
        this.apiKey = settings.apiKey;
        this.tools = settings.tools;
        this.maxToolCalls = settings.maxToolCalls;
    }

    // for the event that tools need to be changed mid-conversation
    setTools(tools) {
        this.tools = tools;
    }

    // in case history needs to be manually edited (for example, deleting a message)
    setHistory(history) {
        if (this.systemMessage !== "") {
            history.setSystemMessage(this.systemMessage);
        }
        this.history = history;
    }

    // get the history
    getHistory() {
        return this.history;
    }

    // set the system message
    setSystemMessage(message) {
        this.systemMessage = message;
        this.history.setSystemMessage(message);
    }

    // send a user message and get a response
    async userMessage(userMessage) {
        this.history.addMessage({ role: "user", content: userMessage });
        // if the model is an openai model, use the openai call function
        if (openAiModels.includes(this.model)) {
            return this.openAiToolLoop();
        } else {
            throw new Error(`Model ${this.model} is not supported`);
        }
    }

    // tool call loop for openai models
    async openAiToolLoop() {
        let callingTools = true;
        let attempts = 0;
        while (callingTools && attempts < this.maxToolCalls) {
            attempts++;
            const { message, tool_calls } = await openAiCall(this.history.getHistory(100), this.tools.getTools(), this.model, this.apiKey);
            if (!tool_calls) {
                // if there are no tool calls, we are done
                callingTools = false;
                this.history.addMessage({ role: "assistant", content: message });
                return message;
            } else {
                // if there are tool calls, we need to call the tools, then loop again and allow the model to react to the results
                this.history.addMessage({ role: "assistant", content: message, tool_calls: tool_calls });
                callingTools = true;
                tool_calls.forEach(tool_call => {
                    try {
                        const args = JSON.parse(tool_call.function.arguments);
                        const response = this.tools.call(tool_call.function.name, args);
                        this.history.addMessage({ 
                            role: 'tool', 
                            content: response.toString(),
                            tool_call_id: tool_call.id,
                            name: tool_call.function.name
                        });
                    } catch (error) {
                        this.history.addMessage({ 
                            role: 'tool', 
                            content: `Error: ${error.message}`,
                            tool_call_id: tool_call.id,
                            name: tool_call.function.name
                        });
                    }
                });
            }
        }
        // temporarily disable tool calls and have the model respond to the last tool call
        const { message, tool_calls } = await openAiCall(this.history.getHistory(100), [], this.model, this.apiKey); // No tools passed in
        this.history.addMessage({ role: "assistant", content: message });
        return message;
    }

}

export { Chatbot };