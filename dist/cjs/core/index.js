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
var core_exports = {};
__export(core_exports, {
  ChatBot: () => import_ChatBot.ChatBot,
  Tools: () => import_tools.Tools,
  doAgentTask: () => import_ChatBot.doAgentTask,
  getLLMResponse: () => import_ChatBot.getLLMResponse
});
module.exports = __toCommonJS(core_exports);
var import_ChatBot = require("./ChatBot.js");
var import_tools = require("./tools.js");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatBot,
  Tools,
  doAgentTask,
  getLLMResponse
});
