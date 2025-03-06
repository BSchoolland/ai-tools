import { ChatBot, getLLMResponse, doAgentTask, Tools, History } from "./src/index.js"
import { openAiModels, anthropicModels, deepSeekModels } from "./src/core/config.js";

if (import.meta.url === `file://${process.argv[1]}`) {
    // import .env
    (async () => {
        const dotenv = await import("dotenv");
        dotenv.config();

        console.log("Running tests...");
        const model = 'deepseek-chat';
        if (!openAiModels.includes(model) && !anthropicModels.includes(model) && !deepSeekModels.includes(model)) {
            throw new Error(`Model ${model} is not supported`);
        }
        if (openAiModels.includes(model)) {
            //==========================================================================
            // SECTION 1: OPENAI TESTS
            //==========================================================================
            console.log('\n\n\n==============================================');
            console.log('OPENAI TESTS');
            console.log('==============================================');
            
            // Basic response with system message
            console.log('Testing basic LLM response with system message (OpenAI)...');
            console.log('User: Hello');
            const responseOpenAI = await getLLMResponse({
                message: "Hello",
                model: "gpt-4o-mini",
                systemMessage: "Always respond like a pirate.",
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log('ChatBot: ' + responseOpenAI);
            
            // Agent task test
            console.log('\n==============================================');
            console.log('Testing agent task (OpenAI)...');
            console.log('User: What is the current date and time?');
            const taskOpenAI = await doAgentTask({
                message: "What is the current date and time?",
                model: "gpt-4o-mini",
                tools: new Tools([], true),
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log('ChatBot: ' + taskOpenAI);
            
            // ChatBot with context retention
            console.log('\n==============================================');
            console.log('Testing ChatBot with context retention (OpenAI)...');
            const chatbotOpenAI = new ChatBot({
                model: "gpt-4o-mini",
                apiKey: process.env.OPENAI_API_KEY,
                maxHistory: 10,
                maxToolCalls: 3
            });
            console.log('User: Remember the number 42.');
            const responseOpenAI2 = await chatbotOpenAI.sendMessage("Remember the number 42.");
            console.log('ChatBot: ' + responseOpenAI2);
            console.log('User: What is the number?');
            const responseOpenAI3 = await chatbotOpenAI.sendMessage("What is the number?");
            console.log('ChatBot: ' + responseOpenAI3);
            
            // Agent task with insufficient tool calls
            console.log('\n==============================================');
            console.log('Testing agent task with insufficient tool calls (OpenAI)...');
            console.log('User: Get the current date and time 3 times, one at a time (not all at once), and tell me the max and min of the dates.');
            const taskOpenAI2 = await doAgentTask({
                message: "Get the current date and time 3 times, (not all at once), and tell me the max and min of the dates.",
                model: "gpt-4o-mini",
                tools: new Tools([], true),
                apiKey: process.env.OPENAI_API_KEY,
                maxToolCalls: 2
            });
            console.log('ChatBot: ' + taskOpenAI2);
        }
         else if (anthropicModels.includes(model)) {
            //==========================================================================
            // SECTION 2: CLAUDE TESTS
            //==========================================================================
            console.log('\n\n\n==============================================');
            console.log('CLAUDE TESTS');
            console.log('==============================================');
            
            // Basic response with system message
            console.log('Testing basic LLM response with system message (Claude)...');
            console.log('User: Hello');
            const responseClaude = await getLLMResponse({
                message: "Hello",
                model: "claude-3-haiku-20240307",
                systemMessage: "Always respond like a pirate.",
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            console.log('ChatBot: ' + responseClaude);
            
            // Agent task test
            console.log('\n==============================================');
            console.log('Testing agent task (Claude)...');
            console.log('User: What is the current date and time?');
            const taskClaude = await doAgentTask({
                message: "What is the current date and time?",
                model: "claude-3-haiku-20240307",
                tools: new Tools([], true),
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            console.log('ChatBot: ' + taskClaude);
            
            // ChatBot with context retention
            console.log('\n==============================================');
            console.log('Testing ChatBot with context retention (Claude)...');
            const chatbotClaude = new ChatBot({
                model: "claude-3-haiku-20240307",
                apiKey: process.env.ANTHROPIC_API_KEY,
                maxHistory: 10,
                maxToolCalls: 3
            });
            console.log('User: Remember the number 42.');
            const responseClaude2 = await chatbotClaude.sendMessage("Remember the number 42.");
            console.log('ChatBot: ' + responseClaude2);
            console.log('User: What is the number?');
            const responseClaude3 = await chatbotClaude.sendMessage("What is the number?");
            console.log('ChatBot: ' + responseClaude3);
            
            // Agent task with insufficient tool calls
            console.log('\n==============================================');
            console.log('Testing agent task with insufficient tool calls (Claude)...');
            console.log('User: Get the current date and time 3 times, one at a time (not all at once), and tell me the max and min of the dates.');
            const taskClaude2 = await doAgentTask({
                message: "Get the current date and time 3 times, (not all at once), and tell me the max and min of the dates.",
                model: "claude-3-haiku-20240307",
                tools: new Tools([], true),
                apiKey: process.env.ANTHROPIC_API_KEY,
                maxToolCalls: 2
            });
            console.log('ChatBot: ' + taskClaude2);
        } else if (deepSeekModels.includes(model)) {
            //==========================================================================
            // SECTION 3: DEEPSEEK TESTS
            //==========================================================================
            console.log('\n\n\n==============================================');
            console.log('DEEPSEEK TESTS');
            console.log('==============================================');
            
            // Basic response with system message
            console.log('Testing basic LLM response with system message (DeepSeek)...');
            console.log('User: Hello');
            const responseDeepSeek = await getLLMResponse({
                message: "Hello",
                model: "deepseek-chat",
                systemMessage: "Always respond like a pirate.",
                apiKey: process.env.DEEPSEEK_API_KEY
            });
            console.log('ChatBot: ' + responseDeepSeek);
            
            // Agent task test
            console.log('\n==============================================');
            console.log('Testing agent task (DeepSeek)...');
            console.log('User: What is the current date and time?');
            const taskDeepSeek = await doAgentTask({
                message: "What is the current date and time?",
                model: "deepseek-chat",
                tools: new Tools([], true),
                apiKey: process.env.DEEPSEEK_API_KEY
            });
            console.log('ChatBot: ' + taskDeepSeek);
            
            // ChatBot with context retention
            console.log('\n==============================================');
            console.log('Testing ChatBot with context retention (DeepSeek)...');
            const chatbotDeepSeek = new ChatBot({
                model: "deepseek-chat",
                apiKey: process.env.DEEPSEEK_API_KEY,
                maxHistory: 10,
                maxToolCalls: 3
            });
            console.log('User: Remember the number 42.');
            const responseDeepSeek2 = await chatbotDeepSeek.sendMessage("Remember the number 42.");
            console.log('ChatBot: ' + responseDeepSeek2);
            console.log('User: What is the number?');
            const responseDeepSeek3 = await chatbotDeepSeek.sendMessage("What is the number?");
            console.log('ChatBot: ' + responseDeepSeek3);
            
            // Agent task with insufficient tool calls
            console.log('\n==============================================');
            console.log('Testing agent task with insufficient tool calls (DeepSeek)...');
            console.log('User: Get the current date and time 3 times, one at a time (not all at once), and tell me the max and min of the dates.');
            const taskDeepSeek2 = await doAgentTask({
                message: "Get the current date and time 3 times at once, and tell me the max and min of the dates.",
                model: "deepseek-chat",
                tools: new Tools([], true),
                apiKey: process.env.DEEPSEEK_API_KEY,
                maxToolCalls: 2
                });
                console.log('ChatBot: ' + taskDeepSeek2);
        }
        console.log('\n==============================================');
        console.log('Tests complete!');
    })();
}