import { Tools } from './tools.js';
import { getLLMResponse, agentTask } from './chatbot.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runTests() {
    console.log("Testing simple response...");
    try {
        // Test getLLMResponse
        const simpleResponse = await getLLMResponse({
            message: "What is 2+2?",
            systemMessage: "You are a helpful math assistant. Keep answers very brief.",
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log("Simple Response:", simpleResponse);

        // Test agentTask with calculator tool
        console.log("\nTesting simple task with tools...");
        const tools = new Tools([], true);
        const simpleTask = await agentTask({
            message: "Tell me the current date and time.",
            systemMessage: "",
            tools: tools,
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
            maxToolCalls: 3,
            maxHistory: 10
        });
        console.log("Simple Task Result:", simpleTask);

    } catch (error) {
        console.error("Error during tests:", error);
    }
}

// Run the tests
runTests(); 