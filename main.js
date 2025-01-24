import { Chatbot, getLLMResponse, doAgentTask, Tools, History } from "./src/index.js"

if (import.meta.url === `file://${process.argv[1]}`) {
    // import .env
    (async () => {
        const dotenv = await import("dotenv");
        dotenv.config();

        console.log("Running tests...");
        console.log('==============================================');
        console.log('Testing basic LLM response with pirate system message...');
        console.log('User: Hello');
        const response = await getLLMResponse({
            message: "Hello",
            model: "gpt-4o-mini",
            systemMessage: "Always respond like a pirate.",
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('Chatbot: ' + response);
        console.log('==============================================');
        console.log('Testing agent task...');
        console.log('User: What is the current date and time?');
        const task = await doAgentTask({
            message: "What is the current date and time?",
            model: "gpt-4o-mini",
            tools: new Tools([], true),
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('Chatbot: ' + task);
        console.log('==============================================');
        console.log('Testing chatbot with context retention...');
        const chatbot = new Chatbot({
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
            maxHistory: 10,
            maxToolCalls: 3
        });
        console.log('User: Remember the number 42.');
        const response2 = await chatbot.sendMessage("Remember the number 42.");
        console.log('Chatbot: ' + response2);
        console.log('User: What is the number?');
        const response3 = await chatbot.sendMessage("What is the number?");
        console.log('Chatbot: ' + response3);
        console.log('==============================================');
        console.log('Tests complete!');
    })();
}