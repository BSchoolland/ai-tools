import { Tools } from "./tools.js";
import { History } from "../utils/history.js";
import { validateOptions } from "./validateOptions.js";
import { openAiModels, anthropicModels, deepSeekModels } from "./config.js";
import { openAiToolLoop } from "./toolLoop.js";
import { anthropicToolLoop } from "./anthropicToolLoop.js";
import { deepSeekToolLoop } from "./deepSeekToolLoop.js";
async function doAgentTask(options) {
  const defaults = {
    message: "",
    systemMessage: "",
    model: "gpt-4o-mini",
    tools: new Tools(),
    apiKey: null,
    maxToolCalls: 25,
    maxHistory: 100,
    customIdentifier: null
  };
  const required = ["message"];
  const settings = { ...defaults, ...options };
  validateOptions(settings, new Set(Object.keys(defaults)), required);
  const { message, systemMessage, model, tools, apiKey, maxToolCalls, maxHistory, customIdentifier } = settings;
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
    response = await openAiToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
  } else if (anthropicModels.includes(model)) {
    response = await anthropicToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
  } else if (deepSeekModels.includes(model)) {
    response = await deepSeekToolLoop({ history, tools, model, apiKey: apiKeyToUse, maxToolCalls, maxHistory, customIdentifier });
  } else {
    throw new Error(`Model ${model} is not supported`);
  }
  return response.message;
}
export {
  doAgentTask
};
