# Broilerplate AI

## Description

I find myself writing the same basic code to start most of ai projects, I have to connect to the OpenAI API, handle conversation history, implement a tool calling system, implement error handling, and so on.  This project aims to provide all of this basic functionality out of the box, so I can focus of writing the unique parts of my project.

## Tech Stack
Ideally I would want to have this for python as well, but for now most of my projects are web based and Node.js seems to be my more common pick.

- Node.js
- OpenAI API

## Creating Tools

The Tools system allows you to easily create function-based tools that can be called by AI models. There are two ways to create tools:

### 1. Simple Mode (Auto-generated)

Just pass your function directly.  This is useful for quick prototyping or very self-explanatory functions.

```javascript
import { Tools } from './tools.js';

// Example function
function getDate(includeTime = false) {
    const date = new Date();
    return includeTime ? date.toISOString() : date.toDateString();
}

const tools = Tools.create([getDate]);
```

In this mode, the system will:
- Auto-generate descriptions from function and parameter names, for example: `includeTime` would be described as "Include Time"
- Infer types from default values when possible
- Parameters with default values will be marked as optional

Limitations:
- The system will default to "string" type when no type information is available, possibly leaning to type errors.
- While the AI may be able to infer what the function does, the description will not contain any information beyond the function name and parameter names.

### 2. Detailed Mode (With Metadata)

Provide additional metadata for precise control.  This is the recommended mode for creating tools as it allows you to specify the function description, parameter types, parameter descriptions, and optional parameters.

```javascript
const tools = Tools.create([{
    func: getDate,
    description: "Returns the current date",
    parameters: {
        includeTime: {
            type: "boolean",
            description: "Whether to include the time in the date string",
            optional: true
        }
    }
}]);
```

This mode gives you full control over:
- Function descriptions
- Parameter types
- Parameter descriptions
- Optional parameters

### Adding Tools Later

You can register additional tools after creation:

```javascript
// Simple mode
tools.registerFunction(myFunction);

// Detailed mode
tools.registerFunction({
    func: myFunction,
    description: "...",
    parameters: { ... }
});
```