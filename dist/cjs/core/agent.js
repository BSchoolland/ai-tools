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
var agent_exports = {};
__export(agent_exports, {
  doAgentTask: () => doAgentTask
});
module.exports = __toCommonJS(agent_exports);
var import_tools = require("./tools.js");
var import_history = require("../utils/history.js");
var import_validateOptions = require("./validateOptions.js");
var import_config = require("./config.js");
var import_toolLoop = require("./toolLoop.js");
var import_anthropicToolLoop = require("./anthropicToolLoop.js");
var import_deepSeekToolLoop = require("./deepSeekToolLoop.js");
async function doAgentTask(options) {
  const defaults = {
    message: "",
    systemMessage: "",
    model: "gpt-4o-mini",
    tools: new import_tools.Tools(),
    apiKey: null,
    maxToolCalls: 25,
    maxHistory: 100
  };
  const required = ["message"];
  const settings = { ...defaults, ...options };
  (0, import_validateOptions.validateOptions)(settings, new Set(Object.keys(defaults)), required);
  const { message, systemMessage, model, tools, apiKey, maxToolCalls, maxHistory } = settings;
  let apiKeyToUse = apiKey;
  if (apiKeyToUse === null) {
    if (import_config.openAiModels.includes(model)) {
      apiKeyToUse = process.env.OPENAI_API_KEY;
    } else if (import_config.anthropicModels.includes(model)) {
      apiKeyToUse = process.env.ANTHROPIC_API_KEY;
    } else if (import_config.deepSeekModels.includes(model)) {
      apiKeyToUse = process.env.DEEPSEEK_API_KEY;
    } else {
      throw new Error(`Model ${model} is not supported`);
    }
  }
  const history = new import_history.History();
  if (systemMessage) {
    history.setSystemMessage(systemMessage);
  }
  history.addMessage({ role: "user", content: message });
  let response;
  if (import_config.openAiModels.includes(model)) {
    response = await (0, import_toolLoop.openAiToolLoop)({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory });
  } else if (import_config.anthropicModels.includes(model)) {
    response = await (0, import_anthropicToolLoop.anthropicToolLoop)({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory });
  } else if (import_config.deepSeekModels.includes(model)) {
    response = await (0, import_deepSeekToolLoop.deepSeekToolLoop)({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory });
  } else {
    throw new Error(`Model ${model} is not supported`);
  }
  return response.message;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  doAgentTask
});
