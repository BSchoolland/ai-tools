# @bschoolland/ai-tools

A personal collection of reusable AI utilities for quick project bootstrapping.

## Installation

Add to your project's `package.json`:
```json
{
  "dependencies": {
    "@bschoolland/ai-tools": "git+https://github.com/bschoolland/ai-tools.git"
  }
}
```

Then run:
```bash
npm install
```

Create a `.env` file in your project root and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Basic Chat Integration

```javascript
import { ChatBot } from '@bschoolland/ai-tools';

const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4'  // optional, defaults to gpt-4
});

const response = await chatbot.chat('Hello, how can you help me today?');
console.log(response);
```

### Using Tools

```javascript
import { Tools } from '@bschoolland/ai-tools/core';

const tools = new Tools();
tools.register('calculator', (input) => eval(input));

const chatbot = new ChatBot({
    apiKey: process.env.OPENAI_API_KEY,
    tools: tools
});
```

### Managing Chat History

```javascript
import { History } from '@bschoolland/ai-tools/utils';

const history = new History();
history.add({
    role: 'user',
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