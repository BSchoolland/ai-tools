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
var toolLoop_exports = {};
__export(toolLoop_exports, {
  openAiToolLoop: () => openAiToolLoop
});
module.exports = __toCommonJS(toolLoop_exports);
var import_history = require("../utils/history.js");
var import_tools = require("./tools.js");
var import_apiCalls = require("./apiCalls.js");
var import_config = require("./config.js");
async function openAiToolLoop(options) {
  const { history, tools, model, apiKey, maxToolCalls, maxHistory } = options;
  let callingTools = true;
  let attempts = 0;
  while (callingTools && attempts < maxToolCalls) {
    attempts++;
    let message2, tool_calls2;
    if (import_config.openAiModels.includes(model)) {
      ({ message: message2, tool_calls: tool_calls2 } = await (0, import_apiCalls.openAiCall)(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
    } else if (import_config.deepSeekModels.includes(model)) {
      ({ message: message2, tool_calls: tool_calls2 } = await (0, import_apiCalls.deepSeekCall)(history.getHistory(maxHistory), tools.getTools(), model, apiKey));
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
      tool_calls2.forEach((tool_call) => {
        try {
          const args = JSON.parse(tool_call.function.arguments);
          const response = tools.call(tool_call.function.name, args);
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
      });
    }
  }
  let message, tool_calls;
  if (import_config.openAiModels.includes(model)) {
    ({ message, tool_calls } = await (0, import_apiCalls.openAiCall)(history.getHistory(maxHistory), [], model, apiKey));
  } else if (import_config.deepSeekModels.includes(model)) {
    ({ message, tool_calls } = await (0, import_apiCalls.deepSeekCall)(history.getHistory(maxHistory), [], model, apiKey));
  } else {
    throw new Error(`Model ${model} is not supported`);
  }
  history.addMessage({ role: "assistant", content: message });
  return { message, history: history.getHistory(maxHistory), timedOut: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  openAiToolLoop
});
