import { Tools, doAgentTask } from '@bschoolland/ai-tools';

const tools = new Tools();

// function must have a name that describes what it does
async function getCurrentTime() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return new Date().toISOString();
}

function syncGetCurrentTime() {
    return new Date().toISOString();
}

// Register a simple function
tools.register(getCurrentTime);
tools.register(syncGetCurrentTime);

console.log(tools.toolsJson);

console.log(await doAgentTask({
    systemMessage: "You are a helpful assistant.",
    tools: tools,
    message: "What time is it? Test with both the async and sync functions, tell me if both work and why"
}));