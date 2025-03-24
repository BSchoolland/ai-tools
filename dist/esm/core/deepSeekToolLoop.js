import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { deepSeekCall } from "./apiCalls.js";
async function deepSeekToolLoop(options) {
  let { history, tools, model, apiKey, maxToolCalls, maxHistory, customIdentifier } = options;
  let callingTools = true;
  let attempts = 0;
  maxToolCalls = 1;
  while (callingTools && attempts < maxToolCalls) {
    attempts++;
    const { message: message2, tool_calls } = await deepSeekCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
    if (!tool_calls) {
      callingTools = false;
      history.addMessage({ role: "assistant", content: message2 });
      return { message: message2, history: history.getHistory(maxHistory), timedOut: false };
    } else {
      console.warn("DeepSeek function calling is very unstable, and is limited to 1 tool call at a time.  Use another model for better results.");
      history.addMessage({ role: "assistant", content: message2, tool_calls: [tool_calls[0]] });
      callingTools = true;
      await Promise.all([tool_calls[0]].map(async (tool_call) => {
        try {
          const args = JSON.parse(tool_call.function.arguments);
          const response = await tools.call(tool_call.function.name, args, customIdentifier);
          history.addMessage({
            role: "tool",
            content: response.toString(),
            tool_call_id: tool_call.id,
            name: tool_call.function.name
          });
          history.addMessage({
            role: "user",
            content: `<tool>Automated tool response for id: ${tool_call.id}: ${response.toString()}</tool>`
          });
        } catch (error) {
          history.addMessage({
            role: "tool",
            content: `Error: ${error.message}`,
            tool_call_id: tool_call.id,
            name: tool_call.function.name
          });
          history.addMessage({
            role: "user",
            content: `<tool>Automated tool response for id: ${tool_call.id}: ${error.message}</tool>`
          });
        }
      }));
    }
  }
  const { message } = await deepSeekCall(history.getHistory(maxHistory), [], model, apiKey);
  history.addMessage({ role: "assistant", content: message });
  return { message, history: history.getHistory(maxHistory), timedOut: true };
}
export {
  deepSeekToolLoop
};
