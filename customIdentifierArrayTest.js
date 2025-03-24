import { Tools, ChatBot } from './dist/esm/index.js';

// Define a function that accepts customIdentifier
function getUserProfile(customIdentifier = null) {
    if (!customIdentifier) {
        return "No user profile available - missing custom identifier";
    }
    return `User profile for ${customIdentifier.userId}: ${JSON.stringify(customIdentifier)}`;
}

// Define a simple tool with parameters and customIdentifier
function formatUserAddress(street, city, customIdentifier = null) {
    const address = `${street}, ${city}`;
    
    if (customIdentifier && customIdentifier.format === 'uppercase') {
        return address.toUpperCase();
    }
    return address;
}

// Define an async function that accepts customIdentifier
async function fetchUserSettings(customIdentifier = null) {
    if (!customIdentifier || !customIdentifier.userId) {
        return "Cannot fetch settings - missing user ID";
    }
    
    // Simulate async API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`Settings for user ${customIdentifier.userId}: ${JSON.stringify({
                theme: customIdentifier.theme || 'default',
                language: customIdentifier.language || 'en',
                notifications: customIdentifier.notifications || 'all'
            })}`);
        }, 100);
    });
}

console.log("Testing Tools with array of tool objects that use customIdentifier...");

// Create tools using array initialization
const tools = new Tools([
    {
        func: getUserProfile,
        acceptsCustomIdentifier: true,
        description: "Get the user's profile information",
        parameters: {}
    },
    {
        func: formatUserAddress,
        acceptsCustomIdentifier: true,
        description: "Format a user's address",
        parameters: {
            street: {
                type: "string",
                description: "The street address"
            },
            city: {
                type: "string",
                description: "The city"
            }
        }
    },
    {
        func: fetchUserSettings,
        acceptsCustomIdentifier: true,
        description: "Fetch user settings (async)",
        parameters: {}
    }
]);

// Test function to verify customIdentifier is properly passed
async function testToolsArray() {
    console.log("\nTest 1: Function with only customIdentifier parameter");
    const profile = await tools.call(
        'getUserProfile', 
        {}, 
        { userId: "user123", name: "John Doe", email: "john@example.com" }
    );
    console.log(profile);
    
    console.log("\nTest 2: Function with regular parameters + customIdentifier");
    const address = await tools.call(
        'formatUserAddress',
        { street: "123 Main St", city: "New York" },
        { format: "uppercase", userId: "user123" }
    );
    console.log(address);
    
    console.log("\nTest 3: Same function without customIdentifier");
    const normalAddress = await tools.call(
        'formatUserAddress',
        { street: "123 Main St", city: "New York" }
    );
    console.log(normalAddress);
    
    console.log("\nTest 4: Async function with customIdentifier");
    const settings = await tools.call(
        'fetchUserSettings',
        {},
        { userId: "user123", theme: "dark", language: "en-US", notifications: "important" }
    );
    console.log(settings);
}

// Run the tests
testToolsArray().catch(console.error); 