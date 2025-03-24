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
var config_exports = {};
__export(config_exports, {
  anthropicModels: () => anthropicModels,
  deepSeekModels: () => deepSeekModels,
  openAiModels: () => openAiModels,
  otherModels: () => otherModels
});
module.exports = __toCommonJS(config_exports);
const openAiModels = ["gpt-4o-mini", "gpt-4o"];
const anthropicModels = [
  "claude-3-5-haiku-latest",
  "claude-3-7-sonnet-latest",
  "claude-3-haiku-20240307"
];
const deepSeekModels = ["deepseek-chat", "deepseek-r1"];
const otherModels = ["llama", "gemini"];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  anthropicModels,
  deepSeekModels,
  openAiModels,
  otherModels
});
