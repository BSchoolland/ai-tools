# @bschoolland/ai-tools

A personal collection of reusable AI utilities for quick project bootstrapping.

## Requirements

- Node.js >= 14.0.0 (for ES Modules support)
- Your project must support ES Modules (package.json should have `"type": "module"`)

## Installation

1. Add to your project's `package.json`:
```json
{
  "type": "module",  // Required: This package uses ES Modules
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
import { Chatbot, Tools, History } from '@bschoolland/ai-tools';

// Or import specific modules
import { Chatbot } from '@bschoolland/ai-tools/core';
import { History } from '@bschoolland/ai-tools/utils';
```

## Complete Example

Here's a working example showing how to set up and use the package:

```javascript
// example.js
import dotenv from 'dotenv';
import { Chatbot, Tools } from '@bschoolland/ai-tools';

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

// Initialize chatbot
const chatbot = new Chatbot({
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
     const { Chatbot } = await import('@bschoolland/ai-tools');
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
│   ├── chatbot.js  # Main chatbot implementation
│   └── tools.js    # Tool system for extending AI capabilities
├── utils/          # Utility functions
│   └── history.js  # Chat history management
└── index.js        # Main entry point
```

## Features

- 🤖 Easy-to-use Chatbot integration
- 🛠️ Extensible tools system
- 📝 Chat history management
- 📦 Modular and reusable
- 🔌 Simple integration

## License

MIT