import { Tools, ChatBot } from './dist/esm/index.js';

// Create a tool that uses customIdentifier
function getTimeForTimezone(timezone = null, customIdentifier = null) {
    console.log("getTimeForTimezone called with parameters:", { 
        timezone, 
        // Display detailed debug info
        args: arguments.length,
        hasCustomIdentifier: customIdentifier !== null,
        customIdentifierValue: customIdentifier,
        argTypes: Array.from(arguments).map(arg => typeof arg === 'object' ? 'object' : typeof arg)
    });
    
    // Handle both cases - customIdentifier might come as first or second argument
    let tzParam = timezone;
    let customId = customIdentifier;
    
    // If first arg is an object with timezone property, it might be customIdentifier in the wrong position
    if (timezone !== null && typeof timezone === 'object' && timezone.timezone) {
        console.log("First argument appears to be customIdentifier, swapping parameters");
        customId = timezone;
        tzParam = null;
    }
    
    // If customIdentifier has timezone info, use that instead of the parameter
    const tz = customId?.timezone || tzParam || 'UTC';
    
    // Create a date and format it for the specified timezone
    const date = new Date();
    const options = { timeZone: tz, timeStyle: 'full', dateStyle: 'full' };
    
    try {
        return new Intl.DateTimeFormat('en-US', options).format(date) + ` (${tz})`;
    } catch (error) {
        return `Error formatting time for timezone ${tz}: ${error.message}`;
    }
}

// Create a simple utility function to inspect what arguments a function receives
function inspectFunctionArguments(func) {
    const wrapper = function() {
        console.log("Function received arguments:", Array.from(arguments));
        return func.apply(this, arguments);
    };
    
    // Preserve the original function name
    Object.defineProperty(wrapper, 'name', {
        value: func.name,
        configurable: true
    });
    
    return wrapper;
}

// Wrap our function to inspect arguments
const wrappedTimeFunction = inspectFunctionArguments(getTimeForTimezone);

// Create tools properly with metadata
const tools = new Tools();

// Register the tool with proper metadata to indicate it accepts customIdentifier
tools.register({
    func: wrappedTimeFunction,
    description: "Get the current time for a specific timezone",
    acceptsCustomIdentifier: true,
    parameters: {
        timezone: {
            type: "string",
            description: "The IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')"
        }
    }
});

// Debug info about the tool
console.log("\nDebug info about registered tools:");
tools.functions.forEach(func => {
    console.log(`Function: ${func.name}, Accepts customIdentifier: ${!!func._acceptsCustomIdentifier}`);
});
console.log("\nTools JSON:", JSON.stringify(tools.toolsJson, null, 2));

// Create a ChatBot with a customIdentifier that includes timezone
const chatbot = new ChatBot({
    systemMessage: "You are a helpful assistant that can provide time information for different timezones. Use the getTimeForTimezone function to get accurate time information.",
    tools: tools,
    model: "gpt-4o-mini",
    customIdentifier: {
        timezone: "America/New_York",
        permissions: {
            timeAccess: true
        }
    }
});

// Test the tool directly
console.log("\nDirect tool call:");
console.log(getTimeForTimezone("UTC")); // Should use UTC
console.log(getTimeForTimezone(null, { timezone: "Europe/London" })); // Should use London
console.log(getTimeForTimezone()); // Should use UTC (default)

// Now test with the chatbot
console.log("\nChatbot with customIdentifier (should use America/New_York):");
console.log("Sending message to get the current time...");
const response = await chatbot.sendMessage("What time is it right now in the chatbot's timezone?");
console.log("Response:", response);

// Change the customIdentifier and test again
chatbot.setCustomIdentifier({
    timezone: "Asia/Tokyo",
    permissions: {
        timeAccess: true
    }
});

console.log("\nChatbot with updated customIdentifier (should use Asia/Tokyo):");
console.log("Sending message to get the current time...");
const response2 = await chatbot.sendMessage("What time is it now in the chatbot's timezone?");
console.log("Response:", response2); 