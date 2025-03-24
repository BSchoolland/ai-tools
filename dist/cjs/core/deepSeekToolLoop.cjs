var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var deepSeekToolLoop_exports = {};
__export(deepSeekToolLoop_exports, {
  deepSeekToolLoop: () => deepSeekToolLoop
});
module.exports = __toCommonJS(deepSeekToolLoop_exports);
var import_history = require("../utils/history.cjs");
var import_tools = require("./tools.cjs");
var import_apiCalls = require("./apiCalls.cjs");
async function deepSeekToolLoop(options) {
  let { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
  let callingTools = true;
  let attempts = 0;
  maxToolCalls = 1;
  while (callingTools && attempts < maxToolCalls) {
    attempts++;
    const { message: message2, tool_calls } = await (0, import_apiCalls.deepSeekCall)(history.getHistory(maxHistory), tools.getTools(), model, apiKey);
    if (!tool_calls) {
      callingTools = false;
      history.addMessage({ role: "assistant", content: message2 });
      return { message: message2, history: history.getHistory(maxHistory), timedOut: false };
    } else {
      console.warn("DeepSeek function calling is very unstable, and is limited to 1 tool call at a time.  Use another model for better results.");
      history.addMessage({ role: "assistant", content: message2, tool_calls: [tool_calls[0]] });
      callingTools = true;
      [tool_calls[0]].forEach((tool_call) => {
        try {
          const args = JSON.parse(tool_call.function.arguments);
          const response = tools.call(tool_call.function.name, args);
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
      });
    }
  }
  const { message } = await (0, import_apiCalls.deepSeekCall)(history.getHistory(maxHistory), [], model, apiKey);
  history.addMessage({ role: "assistant", content: message });
  return { message, history: history.getHistory(maxHistory), timedOut: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deepSeekToolLoop
});
