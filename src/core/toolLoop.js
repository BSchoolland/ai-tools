import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { openAiCall, deepSeekCall } from "./apiCalls.js";
import { openAiModels, deepSeekModels } from "./config.js";

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
 * @param {string} options.customIdentifier - A custom identifier for the tool calls.
 * @returns {Promise<string>} - The response message from the agent.
 */
async function openAiToolLoop(options) {
    const { history, tools, model, apiKey, maxToolCalls, maxHistory, customIdentifier } = options;
    let callingTools = true;
    let attempts = 0;
    while (callingTools && attempts < maxToolCalls) {
        attempts++;
        let message, tool_calls;
        if (openAiModels.includes(model)) {
            ({ message, tool_calls } = await openAiCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
        } else if (deepSeekModels.includes(model)) {
            ({ message, tool_calls } = await deepSeekCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
        } else {
            throw new Error(`Model ${model} is not supported`);
        }
        if (!tool_calls) {
            // if there are no tool calls, we are done
            callingTools = false;
            history.addMessage({ role: "assistant", content: message });
            return {message, history: history.getHistory(maxHistory), timedOut: false};
        } else {
            // if there are tool calls, we need to call the tools, then loop again and allow the model to react to the results
            history.addMessage({ role: "assistant", content: message, tool_calls: tool_calls });
            callingTools = true;
            
            // Use Promise.all to handle async tool calls
            await Promise.all(tool_calls.map(async (tool_call) => {
                try {
                    const args = JSON.parse(tool_call.function.arguments);
                    // Pass the customIdentifier to the tool
                    const response = await tools.call(tool_call.function.name, args, customIdentifier);
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
            }));
        }
    }
    // temporarily disable tool calls and have the model respond to the last tool call
    let message, tool_calls;
    if (openAiModels.includes(model)) {
        ({ message, tool_calls } = await openAiCall(history.getHistory(maxHistory), [], model, apiKey));
    } else if (deepSeekModels.includes(model)) {
        ({ message, tool_calls } = await deepSeekCall(history.getHistory(maxHistory), [], model, apiKey));
    } else {
        throw new Error(`Model ${model} is not supported`);
    }
    history.addMessage({ role: "assistant", content: message });
    return {message, history: history.getHistory(maxHistory), timedOut: true};
}

export { openAiToolLoop };