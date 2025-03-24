import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { openAiCall, deepSeekCall } from "./apiCalls.js";
import { openAiModels, deepSeekModels } from "./config.js";
async function openAiToolLoop(options) {
  const { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
  let callingTools = true;
  let attempts = 0;
  while (callingTools && attempts < maxToolCalls) {
    attempts++;
    let message2, tool_calls2;
    if (openAiModels.includes(model)) {
      ({ message: message2, tool_calls: tool_calls2 } = await openAiCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
    } else if (deepSeekModels.includes(model)) {
      ({ message: message2, tool_calls: tool_calls2 } = await deepSeekCall(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
    } else {
      throw new Error(`Model ${model} is not supported`);
    }
    if (!tool_calls2) {
      callingTools = false;
      history.addMessage({ role: "assistant", content: message2 });
      return { message: message2, history: history.getHistory(maxHistory), timedOut: false };
    } else {
      history.addMessage({ role: "assistant", content: message2, tool_calls: tool_calls2 });
      callingTools = true;
      await Promise.all(tool_calls2.map(async (tool_call) => {
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
      }));
    }
  }
  let message, tool_calls;
  if (openAiModels.includes(model)) {
    ({ message, tool_calls } = await openAiCall(history.getHistory(maxHistory), [], model, apiKey));
  } else if (deepSeekModels.includes(model)) {
    ({ message, tool_calls } = await deepSeekCall(history.getHistory(maxHistory), [], model, apiKey));
  } else {
    throw new Error(`Model ${model} is not supported`);
  }
  history.addMessage({ role: "assistant", content: message });
  return { message, history: history.getHistory(maxHistory), timedOut: true };
}
export {
  openAiToolLoop
};
