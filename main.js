import { ChatBot, getLLMResponse, doAgentTask, Tools, History } from "./src/index.js"

if (import.meta.url === `file://${process.argv[1]}`) {
    // import .env
    (async () => {
        const dotenv = await import("dotenv");
        dotenv.config();

        console.log("Running tests...");
        console.log('\n\n\n==============================================');
        // system message test
        console.log('Testing basic LLM response with pirate system message...');
        console.log('User: Hello');
        const response = await getLLMResponse({
            message: "Hello",
            model: "gpt-4o-mini",
            systemMessage: "Always respond like a pirate.",
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('ChatBot: ' + response);
        console.log('\n\n\n==============================================');
        // claude test
        console.log('Testing basic LLM response from Claude with system message...');
        console.log('User: Hello');
        const responseClaude = await getLLMResponse({
            message: "Hello",
            model: "claude-3-haiku-20240307",
            systemMessage: "Always respond like a pirate.",
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        console.log('ChatBot: ' + responseClaude);
        console.log('\n\n\n==============================================');
        // successful agent task test
        console.log('Testing agent task...');
        console.log('User: What is the current date and time?');
        const task = await doAgentTask({
            message: "What is the current date and time?",
            model: "gpt-4o-mini",
            tools: new Tools([], true),
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('ChatBot: ' + task);
        // agent task test with claude
        console.log('\n\n\n==============================================');
        console.log('Testing agent task with claude...');
        const taskClaude = await doAgentTask({
            message: "What is the current date and time?",
            model: "claude-3-haiku-20240307",
            tools: new Tools([], true),
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        console.log("User: What is the current date and time?");
        console.log('ChatBot: ' + taskClaude);
        console.log('\n\n\n==============================================');
        console.log('Testing ChatBot with context retention...');
        const chatbot = new ChatBot({
            model: "claude-3-haiku-20240307",
            apiKey: process.env.ANTHROPIC_API_KEY,
            maxHistory: 10,
            maxToolCalls: 3
        });
        console.log('User: Remember the number 42.');
        const response2 = await chatbot.sendMessage("Remember the number 42.");
        console.log('ChatBot: ' + response2);
        console.log('User: What is the number?');
        const response3 = await chatbot.sendMessage("What is the number?");
        console.log('ChatBot: ' + response3);
        console.log('\n\n\n==============================================');
        // agent test where the agent does not have enough tool calls to complete the task
        console.log('Testing agent task with insufficient tool calls...');
        console.log('User: Get the current date and time 3 times, one at a time (not all at once), and tell me the max and min of the dates.');
        const task2 = await doAgentTask({
            message: "Get the current date and time 3 times, (not all at once), and tell me the max and min of the dates.",
            model: "gpt-4o-mini",
            tools: new Tools([], true),
            apiKey: process.env.OPENAI_API_KEY,
            maxToolCalls: 2
        });
        console.log('ChatBot: ' + task2);
        console.log('==============================================');
        console.log('Tests complete!');
    })();
}