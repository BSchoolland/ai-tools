import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { anthropicCall } from "./apiCalls.js";

/**
 * Function for getting a response from the Anthropic agent. If tools are needed, it will call them and then loop again.
 * 
 * @param {Object} options - The options for the anthropic tool loop.
 * @param {History} options.history - The conversation history.
 * @param {Tools} options.tools - The tools that the agent can use.
 * @param {string} options.model - The model to use for the agent.
 * @param {string} options.apiKey - The API key for authentication.
 * @param {number} options.maxToolCalls - A limit on the number of tool calls the agent can make.
 * @param {number} options.maxHistory - The number of messages that can be stored in the conversation history.
 * @returns {Promise<Object>} - The response message from the agent and updated history.
 */
async function anthropicToolLoop(options) {
    const { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
    let callingTools = true;
    let attempts = 0;
    
    while (callingTools && attempts < maxToolCalls) {
        attempts++;
        const { message, tool_calls } = await anthropicCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
        
        if (!tool_calls) {
            // If there are no tool calls, we are done
            callingTools = false;
            history.addMessage({ role: "assistant", content: message });
            return { message, history: history.getHistory(maxHistory), timedOut: false };
        } else {
            // If there are tool calls, we need to call the tools, then loop again
            history.addMessage({ role: "assistant", content: message, tool_calls: tool_calls });
            callingTools = true;
            
            // Process each tool call
            for (const tool_call of tool_calls) {
                try {
                    const args = JSON.parse(tool_call.function.arguments);
                    const response = await tools.call(tool_call.function.name, args);
                    
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
            }
        }
    }
    
    // If we've reached the maximum number of tool calls, temporarily disable tools
    // and have the model respond to the last tool call
    const { message, tool_calls } = await anthropicCall(history.getHistory(maxHistory), [], model, apiKey); // No tools passed in
    history.addMessage({ role: "assistant", content: message });
    return { message, history: history.getHistory(maxHistory), timedOut: true };
}

export { anthropicToolLoop }; 