// class to handle tool calling
// import .env
import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns the current date in YYYY-MM-DD format
 * @param {boolean} includeTime - Whether to return the current time in HH:MM:SS format as well as the date
 * @returns {string} - The current date in YYYY-MM-DD format
 */
function getDate(includeTime = false) {
    const date = new Date();
    return includeTime ? date.toISOString() : date.toISOString().split('T')[0];
}

const testFunctions = [getDate];

class Tools {
    constructor(functions = [], addTestTools = false) {
        if (addTestTools) {
            functions = [...functions, ...testFunctions];
        }
        
        this.functions = functions.map(t => typeof t === 'function' ? t : t.func);
        
        // Auto-generate toolsJson
        this.toolsJson = functions.map(tool => {
            if (typeof tool === 'function') {
                return this.generateToolJson(tool);
            } else {
                const { func, description, parameters } = tool;
                return this.generateToolJsonWithMetadata(func, description, parameters);
            }
        });
    }

    register(tool) {
        const func = typeof tool === 'function' ? tool : tool.func;
        
        this.functions.push(func);
        
        if (typeof tool === 'function') {
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
                    required: Object.entries(parameters || {})
                        .filter(([_, param]) => !param.optional)
                        .map(([name, _]) => name)
                }
            }
        };
        
        return result;
    }

    generateToolJson(func) {
        
        // Extract parameter names using regex
        const paramMatch = func.toString().match(/\((.*?)\)/);
        const params = paramMatch ? paramMatch[1].split(',').map(p => p.trim()) : [];
        
        // Create parameters object
        const parameters = {
            type: "object",
            properties: {},
            required: []
        };
        
        // Parse each parameter
        params.forEach(param => {
            if (param) {
                // Handle default values
                const [paramName, defaultValue] = param.split('=').map(p => p.trim());
                
                parameters.properties[paramName] = {
                    type: this._inferType(defaultValue, paramName),
                    description: this._autoDescribeParam(paramName)
                };
                
                // If no default value, mark as required
                if (!defaultValue) {
                    parameters.required.push(paramName);
                }
            }
        });

        // Create the tool JSON
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
        return funcName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    _autoDescribeParam(paramName) {
        return paramName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    _inferType(defaultValue, paramName) {
        if (defaultValue === "false" || defaultValue === "true") return "boolean";
        if (!isNaN(defaultValue)) return "number";
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
        
        // call the tool
        const func = this.functions.find(f => f.name === toolName);
        if (func) {
            try {
                // Extract parameters in the correct order from the args object
                const paramNames = this._getParameterNames(func);
                
                const args = paramNames.map(name => toolArgs[name]);
                
                const result = func(...args);
                return result;
            } catch (error) {
                console.error('Tool call failed:', error);
                return 'Tool call failed: ' + error;
            }
        }
        return 'Tool not found: ' + toolName;
    }

    _getParameterNames(func) {
        const paramMatch = func.toString().match(/\((.*?)\)/);
        return paramMatch ? 
            paramMatch[1]
                .split(',')
                .map(p => p.trim())
                .map(p => p.split('=')[0].trim())
                .filter(p => p) : 
            [];
    }
}

export { Tools };

// Test code
if (import.meta.url === `file://${process.argv[1]}`) {
    function calculateTotal(price, taxRate = 0.1) {
        return price * (1 + taxRate);
    }

    // Example with just a function (auto-generated everything)
    const simpleExample = calculateTotal;

    // Example with metadata
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

    // Test both approaches
    (async () => {
        const tools = await Tools.create([simpleExample, metadataExample], true);




        // testing calling the tools
    })().catch(console.error);
}