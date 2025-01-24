import { Chatbot } from './chatbot.js';
import { Tools } from './tools.js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define calculator functions
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) return "Cannot divide by zero";
    return a / b;
}

// Create tools with metadata
const calculatorTools = [
    {
        func: add,
        description: "Add two numbers together",
        parameters: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" }
        }
    },
    {
        func: subtract,
        description: "Subtract second number from first number",
        parameters: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number to subtract" }
        }
    },
    {
        func: multiply,
        description: "Multiply two numbers together",
        parameters: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" }
        }
    },
    {
        func: divide,
        description: "Divide first number by second number",
        parameters: {
            a: { type: "number", description: "Number to divide" },
            b: { type: "number", description: "Number to divide by" }
        }
    }
];

// Create tools instance
const tools = new Tools(calculatorTools);

// Create chatbot instance
const chatbot = new Chatbot({
    systemMessage: "You are a helpful math assistant that can perform basic arithmetic operations. For each calculation:\n2. Use the appropriate function to calculate the result\n3. Show the result and confirm it's correct\nAlways provide clear explanations in natural language.",
    tools: tools,
    apiKey: process.env.OPENAI_API_KEY,
});

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main chat loop
console.log("Math Assistant: Hello! I can help you with basic math. Type 'exit' to quit.");

function askQuestion() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('Math Assistant: Goodbye!');
            rl.close();
            return;
        }

        try {
            const response = await chatbot.userMessage(input);
            console.log('Math Assistant:', response);
        } catch (error) {
            console.error('Error details:', error.message);
            if (error.response) {
                console.error('API Error:', await error.response.json());
            }
            console.log('Math Assistant: Sorry, I encountered an error. Please try again.');
        }

        askQuestion();
    });
}

askQuestion(); 