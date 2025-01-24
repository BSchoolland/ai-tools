// class to handle tool calling

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
    constructor(functions = [], toolsJson = [], addTestTools = false) {
        this.functions = functions;
        this.toolsJson = toolsJson;
        
        if (addTestTools) {
            this.functions = [...this.functions, ...testFunctions];
        }
    }

    static create(tools = [], addTestTools = false) {
        const instance = new Tools();
        
        // Auto-generate toolsJson
        const toolsJson = tools.map(tool => {
            if (typeof tool === 'function') {
                // If just a function is passed, auto-generate everything
                return instance.generateToolJson(tool);
            } else {
                // If metadata is provided, use it
                const { func, description, parameters } = tool;
                return instance.generateToolJsonWithMetadata(func, description, parameters);
            }
        });

        if (addTestTools) {
            // Auto-generate test tools JSON
            const generatedTestTools = testFunctions.map(func => instance.generateToolJson(func));
            return new Tools(
                [...tools.map(t => typeof t === 'function' ? t : t.func), ...testFunctions],
                [...toolsJson, ...generatedTestTools],
                false // already handled test functions
            );
        }

        return new Tools(
            tools.map(t => typeof t === 'function' ? t : t.func),
            toolsJson,
            false
        );
    }

    registerFunction(tool) {
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
        return {
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
        return {
            type: "function",
            function: {
                name: func.name,
                description: this._autoDescribeFunction(func.name),
                parameters
            }
        };
    }

    _autoDescribeFunction(funcName) {
        // Convert camelCase to spaces and capitalize
        return funcName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    _autoDescribeParam(paramName) {
        // Convert camelCase to spaces and capitalize
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
                return func(...args);
            } catch (error) {
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

        // console.log('\nAuto-generated Example:');
        // console.log(JSON.stringify(tools.toolsJson[0], null, 2));

        console.log('\nMetadata Example:');
        console.log(JSON.stringify(tools.toolsJson[1], null, 2));

        console.log('\nTest Tool (getDate):');
        console.log(JSON.stringify(tools.toolsJson[2], null, 2));

        // testing calling the tools
        console.log(tools.call('calculateTotal', { price: 100, taxRate: 0.05 }));
        console.log(tools.call('getDate', { includeTime: false }));
        console.log(tools.call('getDate', { includeTime: true }));
    })().catch(console.error);
}