# @bschoolland/ai-tools

A personal collection of reusable AI utilities for quick project bootstrapping.

## Requirements

- Node.js >= 14.0.0

## Installation

1. Run:
``` sh
npm install @benschoolland/ai-tools
```

2. Create a `.env` file in your project root:
```
OPENAI_API_KEY=your_api_key_here
```
and/or
```
ANTHROPIC_API_KEY=your_api_key_here
```
Note: you must have at least one API key set for the package to work, or you can pass the API key as an option to the constructor.

## Available Exports

The package exports the following:

For ES Modules:
```javascript
// Main imports
import { ChatBot, Tools, History } from '@bschoolland/ai-tools';
```
or for CommonJS:
```javascript
const { ChatBot, Tools, History } = require('@bschoolland/ai-tools');
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

## Working with History

The History class manages conversation history for AI interactions. While it's used internally by ChatBot and doAgentTask, you can also use it directly for advanced use cases like:
- Manually managing conversation context
- Editing conversation history
- Persisting conversations between sessions

### Basic Usage

```javascript
import { History } from '@bschoolland/ai-tools';

// Create a new history
const history = new History(
    [
        {role: "system", content: "You are a helpful assistant."},
        {role: "user", content: "Hello!"},
        {role: "assistant", content: "Hello, how can I assist you today?"}
    ]
);

// Add or change the system message
history.setSystemMessage("You are a very helpful assistant.");

// manually append messages
history.addMessage({ role: "user", content: "Hello!" });
history.addMessage({ role: "assistant", content: "Hi there!" });

// Get the full history to use elsewhere in your application
const allMessages = history.getHistory();

// Get limited history (useful for context windows)
const lastFewMessages = history.getHistory(5); // Get last 5 messages (preserves system message)
```

### Using with ChatBot

```javascript
import { ChatBot, History } from '@bschoolland/ai-tools';

// Create a history with existing messages (for example, from a previous conversation or database)
const history = new History([
    {role: "system", content: "You are a helpful assistant."},
    {role: "user", content: "Hello!"},
    {role: "assistant", content: "Hello, how can I assist you today?"}
]);

// Create a ChatBot with existing history
const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    history: history
});

// Get the history at any time
const currentHistory = chatbot.getHistory();

// Replace the history
chatbot.setHistory(new History([/* your messages */]));
// Note that the above will use the existing system message from the ChatBot if you don't provide one in the History constructor
```

### History Message Format

Messages in the history should follow this format:
```javascript
{
    role: string,      // "system", "user", "assistant", or "tool"
    content: string,   // The message content
    tool_call_id?: string,  // Optional: ID for tool calls
    name?: string      // Optional: Name of the tool used
}
```

The History class automatically handles system messages (ensuring they stay at the start of the conversation) and provides methods to manage the conversation flow.

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

## Experimental: ChatBotManager

The chatbot manager is a class that manages multiple conversations, identified by a conversationID. While still a work in progress, it is useful for multi user applications where each user needs to talk to their own instance of the AI.  

### Usage

```javascript
import { ChatBotManager } from '@bschoolland/ai-tools';

// define the manager along with some defaults to use whenever creating a new conversation
const manager = new ChatBotManager(
    {
        model: "gpt-4o-mini",
        tools: new Tools([/* your tools */]),
        systemMessage: "You are a helpful assistant.",
        saveCallback: async (conversationID, history) => { // conversationID is the unique identifier for the user, and history is the conversation history as an array of messages
            // your code here to save the history to a database or other persistent storage
        },
        loadCallback: async (conversationID) => { // conversationID is the unique identifier for the user, and the callback should return the conversation history as an array of messages
            // your code here to load the history from a database or other persistent storage
            return [];
        },
        conversationTTL: 1000 * 60 * 60 * 24 * 30, // 30 days
        checkInterval: 1000 * 60 * 60 * 24 // 1 day
    }
);

// from here, you can create or access a conversation for a specific user
const conversation = await manager.getConversation({ conversationID: "123" });

