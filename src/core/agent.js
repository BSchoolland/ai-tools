import { Tools } from "./tools.js";
import { History } from "../utils/history.js";
import { validateOptions } from "./validateOptions.js";
import { openAiModels, anthropicModels, deepSeekModels } from "./config.js";
import { openAiToolLoop } from "./toolLoop.js";
import { anthropicToolLoop } from "./anthropicToolLoop.js";
import { deepSeekToolLoop } from "./deepSeekToolLoop.js";
/**
 * Assigns a task to an AI agent.
 * 
 * @param {Object} options - The options for the agent task.
 * @param {string} options.message - The user message to the agent.
 * @param {string} [options.systemMessage=""] - The system message to set the context for the agent.
 * @param {string} [options.model="gpt-4o-mini"] - The model to use for the agent.
 * @param {Tools} [options.tools=[]] - The tools that the agent can use.
 * @param {string} [options.apiKey] - The API key for authentication. If not provided, it will use the appropriate API key based on the model.
 * @param {number} [options.maxToolCalls=25] - A limit on the number of tool calls the agent can make.
 * @param {number} [options.maxHistory=100] - The number of messages that can be stored in the conversation history.
 * @param {Object} [options.customIdentifier=null] - Custom identifier to pass to tools, can include permissions, timezone, etc.
 * @returns {string} - The response message from the agent.
 * @throws {Error} - Throws an error if the API call fails
 */
async function doAgentTask(options) {
    const defaults = {
        message: "",
        systemMessage: "",
        model: "gpt-4o-mini",
        tools: new Tools(),
        apiKey: null,
        maxToolCalls: 25,
        maxHistory: 100,
        customIdentifier: null
    };
    const required = ["message"];
    const settings = { ...defaults, ...options };
    validateOptions(settings, new Set(Object.keys(defaults)), required);
    
    const { message, systemMessage, model, tools, apiKey, maxToolCalls, maxHistory, customIdentifier } = settings;
    
    // Determine which API to use based on the model
    let apiKeyToUse = apiKey;
    if (apiKeyToUse === null) {
        if (openAiModels.includes(model)) {
            apiKeyToUse = process.env.OPENAI_API_KEY;
        } else if (anthropicModels.includes(model)) {
            apiKeyToUse = process.env.ANTHROPIC_API_KEY;
        } else if (deepSeekModels.includes(model)) {
            apiKeyToUse = process.env.DEEPSEEK_API_KEY;
        } else {
            throw new Error(`Model ${model} is not supported`);
        }
    }
    
    // Create a new history and add the system message if provided
    const history = new History();
    if (systemMessage) {
        history.setSystemMessage(systemMessage);
    }
    
    // Add the user message
    history.addMessage({ role: "user", content: message });
    
    // Call the appropriate tool loop based on the model
    let response;
    if (openAiModels.includes(model)) {
        response = await openAiToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
    } else if (anthropicModels.includes(model)) {
        response = await anthropicToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
    } else if (deepSeekModels.includes(model)) {
        // Works with the openAiToolLoop because the deepSeekCall is exactly the same as the openAiCall
        response = await deepSeekToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
    } else {
        throw new Error(`Model ${model} is not supported`);
    }
    
    return response.message;
}

export { doAgentTask };