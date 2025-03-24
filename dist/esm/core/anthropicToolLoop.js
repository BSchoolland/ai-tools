import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { anthropicCall } from "./apiCalls.js";
async function anthropicToolLoop(options) {
  const { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
  let callingTools = true;
  let attempts = 0;
  while (callingTools && attempts < maxToolCalls) {
    attempts++;
    const { message: message2, tool_calls: tool_calls2 } = await anthropicCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
    if (!tool_calls2) {
      callingTools = false;
      history.addMessage({ role: "assistant", content: message2 });
      return { message: message2, history: history.getHistory(maxHistory), timedOut: false };
    } else {
      history.addMessage({ role: "assistant", content: message2, tool_calls: tool_calls2 });
      callingTools = true;
      for (const tool_call of tool_calls2) {
        try {
          const args = JSON.parse(tool_call.function.arguments);
          const response = await tools.call(tool_call.function.name, args);
          history.addMessage({
            role: "tool",
            content: response.toString(),
            tool_call_id: tool_call.id,
            name: tool_call.function.name
          });
        } catch (error) {
          history.addMessage({
            role: "tool",
            content: `Error: ${error.message}`,
            tool_call_id: tool_call.id,
            name: tool_call.function.name
          });
        }
      }
    }
  }
  const { message, tool_calls } = await anthropicCall(history.getHistory(maxHistory), [], model, apiKey);
  history.addMessage({ role: "assistant", content: message });
  return { message, history: history.getHistory(maxHistory), timedOut: true };
}
export {
  anthropicToolLoop
};
