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
var chatbot_exports = {};
__export(chatbot_exports, {
  ChatBot: () => ChatBot,
  doAgentTask: () => import_agent.doAgentTask,
  getLLMResponse: () => getLLMResponse
});
module.exports = __toCommonJS(chatbot_exports);
var import_history = require("../utils/history.cjs");
var import_tools = require("./tools.cjs");
var import_validateOptions = require("./validateOptions.cjs");
var import_config = require("./config.cjs");
var import_apiCalls = require("./apiCalls.cjs");
var import_toolLoop = require("./toolLoop.cjs");
var import_deepSeekToolLoop = require("./deepSeekToolLoop.cjs");
var import_anthropicToolLoop = require("./anthropicToolLoop.cjs");
var import_agent = require("./agent.cjs");
async function getLLMResponse(options) {
  const defaults = {
    message: "",
    systemMessage: "",
    model: "gpt-4o-mini",
    apiKey: null
  };
  const required = ["message"];
  const settings = { ...defaults, ...options };
  (0, import_validateOptions.validateOptions)(settings, new Set(Object.keys(defaults)), required);
  const { message, systemMessage, model, apiKey } = settings;
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
    response = await (0, import_apiCalls.openAiCall)(history.getHistory(), [], model, apiKeyToUse);
  } else if (import_config.anthropicModels.includes(model)) {
    response = await (0, import_apiCalls.anthropicCall)(history.getHistory(), [], model, apiKeyToUse);
  } else if (import_config.deepSeekModels.includes(model)) {
    response = await (0, import_apiCalls.deepSeekCall)(history.getHistory(), [], model, apiKeyToUse);
  } else {
    throw new Error(`Model ${model} is not supported`);
  }
  return response.message;
}
class ChatBot {
  constructor(options = {}) {
    const defaults = {
      systemMessage: "",
      model: "gpt-4o-mini",
      tools: new import_tools.Tools(),
      apiKey: null,
      history: new import_history.History(),
      maxToolCalls: 5,
      maxHistory: 100
    };
    const settings = { ...defaults, ...options };
    (0, import_validateOptions.validateOptions)(settings, new Set(Object.keys(defaults)));
    this.history = settings.history;
    this.maxHistory = settings.maxHistory;
    this.model = settings.model;
    this.systemMessage = settings.systemMessage;
    this.history.setSystemMessage(this.systemMessage);
    this.apiKey = settings.apiKey;
    this.tools = settings.tools;
    this.maxToolCalls = settings.maxToolCalls;
  }
  /**
   * Set the tools that the ChatBot can use.
   * 
   * @param {Tools} tools - The tools that the ChatBot can use.  Note that this will override any tools that were previously set.
   */
  setTools(tools) {
    this.tools = tools;
  }
  /**
   * Set the conversation history.
   * 
   * @param {History} history - The new conversation history. Useful for manually editing the history (say deleting a message)
   */
  setHistory(history) {
    if (this.systemMessage !== "") {
      history.setSystemMessage(this.systemMessage);
    }
    this.history = history;
  }
  /**
   * Get the conversation history.
   * 
   * @returns {History} - The conversation history.
   */
  getHistory() {
    return this.history;
  }
  /**
   * Set the system message.
   * 
   * @param {string} message - The new system message.
   */
  setSystemMessage(message) {
    this.systemMessage = message;
    this.history.setSystemMessage(message);
  }
  /**
   * Send a user message and get a response.
   * 
   * @param {string} userMessage - The user message to send to the ChatBot.
   * @returns {Promise<string>} - The response message from the ChatBot.
   */
  async sendMessage(userMessage) {
    this.history.addMessage({ role: "user", content: userMessage });
    if (import_config.openAiModels.includes(this.model)) {
      const response = await this.openAiToolLoop();
      return response.message;
    } else if (import_config.anthropicModels.includes(this.model)) {
      const response = await this.anthropicToolLoop();
      return response.message;
    } else if (import_config.deepSeekModels.includes(this.model)) {
      const response = await this.deepSeekToolLoop();
      return response.message;
    } else {
      throw new Error(`Model ${this.model} is not supported`);
    }
  }
  /**
   * Internal function to call the OpenAI tool loop.
   * 
   * @returns {Promise<Object>} - The response message from the ChatBot.
   */
  async openAiToolLoop() {
    return (0, import_toolLoop.openAiToolLoop)({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage
    });
  }
  /**
   * Internal function to call the Anthropic tool loop.
   * 
   * @returns {Promise<Object>} - The response message from the ChatBot.
   */
  async anthropicToolLoop() {
    return (0, import_anthropicToolLoop.anthropicToolLoop)({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage
    });
  }
  /**
   * Internal function to call the DeepSeek tool loop.
   * 
   * @returns {Promise<Object>} - The response message from the ChatBot.
   */
  async deepSeekToolLoop() {
    return (0, import_deepSeekToolLoop.deepSeekToolLoop)({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatBot,
  doAgentTask,
  getLLMResponse
});
