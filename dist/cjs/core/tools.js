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
var tools_exports = {};
__export(tools_exports, {
  Tools: () => Tools
});
module.exports = __toCommonJS(tools_exports);
var import_dotenv = __toESM(require("dotenv"), 1);
const import_meta = {};
import_dotenv.default.config();
function getDate(includeTime = false) {
  const date = /* @__PURE__ */ new Date();
  return includeTime ? date.toISOString() : date.toISOString().split("T")[0];
}
const testFunctions = [getDate];
class Tools {
  constructor(functions = [], addTestTools = false) {
    if (addTestTools) {
      functions = [...functions, ...testFunctions];
    }
    this.functions = functions.map((t) => typeof t === "function" ? t : t.func);
    this.toolsJson = functions.map((tool) => {
      if (typeof tool === "function") {
        return this.generateToolJson(tool);
      } else {
        const { func, description, parameters } = tool;
        return this.generateToolJsonWithMetadata(func, description, parameters);
      }
    });
  }
  register(tool) {
    const func = typeof tool === "function" ? tool : tool.func;
    this.functions.push(func);
    if (typeof tool === "function") {
      this.toolsJson.push(this.generateToolJson(tool));
    } else {
      const { description, parameters } = tool;
      this.toolsJson.push(this.generateToolJsonWithMetadata(func, description, parameters));
    }
  }
  generateToolJsonWithMetadata(func, description, parameters) {
    const result = {
      type: "function",
      function: {
        name: func.name,
        description: description || this._autoDescribeFunction(func.name),
        parameters: {
          type: "object",
          properties: parameters || {},
          required: Object.entries(parameters || {}).filter(([_, param]) => !param.optional).map(([name, _]) => name)
        }
      }
    };
    return result;
  }
  generateToolJson(func) {
    const paramMatch = func.toString().match(/\((.*?)\)/);
    const params = paramMatch ? paramMatch[1].split(",").map((p) => p.trim()) : [];
    const parameters = {
      type: "object",
      properties: {},
      required: []
    };
    params.forEach((param) => {
      if (param) {
        const [paramName, defaultValue] = param.split("=").map((p) => p.trim());
        parameters.properties[paramName] = {
          type: this._inferType(defaultValue, paramName),
          description: this._autoDescribeParam(paramName)
        };
        if (!defaultValue) {
          parameters.required.push(paramName);
        }
      }
    });
    const result = {
      type: "function",
      function: {
        name: func.name,
        description: this._autoDescribeFunction(func.name),
        parameters
      }
    };
    return result;
  }
  _autoDescribeFunction(funcName) {
    return funcName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
  }
  _autoDescribeParam(paramName) {
    return paramName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
  }
  _inferType(defaultValue, paramName) {
    if (defaultValue === "false" || defaultValue === "true")
      return "boolean";
    if (!isNaN(defaultValue))
      return "number";
    if (!defaultValue) {
      console.warn(`Warning: No type information provided for parameter "${paramName}". Defaulting to "string". Consider providing type metadata.`);
      return "string";
    }
    return "string";
  }
  getTools() {
    return this.toolsJson;
  }
  call(toolName, toolArgs) {
    const func = this.functions.find((f) => f.name === toolName);
    if (func) {
      try {
        const paramNames = this._getParameterNames(func);
        const args = paramNames.map((name) => toolArgs[name]);
        const result = func(...args);
        return result;
      } catch (error) {
        console.error("Tool call failed:", error);
        return "Tool call failed: " + error;
      }
    }
    return "Tool not found: " + toolName;
  }
  _getParameterNames(func) {
    const paramMatch = func.toString().match(/\((.*?)\)/);
    return paramMatch ? paramMatch[1].split(",").map((p) => p.trim()).map((p) => p.split("=")[0].trim()).filter((p) => p) : [];
  }
}
const isMainModule = typeof require !== "undefined" ? require.main === module : import_meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  let calculateTotal = function(price, taxRate = 0.1) {
    return price * (1 + taxRate);
  };
  const simpleExample = calculateTotal;
  const metadataExample = {
    func: calculateTotal,
    description: "Calculates the total price including tax",
    parameters: {
      price: {
        type: "number",
        description: "The base price of the item"
      },
      taxRate: {
        type: "number",
        description: "The tax rate as a decimal",
        optional: true
      }
    }
  };
  (async () => {
    const tools = await Tools.create([simpleExample, metadataExample], true);
  })().catch(console.error);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Tools
});
