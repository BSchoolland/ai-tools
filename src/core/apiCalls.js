import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Lower level function for calling the OpenAI API.
 * 
 */
async function openAiCall(history, tools = [], model = "gpt-4o-mini", apiKey = null) {
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const body = {
        model: model,
        messages: history
    };
    
    // Only add tools if they are provided and non-empty
    if (tools && tools.length > 0) {
        body.tools = tools;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error.message}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
    }

    const message = responseData.choices[0].message.content || '';
    const tool_calls = responseData.choices[0].message.tool_calls || null;
    return { message, tool_calls };
}

/**
 * Lower level function for calling the Anthropic API.
 * 
 */
async function anthropicCall(history, tools = [], model = "claude-3-haiku-latest", apiKey = null) {
    if (apiKey === null) {
        apiKey = process.env.ANTHROPIC_API_KEY;
    }
    
    if (!apiKey) {
        throw new Error("Anthropic API key is not set. Please check your .env file.");
    }
    
    try {
        const anthropic = new Anthropic({
            apiKey: apiKey,
        });
        
        // Extract system message if present
        let systemMessage = "";
        const nonSystemMessages = [];
        
        for (const msg of history) {
            if (msg.role === "system") {
                systemMessage = msg.content;
            } else {
                nonSystemMessages.push(msg);
            }
        }
        
        // Convert history format from OpenAI to Anthropic (excluding system message)
        const anthropicMessages = convertHistoryToAnthropic(nonSystemMessages);
        
        // Prepare request parameters
        const requestParams = {
            model: model,
            max_tokens: 1024,
            messages: anthropicMessages,
        };
        
        // Add system message if present
        if (systemMessage) {
            requestParams.system = systemMessage;
        }
        
        // Add tools if provided and non-empty
        if (tools && tools.length > 0) {
            // Convert OpenAI tool format to Anthropic tool format
            requestParams.tools = convertToolsToAnthropic(tools);
        }
        
        const response = await anthropic.messages.create(requestParams);
        
        // Check if the response is valid and has content
        if (!response || !response.content || !Array.isArray(response.content) || response.content.length === 0) {
            console.warn("Anthropic API returned an empty or invalid response");
            return { 
                message: "I apologize, but I couldn't generate a response. Please try again.", 
                tool_calls: null 
            };
        }
        
        // Check if the response contains tool use
        if (response.stop_reason === "tool_use") {
            // Find the tool_use content block
            const toolUseBlock = response.content.find(block => block.type === "tool_use");
            
            if (toolUseBlock) {
                // Convert Anthropic tool_use format to OpenAI tool_calls format for consistency
                const tool_calls = [{
                    id: toolUseBlock.id,
                    type: "function",
                    function: {
                        name: toolUseBlock.name,
                        arguments: JSON.stringify(toolUseBlock.input)
                    }
                }];
                
                return { 
                    message: "", // Empty message when tool is called
                    tool_calls: tool_calls 
                };
            }
        }
        
        // If no tool use, just return the text content
        let message = "";
        const textBlock = response.content.find(block => block.type === "text");
        if (textBlock) {
            message = textBlock.text;
        }
        
        return { message, tool_calls: null };
    } catch (error) {
        console.error("Error calling Anthropic API:", error.message);
        throw error;
    }
}

/**
 * Convert OpenAI history format to Anthropic format
 */
function convertHistoryToAnthropic(history) {
    return history.map(msg => {
        // Handle tool results
        if (msg.role === "tool") {
            // Convert to Anthropic tool_result format
            return {
                role: "user",
                content: [{
                    type: "tool_result",
                    tool_use_id: msg.tool_call_id,
                    content: msg.content
                }]
            };
        }
        
        // Handle assistant messages with tool calls
        if (msg.role === "assistant" && msg.tool_calls) {
            // Convert to Anthropic format with tool_use
            const content = [];
            
            // Add text content if present
            if (msg.content) {
                content.push({
                    type: "text",
                    text: msg.content
                });
            }
            
            // Add tool_use blocks
            msg.tool_calls.forEach(tool_call => {
                content.push({
                    type: "tool_use",
                    id: tool_call.id,
                    name: tool_call.function.name,
                    input: JSON.parse(tool_call.function.arguments)
                });
            });
            
            return {
                role: "assistant",
                content: content
            };
        }
        
        // Handle regular user or assistant messages
        if (msg.content && typeof msg.content === 'string') {
            return {
                role: msg.role,
                content: msg.content
            };
        }
        
        // Pass through any other message formats
        return msg;
    });
}

/**
 * Convert OpenAI tool format to Anthropic tool format
 */
function convertToolsToAnthropic(tools) {
    return tools.map(tool => {
        if (tool.type === "function") {
            return {
                name: tool.function.name,
                description: tool.function.description,
                input_schema: tool.function.parameters
            };
        }
        return tool; // Pass through if already in Anthropic format
    });
}

export { openAiCall, anthropicCall, convertHistoryToAnthropic, convertToolsToAnthropic };
// test anthropic call
// (async () => {
//     const msg = await anthropicCall([{ role: "user", content: "Hello" }]);
//     console.log(msg);
// })();
