// A chatbot class that retains conversation history and can call tools
import { History } from "../utils/history.js";
import { Tools } from "./tools.js";

async function openAiCall(history, tools = [], model = "gpt-4o-mini", apiKey = null) {
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const body = {
        model: model,
        messages: history
    };
    
    // Only add tools if they are provided and non-empty
    if (tools && tools.length > 0) {
        body.tools = tools;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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

/**
 * Get a response from the language model.
 * 
 * @param {Object} options - The options for the LLM response.
 * @param {string} options.message - The user message to the LLM.
 * @param {string} options.systemMessage - The system message to set the context for the LLM.
 * @param {string} options.model - The model to use for the LLM response.
 * @param {string} [options.apiKey] - The API key for authentication. If not provided, it will use the OPENAI_API_KEY environment variable.
 * @returns {Promise<string>} - The response message from the LLM.
 * @throws {Error} - Throws an error if the API call fails or the response format is invalid.
 */
async function getLLMResponse(options) {
    const { message, systemMessage, model, apiKey } = options;
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const history = new History();
    if (systemMessage) {
        history.setSystemMessage(systemMessage);
    }
    history.addMessage({ role: "user", content: message });
    const response = await openAiCall(history.getHistory(), [], model, apiKey);
    return response.message;
}
/**
 * Assigns a task to an AI agent.
 * 
 * @param {Object} options - The options for the agent task.
 * @param {string} options.message - The user message to the agent.
 * @param {string} [options.systemMessage=""] - The system message to set the context for the agent.
 * @param {Tools} [options.tools=[]] - The tools that the agent can use.
 * @param {string} [options.model="gpt-4o-mini"] - The model to use for the agent.
 * @param {string} [options.apiKey] - The API key for authentication. If not provided, it will use the OPENAI_API_KEY environment variable.
 * @param {number} [options.maxToolCalls=25] - A limit on the number of tool calls the agent can make.
 * @param {number} [options.maxHistory=100] - The number of messages that can be stored in the conversation history.
 * @returns {Promise<string>} - The response message from the agent.
 * @throws {Error} - Throws an error if the API call fails or the response format is invalid.
 */
async function doAgentTask(options) {
    const { message, systemMessage = "", tools = [], model = "gpt-4o-mini", apiKey = process.env.OPENAI_API_KEY, maxToolCalls = 25, maxHistory = 100 } = options;
    if (!message) {
        throw new Error("Message is required");
    }
    const history = new History();
    history.setSystemMessage(systemMessage);
    history.addMessage({ role: "user", content: message });
    // if the model is an openai model, use the openai call function
    if (openAiModels.includes(model)) {
        return openAiToolLoop({
            history: history,
            tools: tools,
            model: model,
            apiKey: apiKey,
            maxToolCalls: maxToolCalls,
            maxHistory: maxHistory
        });
    } else {
        throw new Error(`Model ${model} is not supported`);
    }
}

/**
 * Function for getting a response from the agent.  If tools are needed, it will call them and then loop again.
 * 
 * @param {Object} options - The options for the openai tool loop.
 * @param {History} options.history - The conversation history.
 * @param {Tools} options.tools - The tools that the agent can use.
 * @param {string} options.model - The model to use for the agent.
 * @param {string} options.apiKey - The API key for authentication.
 * @param {number} options.maxToolCalls - A limit on the number of tool calls the agent can make.
 * @param {number} options.maxHistory - The number of messages that can be stored in the conversation history.
 * @returns {Promise<string>} - The response message from the agent.
 */
async function openAiToolLoop(options) {
    const { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
    let callingTools = true;
    let attempts = 0;
    while (callingTools && attempts < maxToolCalls) {
        attempts++;
        const { message, tool_calls } = await openAiCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
        if (!tool_calls) {
            // if there are no tool calls, we are done
            callingTools = false;
            history.addMessage({ role: "assistant", content: message });
            return message;
        } else {
            // if there are tool calls, we need to call the tools, then loop again and allow the model to react to the results
            history.addMessage({ role: "assistant", content: message, tool_calls: tool_calls });
            callingTools = true;
            tool_calls.forEach(tool_call => {
                try {
                    const args = JSON.parse(tool_call.function.arguments);
                    const response = tools.call(tool_call.function.name, args);
                    history.addMessage({ 
                        role: 'tool', 
                        content: response.toString(),
                        tool_call_id: tool_call.id,
                        name: tool_call.function.name
                    });
                } catch (error) {
                    history.addMessage({ 
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
    const { message, tool_calls } = await openAiCall(history.getHistory(maxHistory), [], model, apiKey); // No tools passed in
    history.addMessage({ role: "assistant", content: message });
    return {message, history: history.getHistory(maxHistory)};
}

/**
 * A chatbot class that retains conversation history and can call tools
 * 
 * @param {Object} options - The options for the chatbot.
 * @param {string} [options.systemMessage=""] - The system message to set the context for the chatbot.
 * @param {string} [options.model="gpt-4o-mini"] - The AI model to use for the chatbot.
 * @param {Tools} [options.tools=[]] - Any functions that the chatbot can use.
 * @param {string} [options.apiKey] - The API key for authentication. If not provided, it will use the OPENAI_API_KEY environment variable.
 * @param {History} [options.history=new History()] - The conversation history if you want to start the conversation with existing messages.
 * @param {number} [options.maxToolCalls=5] - A limit on the number of tool calls the chatbot can make per message.
 * @param {number} [options.maxHistory=100] - The number of messages that can be stored in the conversation history.
 */
class Chatbot {
    constructor(options = {}) {
        const defaults = {
            systemMessage: "",
            model: "gpt-4o-mini",
            tools: new Tools(),
            apiKey: null,
            history: new History(),
            maxToolCalls: 5,
            maxHistory: 100,
        };
        const settings = { ...defaults, ...options };
        
        this.history = settings.history;
        this.maxHistory = settings.maxHistory;
        this.model = settings.model;
        this.systemMessage = settings.systemMessage;
        this.apiKey = settings.apiKey;
        this.tools = settings.tools;
        this.maxToolCalls = settings.maxToolCalls;
    }

    /**
     * Set the tools that the chatbot can use.
     * 
     * @param {Tools} tools - The tools that the chatbot can use.  Note that this will override any tools that were previously set.
     */
    setTools(tools) {
        this.tools = tools;
    }

    /**
     * Set the conversation history.
     * 
     * @param {History} history - The new conversation history. Useful for manually editing the history (say deleting a message)
     */
    setHistory(history) {
        if (this.systemMessage !== "") {
            history.setSystemMessage(this.systemMessage);
        }
        this.history = history;
    }

    /**
     * Get the conversation history.
     * 
     * @returns {History} - The conversation history.
     */
    getHistory() {
        return this.history;
    }

    /**
     * Set the system message.
     * 
     * @param {string} message - The new system message.
     */
    setSystemMessage(message) {
        this.systemMessage = message;
        this.history.setSystemMessage(message);
    }

    /**
     * Send a user message and get a response.
     * 
     * @param {string} userMessage - The user message to send to the chatbot.
     * @returns {Promise<string>} - The response message from the chatbot.
     */
    async sendMessage(userMessage) {
        this.history.addMessage({ role: "user", content: userMessage });
        // if the model is an openai model, use the openai call function
        if (openAiModels.includes(this.model)) {
            return this.openAiToolLoop();
        } else {
            throw new Error(`Model ${this.model} is not supported`);
        }
    }

    /**
     * Internal function to call the openai tool loop.
     * 
     * @returns {Promise<string>} - The response message from the chatbot.
     */
    async openAiToolLoop() {
        return openAiToolLoop({
            history: this.history,
            tools: this.tools,
            model: this.model,
            apiKey: this.apiKey,
            maxToolCalls: this.maxToolCalls,
            maxHistory: this.maxHistory
        });
    }
}

export { Chatbot, getLLMResponse, doAgentTask };