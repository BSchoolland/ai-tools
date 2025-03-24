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
var validateOptions_exports = {};
__export(validateOptions_exports, {
  validateOptions: () => validateOptions
});
module.exports = __toCommonJS(validateOptions_exports);
function validateOptions(options, allowedParams, requiredParams = []) {
  for (let key of Object.keys(options)) {
    if (!allowedParams.has(key)) {
      throw new Error(`Unexpected parameter: '${key}'. Allowed parameters are: ${[...allowedParams].join(", ")}`);
    }
  }
  for (let key of requiredParams) {
    if (!options[key]) {
      throw new Error(`Required parameter: '${key}' is missing.`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validateOptions
});
