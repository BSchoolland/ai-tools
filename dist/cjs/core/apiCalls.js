var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var apiCalls_exports = {};
__export(apiCalls_exports, {
  anthropicCall: () => anthropicCall,
  deepSeekCall: () => deepSeekCall,
  openAiCall: () => openAiCall
});
module.exports = __toCommonJS(apiCalls_exports);
var import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
const import_meta = {};
const __dirname = typeof __dirname !== "undefined" ? __dirname : import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
import_dotenv.default.config({ path: import_path.default.resolve(__dirname, "../../.env") });
async function openAiCall(history, tools = [], model = "gpt-4o-mini", apiKey = null) {
  if (apiKey === null) {
    apiKey = process.env.OPENAI_API_KEY;
  }
  const body = {
    model,
    messages: history
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API Error: ${error.error.message}`);
  }
  const responseData = await response.json();
  if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
    throw new Error("Invalid response format from OpenAI API");
  }
  const message = responseData.choices[0].message.content || "";
  const tool_calls = responseData.choices[0].message.tool_calls || null;
  return { message, tool_calls };
}
async function anthropicCall(history, tools = [], model = "claude-3-haiku-latest", apiKey = null) {
  if (apiKey === null) {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (!apiKey) {
    throw new Error("Anthropic API key is not set. Please check your .env file.");
  }
  try {
    const anthropic = new import_sdk.default({
      apiKey
    });
    let systemMessage = "";
    const nonSystemMessages = [];
    for (const msg of history) {
      if (msg.role === "system") {
        systemMessage = msg.content;
      } else {
        nonSystemMessages.push(msg);
      }
    }
    const anthropicMessages = convertHistoryToAnthropic(nonSystemMessages);
    const requestParams = {
      model,
      max_tokens: 1024,
      messages: anthropicMessages
    };
    if (systemMessage) {
      requestParams.system = systemMessage;
    }
    if (tools && tools.length > 0) {
      requestParams.tools = convertToolsToAnthropic(tools);
    }
    const response = await anthropic.messages.create(requestParams);
    if (!response || !response.content || !Array.isArray(response.content) || response.content.length === 0) {
      console.warn("Anthropic API returned an empty or invalid response");
      return {
        message: "I apologize, but I couldn't generate a response. Please try again.",
        tool_calls: null
      };
    }
    if (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((block) => block.type === "tool_use");
      if (toolUseBlock) {
        const tool_calls = [{
          id: toolUseBlock.id,
          type: "function",
          function: {
            name: toolUseBlock.name,
            arguments: JSON.stringify(toolUseBlock.input)
          }
        }];
        return {
          message: "",
          // Empty message when tool is called
          tool_calls
        };
      }
    }
    let message = "";
    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock) {
      message = textBlock.text;
    }
    return { message, tool_calls: null };
  } catch (error) {
    console.error("Error calling Anthropic API:", error.message);
    throw error;
  }
}
function convertHistoryToAnthropic(history) {
  return history.map((msg) => {
    if (msg.role === "tool") {
      return {
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: msg.tool_call_id,
          content: msg.content
        }]
      };
    }
    if (msg.role === "assistant" && msg.tool_calls) {
      const content = [];
      if (msg.content) {
        content.push({
          type: "text",
          text: msg.content
        });
      }
      msg.tool_calls.forEach((tool_call) => {
        content.push({
          type: "tool_use",
          id: tool_call.id,
          name: tool_call.function.name,
          input: JSON.parse(tool_call.function.arguments)
        });
      });
      return {
        role: "assistant",
        content
      };
    }
    if (msg.content && typeof msg.content === "string") {
      return {
        role: msg.role,
        content: msg.content
      };
    }
    return msg;
  });
}
function convertToolsToAnthropic(tools) {
  return tools.map((tool) => {
    if (tool.type === "function") {
      return {
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      };
    }
    return tool;
  });
}
async function deepSeekCall(history, tools = [], model = "deepseek-chat", apiKey = null, url = null) {
  if (apiKey === null) {
    apiKey = process.env.DEEPSEEK_API_KEY;
  }
  if (url === null) {
    url = "https://api.deepseek.com/chat/completions";
  }
  const body = {
    model,
    messages: history
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek API Error: ${error.error.message}`);
  }
  const responseData = await response.json();
  if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
    throw new Error("Invalid response format from DeepSeek API");
  }
  const message = responseData.choices[0].message.content || "";
  const tool_calls = responseData.choices[0].message.tool_calls || null;
  return { message, tool_calls };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  anthropicCall,
  deepSeekCall,
  openAiCall
});
