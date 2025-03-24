import { Tools, ChatBot } from './dist/esm/index.js';

// Simple function that uses customIdentifier
function getTimeForTimezone(timezone = null, customIdentifier = null) {
    const tz = customIdentifier?.timezone || timezone || 'UTC';
    
    const date = new Date();
    const options = { timeZone: tz, timeStyle: 'full', dateStyle: 'full' };
    
    try {
        return new Intl.DateTimeFormat('en-US', options).format(date) + ` (${tz})`;
    } catch (error) {
        return `Error formatting time for timezone ${tz}: ${error.message}`;
    }
}

// Create basic tools
const tools = new Tools();

// Register the tool with metadata
tools.register({
    func: getTimeForTimezone,
    description: "Get the current time for a specific timezone",
    acceptsCustomIdentifier: true,
    parameters: {
        timezone: {
            type: "string",
            description: "The IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')"
        }
    }
});

// Test with different models
async function testWithModel(modelName) {
    console.log(`\n=== Testing with model: ${modelName} ===`);
    
    try {
        // Create a ChatBot with the specified model
        const chatbot = new ChatBot({
            systemMessage: "You are a helpful assistant that can provide time information.",
            tools: tools,
            model: modelName,
            customIdentifier: {
                timezone: "America/Los_Angeles",
                permissions: {
                    timeAccess: true
                }
            }
        });
        
        console.log(`Sending message to get time in chatbot's timezone...`);
        const response = await chatbot.sendMessage(
            "What time is it in the chatbot's configured timezone? Use the getTimeForTimezone function."
        );
        
        console.log(`Response from ${modelName}:`, response);
        return true;
    } catch (error) {
        console.error(`Error with ${modelName}:`, error.message);
        return false;
    }
}

// Run tests with different models
async function runTests() {
    // Test with different model types
    await testWithModel("gpt-4o-mini"); // OpenAI
    
    // Note: Add more model tests if API keys are available
    // await testWithModel("claude-3-haiku-20240307"); // Anthropic
    // await testWithModel("deepseek-chat"); // DeepSeek
    
    console.log("\nAll tests completed.");
}

runTests().catch(console.error); 