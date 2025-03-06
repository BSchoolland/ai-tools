import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { deepSeekCall } from "./apiCalls.js";

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
async function deepSeekToolLoop(options) {
    let { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
    let callingTools = true;
    let attempts = 0;
    // DeepSeek has issues with tool calls that cause it to loop infinitely always. 
    // This is a workaround to limit the number of tool calls to 1.
    maxToolCalls = 1;

    while (callingTools && attempts < maxToolCalls) {
        attempts++;
        
        const { message, tool_calls } = await deepSeekCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
        
        if (!tool_calls) {
            // if there are no tool calls, we are done
            callingTools = false;
            history.addMessage({ role: "assistant", content: message });
            return {message, history: history.getHistory(maxHistory), timedOut: false};
        } else {
            console.warn("DeepSeek function calling is very unstable, and is limited to 1 tool call at a time.  Use another model for better results.")
            // As a workaround for additional tool calls, we will only record the first tool call
            history.addMessage({ role: "assistant", content: message, tool_calls: [tool_calls[0]] });
            callingTools = true;
            [tool_calls[0]].forEach(tool_call => {
                try {
                    const args = JSON.parse(tool_call.function.arguments);
                    const response = tools.call(tool_call.function.name, args);
                    history.addMessage({ 
                        role: 'tool', 
                        content: response.toString(),
                        tool_call_id: tool_call.id,
                        name: tool_call.function.name
                    });
                    // TODO: When DeepSeek fixes the issue with function calls, we can remove the following code
                    // Workaround: add a user message to the history that says the tool call was successful
                    history.addMessage({ 
                        role: 'user', 
                        content: `<tool>Automated tool response for id: ${tool_call.id}: ${response.toString()}</tool>`
                    });
                } catch (error) {
                    history.addMessage({ 
                        role: 'tool', 
                        content: `Error: ${error.message}`,
                        tool_call_id: tool_call.id,
                        name: tool_call.function.name
                    });
                    // TODO: When DeepSeek fixes the issue with function calls, we can remove the following code
                    // Workaround: add a user message to the history that says the tool call was successful
                    history.addMessage({ 
                        role: 'user', 
                        content: `<tool>Automated tool response for id: ${tool_call.id}: ${error.message}</tool>`
                    });
                }
            });
        }
    }
    // temporarily disable tool calls and have the model respond to the last tool call
    const { message } = await deepSeekCall(history.getHistory(maxHistory), [], model, apiKey);
    
    history.addMessage({ role: "assistant", content: message });
    return {message, history: history.getHistory(maxHistory), timedOut: true};
}

export { deepSeekToolLoop };