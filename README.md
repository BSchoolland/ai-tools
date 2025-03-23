# @bschoolland/ai-tools

A personal collection of reusable AI utilities for quick project bootstrapping.

## Requirements

- Node.js >= 14.0.0

## Installation

1. Add to your project's `package.json`:
```json
{
  "dependencies": {
    "@bschoolland/ai-tools": "git+https://github.com/bschoolland/ai-tools.git"
  }
}
```

2. Run:
```bash
npm install
```

3. Create a `.env` file in your project root:
```
OPENAI_API_KEY=your_api_key_here
```

## Available Exports

The package exports the following:

```javascript
// Main imports
import { ChatBot, Tools, History } from '@bschoolland/ai-tools';
```

## getLLMResponse

A simple function to get a one-off response from a language model without maintaining conversation history or using tools. This is useful for quick queries that don't require context or special capabilities.

```javascript
const response = await getLLMResponse({
    message: "Hello",                    // The user's message
    systemMessage: "Be concise",         // Optional system prompt
    model: "gpt-4o-mini",               // The model to use
    apiKey: process.env.OPENAI_API_KEY   // Optional API key
});
```

## doAgentTask

A more powerful function that allows the AI to use tools to complete tasks. This function maintains a conversation history and can make multiple tool calls to achieve the desired result. It's ideal for tasks that require external capabilities like getting the current time, performing calculations, or accessing data.

```javascript
const response = await doAgentTask({
    message: "What time is it?",         // The user's task/question
    systemMessage: "",                   // Optional system prompt
    tools: new Tools([/* your tools */]), // Tools the agent can use
    model: "gpt-4o-mini",               // The model to use
    apiKey: process.env.OPENAI_API_KEY,  // Optional API key
    maxToolCalls: 25,                    // Max number of tool calls (default: 25)
    maxHistory: 100                      // Max history messages to keep (default: 100)
});
```

## Working with Tools

The Tools system allows you to give your AI assistant access to custom functions. There are two ways to create tools:

### 1. Simple Tool Creation
Best for simple functions with no parameters:

```javascript
import { Tools, doAgentTask } from '@bschoolland/ai-tools';

const tools = new Tools();

// function must have a name that describes what it does
function getCurrentTime() {
    return new Date().toISOString();
}
// Register a simple function
tools.register(getCurrentTime);

console.log(tools.toolsJson);

console.log(await doAgentTask({
    systemMessage: "You are a helpful assistant.",
    tools: tools,
    message: "What time is it?"
}));
```

### 2. Detailed Tool Creation
Better for complex functions with parameters:

```javascript
import { Tools } from '@bschoolland/ai-tools';

// Create tools with detailed specifications
const tools = new Tools([
    {
        func: (x, y) => x + y,
        name: 'add',  // Optional: defaults to function name
        description: 'Add two numbers together',
        parameters: {
            x: {
                type: 'number',
                description: 'First number to add'
            },
            y: {
                type: 'number',
                description: 'Second number to add'
            }
        }
    },
    {
        func: (text) => text.toUpperCase(),
        description: 'Convert text to uppercase',
        parameters: {
            text: {
                type: 'string',
                description: 'Text to convert'
            }
        }
    }
]);

// Add more tools later
tools.register({
    func: (date) => new Date(date).toLocaleDateString(),
    description: 'Format a date string',
    parameters: {
        date: {
            type: 'string',
            description: 'Date string to format'
        }
    }
});
```

### Using Tools with ChatBot

```javascript
const tools = new Tools([/* your tools */]);
const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    tools: tools,
    systemMessage: 'You are a helpful assistant. Use the provided tools when appropriate.'
});

// The AI will automatically use tools when needed
const response = await chatbot.sendMessage('What time is it in UTC?');
```

### Tool Usage Example

Here's a complete example showing tool usage:

```javascript
import { ChatBot, Tools } from '@bschoolland/ai-tools';
import dotenv from 'dotenv';

dotenv.config();

// Create tools
const tools = new Tools([
    {
        func: (text) => text.length,
        description: 'Count characters in text',
        parameters: {
            text: {
                type: 'string',
                description: 'Text to count'
            }
        }
    },
    {
        func: () => new Date().toISOString(),
        description: 'Get current time in ISO format',
        parameters: {}
    }
]);

// Create ChatBot with tools
const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    tools: tools,
    systemMessage: 'You are a helpful assistant that can work with text and time.'
});

// Example usage
async function main() {
    try {
        const response = await chatbot.sendMessage(
            'How many characters are in "Hello, World!" and what time is it?'
        );
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

## Complete Example

Here's a working example showing how to set up and use the package:

```javascript
// example.js
import dotenv from 'dotenv';
import { ChatBot, Tools } from '@bschoolland/ai-tools';

// Load environment variables
dotenv.config();

function getCurrentTime() {
    return new Date().toISOString();
}

// Create a tool
const tools = new Tools([
    {
        func: getCurrentTime,
        description: 'Get the current time',
        parameters: {}
    }
]);

// Initialize ChatBot
const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    tools: tools,
    systemMessage: 'You are a helpful assistant that can tell the time.'
});

// Example conversation
async function main() {
    try {
        const response = await chatbot.sendMessage('What time is it?');
        console.log('Bot:', response);
        
        // Access conversation history
        console.log('Full conversation:', chatbot.getHistory().getHistory());
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

To run this example:
1. Save as `example.js`
2. Ensure your `package.json` has `"type": "module"`
3. Run with `node example.js`

## Using in CommonJS Projects

If your project uses CommonJS (default Node.js modules), you have two options:

1. Convert your project to use ES Modules (recommended):
   ```json
   {
     "type": "module"
   }
   ```

2. Use dynamic imports in your CommonJS code:
   ```javascript
   // example.cjs
   const main = async () => {
     const { ChatBot } = await import('@bschoolland/ai-tools');
     // ... rest of your code
   };
   main();
   ```

## Troubleshooting

Common issues and solutions:

1. **"Cannot use import statement outside a module"**
   - Add `"type": "module"` to your package.json
   - Or rename your file to `.mjs`
   - Or use dynamic imports (see CommonJS section above)

2. **"ERR_PACKAGE_PATH_NOT_EXPORTED"**
   - Check your import path matches the exports in package.json
   - Use the exact paths shown in "Available Exports" section

3. **OpenAI API errors**
   - Ensure OPENAI_API_KEY is set in your .env file
   - Check that dotenv is properly configured

## Directory Structure

```
src/
├── core/           # Core AI functionality
│   ├── ChatBot.js  # Main ChatBot implementation
│   └── tools.js    # Tool system for extending AI capabilities
├── utils/          # Utility functions
│   └── history.js  # Chat history management
└── index.js        # Main entry point
```

## Features

- 🤖 Easy-to-use ChatBot integration
- 🛠️ Extensible tools system
- 📝 Chat history management
- 📦 Modular and reusable
- 🔌 Simple integration

## License

MIT