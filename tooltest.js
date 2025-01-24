import { Tools, doAgentTask } from '@bschoolland/ai-tools';

const tools = new Tools();

// function must have a name that describes what it does
function getCurrentTime() {
    return new Date().toISOString();
}
// Register a simple function
tools.register(getCurrentTime);

console.log(tools.toolsJson);

console.log(await doAgentTask({
    systemMessage: "You are a helpful assistant.",
    tools: tools,
    message: "What time is it?"
}));