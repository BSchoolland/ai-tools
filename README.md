# Broilerplate AI

A drag-and-drop AI functionality module that makes it extremely easy to add AI capabilities to any JavaScript project.

## Installation

1. Copy the `src` directory into your project
2. Install the required dependencies:
```bash
npm install openai dotenv
```

3. Create a `.env` file in your project root and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Basic Chat Integration

```javascript
import { ChatBot } from 'path/to/src/core/chatbot.js';
import { MessageRole } from 'path/to/src/types/index.js';

const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4'  // optional, defaults to gpt-4
});

const response = await chatbot.chat('Hello, how can you help me today?');
console.log(response);
```

### Using Tools

```javascript
import { Tools } from 'path/to/src/core/tools.js';

const tools = new Tools();
tools.register('calculator', (input) => eval(input));

const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    tools: tools
});
```

### Managing Chat History

```javascript
import { History } from 'path/to/src/utils/history.js';

const history = new History();
history.add({
    role: MessageRole.USER,
    content: 'What is 2+2?'
});
```

## Directory Structure

```
src/
├── core/           # Core AI functionality
│   ├── chatbot.js  # Main chatbot implementation
│   └── tools.js    # Tool system for extending AI capabilities
├── utils/          # Utility functions
│   └── history.js  # Chat history management
├── types/          # Type definitions
│   └── index.js    # Common types and interfaces
└── index.js        # Main entry point
```

## Features

- 🤖 Easy-to-use ChatBot integration
- 🛠️ Extensible tools system
- 📝 Chat history management
- 📦 Modular and reusable
- 🔌 Simple drag-and-drop integration

## License

MIT