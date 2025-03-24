import { History } from "../utils/history.js";
import { Tools } from "./tools.js";
import { validateOptions } from "./validateOptions.js";
import { openAiModels, anthropicModels, deepSeekModels } from "./config.js";
import { openAiCall, anthropicCall, deepSeekCall } from "./apiCalls.js";
import { openAiToolLoop } from "./toolLoop.js";
import { deepSeekToolLoop } from "./deepSeekToolLoop.js";
import { anthropicToolLoop } from "./anthropicToolLoop.js";
import { doAgentTask } from "./agent.js";
async function getLLMResponse(options) {
  const defaults = {
    message: "",
    systemMessage: "",
    model: "gpt-4o-mini",
    apiKey: null
  };
  const required = ["message"];
  const settings = { ...defaults, ...options };
  validateOptions(settings, new Set(Object.keys(defaults)), required);
  const { message, systemMessage, model, apiKey } = settings;
  let apiKeyToUse = apiKey;
  if (apiKeyToUse === null) {
    if (openAiModels.includes(model)) {
      apiKeyToUse = process.env.OPENAI_API_KEY;
    } else if (anthropicModels.includes(model)) {
      apiKeyToUse = process.env.ANTHROPIC_API_KEY;
    } else if (deepSeekModels.includes(model)) {
      apiKeyToUse = process.env.DEEPSEEK_API_KEY;
    } else {
      throw new Error(`Model ${model} is not supported`);
    }
  }
  const history = new History();
  if (systemMessage) {
    history.setSystemMessage(systemMessage);
  }
  history.addMessage({ role: "user", content: message });
  let response;
  if (openAiModels.includes(model)) {
    response = await openAiCall(history.getHistory(), [], model, apiKeyToUse);
  } else if (anthropicModels.includes(model)) {
    response = await anthropicCall(history.getHistory(), [], model, apiKeyToUse);
  } else if (deepSeekModels.includes(model)) {
    response = await deepSeekCall(history.getHistory(), [], model, apiKeyToUse);
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
      tools: new Tools(),
      apiKey: null,
      history: new History(),
      maxToolCalls: 5,
      maxHistory: 100,
      customIdentifier: null
    };
    const settings = { ...defaults, ...options };
    validateOptions(settings, new Set(Object.keys(defaults)));
    this.history = settings.history;
    this.maxHistory = settings.maxHistory;
    this.model = settings.model;
    this.systemMessage = settings.systemMessage;
    this.history.setSystemMessage(this.systemMessage);
    this.apiKey = settings.apiKey;
    this.tools = settings.tools;
    this.maxToolCalls = settings.maxToolCalls;
    this.customIdentifier = settings.customIdentifier;
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
   * Set the custom identifier that will be passed to tools.
   * 
   * @param {Object} customIdentifier - The custom identifier to pass to tools.
   */
  setCustomIdentifier(customIdentifier) {
    this.customIdentifier = customIdentifier;
  }
  /**
   * Send a user message and get a response.
   * 
   * @param {string} userMessage - The user message to send to the ChatBot.
   * @returns {Promise<string>} - The response message from the ChatBot.
   */
  async sendMessage(userMessage) {
    this.history.addMessage({ role: "user", content: userMessage });
    if (openAiModels.includes(this.model)) {
      const response = await this.openAiToolLoop();
      return response.message;
    } else if (anthropicModels.includes(this.model)) {
      const response = await this.anthropicToolLoop();
      return response.message;
    } else if (deepSeekModels.includes(this.model)) {
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
    return openAiToolLoop({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage,
      customIdentifier: this.customIdentifier
    });
  }
  /**
   * Internal function to call the Anthropic tool loop.
   * 
   * @returns {Promise<Object>} - The response message from the ChatBot.
   */
  async anthropicToolLoop() {
    return anthropicToolLoop({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage,
      customIdentifier: this.customIdentifier
    });
  }
  /**
   * Internal function to call the DeepSeek tool loop.
   * 
   * @returns {Promise<Object>} - The response message from the ChatBot.
   */
  async deepSeekToolLoop() {
    return deepSeekToolLoop({
      history: this.history,
      tools: this.tools,
      model: this.model,
      apiKey: this.apiKey,
      maxToolCalls: this.maxToolCalls,
      maxHistory: this.maxHistory,
      systemMessage: this.systemMessage,
      customIdentifier: this.customIdentifier
    });
  }
}
export {
  ChatBot,
  doAgentTask,
  getLLMResponse
};
