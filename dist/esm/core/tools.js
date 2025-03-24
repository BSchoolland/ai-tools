import dotenv from "dotenv";
dotenv.config();
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
    if (typeof tool !== "function" && tool.acceptsCustomIdentifier) {
      func._acceptsCustomIdentifier = true;
    }
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
  async call(toolName, toolArgs, customIdentifier = null) {
    const func = this.functions.find((f) => f.name === toolName);
    if (func) {
      try {
        const paramNames = this._getParameterNames(func);
        const extractedArgs = paramNames.map((name) => {
          return name in toolArgs ? toolArgs[name] : void 0;
        });
        let result;
        if (customIdentifier !== null && func._acceptsCustomIdentifier) {
          if (paramNames.length === 1 && paramNames[0] === "customIdentifier") {
            result = func.call(null, customIdentifier);
          } else {
            const hasRealArgs = paramNames.some((name) => name in toolArgs);
            if (hasRealArgs) {
              result = func.call(null, ...extractedArgs, customIdentifier);
            } else {
              const firstParamName = paramNames[0];
              const firstArg = firstParamName && toolArgs[firstParamName] ? toolArgs[firstParamName] : null;
              result = func.call(null, firstArg, customIdentifier);
            }
          }
        } else {
          result = func.call(null, ...extractedArgs);
        }
        if (result instanceof Promise) {
          return await result;
        }
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
  /**
   * Mark a function as accepting a customIdentifier parameter
   * @param {Function} func - The function to mark
   * @returns {Function} - The function with the _acceptsCustomIdentifier property set
   */
  markAsAcceptingCustomIdentifier(func) {
    func._acceptsCustomIdentifier = true;
    return func;
  }
}
const isMainModule = typeof require !== "undefined" ? require.main === module : import.meta.url && import.meta.url === `file://${process.argv[1]}`;
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
export {
  Tools
};