// send a message from the user and receive a response, just like with the ChatBot class
const response = await conversation.sendMessage("Hello, how are you?");

// each conversation may optionally be initialized with a custom model, tools object, and system message, which it will use instead of the manager's defaults
const conversation2 = await manager.getConversation({ conversationID: "345", model: "gpt-4o", tools: new Tools([/* your tools */]), systemMessage: "You are a helpful assistant." });
```
If the conversationID already exists, the conversation will be retrieved instead of creating a new one, and the manager keeps track of History for each conversation in memory for it's TTL

The saveCallback is called whenever a message is sent, and the loadCallback is called whenever a conversation is initialized.

Note that passing custom model, systemMessage, or tools as options to getConversation will not work for existing conversations, they will only be used if the conversation does not already exist.

Again, this feature is still a work in progress and may need to be expanded or modified in the future.

## Custom Identifier for User-Specific Context

BroilerplateAI supports passing user-specific context to tools through the `customIdentifier` feature. This allows you to:

1. Pass user permissions and preferences to tools
2. Provide user-specific data like timezones, locale settings, or organization information
3. Apply authentication context without modifying tool signatures

### Using customIdentifier

#### At Chatbot Creation

```javascript
// Create a manager with a default customIdentifier
const manager = new ChatbotManager({
  model: "gpt-4o",
  tools: myTools,
  systemMessage: "You are a helpful assistant",
  customIdentifier: {
    defaultPermission: "user"  // Applied to all conversations by default
  }
});

// Create a conversation with a specific customIdentifier
const userConversation = await manager.getConversation({
  conversationID: "user_123",
  customIdentifier: {
    timezone: "America/New_York",
    permissions: ["read", "write"],
    userId: "user_123"
  }
});
```

#### During a Conversation

You can update the customIdentifier at any time:

```javascript
// Update a user's customIdentifier
manager.setCustomIdentifier("user_123", {
  timezone: "Europe/London",
  permissions: ["read", "write", "admin"],
  userId: "user_123"
});
```

#### Tools that Use customIdentifier

Register tools that need the customIdentifier:

```javascript
// Define a tool that uses customIdentifier
function getUserTimeZone(customIdentifier = null) {
  if (!customIdentifier || !customIdentifier.timezone) {
    return "No timezone configured";
  }
  return `User timezone: ${customIdentifier.timezone}`;
}

// Register the tool with acceptsCustomIdentifier flag
tools.register({
  func: getUserTimeZone,
  acceptsCustomIdentifier: true,  // Mark this tool as needing customIdentifier
  description: "Get the user's timezone",
  parameters: {}  // No user-provided parameters needed
});
```

### Benefits

- **Permissions Control**: Gate access to sensitive information based on user roles
- **Personalization**: Provide user-specific responses without complex parameter passing
- **Stateful Context**: Pass session information that persists across multiple tool calls
- **Clean API Design**: Tools can accept user context without cluttering their interfaces

The `customIdentifier` is transparently handled by the chatbot system and automatically passed to tools that need it, regardless of which AI model provider you're using.

## General Troubleshooting

Common issues and solutions:


1. **"ERR_PACKAGE_PATH_NOT_EXPORTED"**
   - Check your import path matches the exports in package.json
   - Use the exact paths shown in "Available Exports" section

2. **OpenAI, Anthropic, or other API errors**
   - Ensure OPENAI_API_KEY, ANTHROPIC_API_KEY, or other API keys are set in your .env file are being passed as an option to the constructor

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

## Publishing to npm

For future reference, here's how to publish updates to this package on npm:

1. Update the version number in `package.json`:
   ```json
   {
     "version": "x.y.z" // Follow semantic versioning
   }
   ```

2. Make sure you're logged in to npm:
   ```bash
   npm whoami        # Check if you're logged in
   npm login         # Log in if needed
   ```

3. Build the package to ensure everything works:
   ```bash
   npm run build
   ```

4. Publish the package:
   ```bash
   npm publish --access public
   ```

Remember that the package is published under the npm username `benschoolland`, so the scope in package.json must match that username.