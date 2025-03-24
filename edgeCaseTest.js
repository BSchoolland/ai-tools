import { Tools, ChatBot } from './dist/esm/index.js';

// Simple tool without customIdentifier
function addNumbers(a, b) {
    return a + b;
}

// Tool with customIdentifier and multiple parameters
function formatUserData(firstName, lastName, age, customIdentifier = null) {
    // Use customIdentifier for permissions check
    const hasFullAccess = customIdentifier?.permissions?.fullAccess === true;
    
    let result = `User: ${firstName} ${lastName}`;
    
    // Only show age if the customIdentifier grants full access
    if (hasFullAccess) {
        result += `, Age: ${age}`;
    }
    
    return result;
}

// Tool that depends exclusively on customIdentifier
function getCurrentUserInfo(customIdentifier) {
    if (!customIdentifier || !customIdentifier.userId) {
        return "Unknown user";
    }
    
    return `User ID: ${customIdentifier.userId}, Role: ${customIdentifier.role || 'standard'}`;
}

// Create tools with a mix of different needs
const tools = new Tools();

// Regular tool without customIdentifier
tools.register(addNumbers);

// Tool with multiple parameters that accepts customIdentifier
tools.register({
    func: formatUserData,
    acceptsCustomIdentifier: true,
    description: "Format user data with optional age depending on permissions",
    parameters: {
        firstName: {
            type: "string",
            description: "User's first name"
        },
        lastName: {
            type: "string",
            description: "User's last name"
        },
        age: {
            type: "number",
            description: "User's age"
        }
    }
});

// Tool that only needs customIdentifier
tools.register({
    func: getCurrentUserInfo,
    acceptsCustomIdentifier: true,
    description: "Get information about the current user",
    parameters: {}
});

// Test direct tool calls with and without customIdentifier
console.log("=== Direct Tool Call Tests ===");

// Test regular tool (no customIdentifier)
console.log("addNumbers(2, 3):", tools.call("addNumbers", { a: 2, b: 3 }));

// Test tool with parameters + customIdentifier
console.log("formatUserData with full access:", 
    await tools.call("formatUserData", 
        { firstName: "John", lastName: "Doe", age: 30 }, 
        { permissions: { fullAccess: true }}
    )
);

console.log("formatUserData without full access:", 
    await tools.call("formatUserData", 
        { firstName: "John", lastName: "Doe", age: 30 }, 
        { permissions: { fullAccess: false }}
    )
);

// Test tool that relies only on customIdentifier
console.log("getCurrentUserInfo with customIdentifier:", 
    await tools.call("getCurrentUserInfo", {}, { userId: "user123", role: "admin" })
);

console.log("getCurrentUserInfo without customIdentifier:", 
    await tools.call("getCurrentUserInfo", {}, null)
);

// Create a ChatBot with customIdentifier
const chatbot = new ChatBot({
    systemMessage: "You are a helpful assistant that can work with user data.",
    tools: tools,
    model: "gpt-4o-mini",
    customIdentifier: {
        userId: "user123",
        role: "admin",
        permissions: {
            fullAccess: true
        }
    }
});

// Test calling tools through the chatbot
console.log("\n=== ChatBot Tool Call Tests ===");
console.log("Sending message to get user info and format data...");

// This message should trigger both types of tools - with and without customIdentifier
const response = await chatbot.sendMessage(
    "Add 5 and 7. Also, format the user data for Jane Smith, age 28. " +
    "Finally, tell me about the current user."
);

console.log("Response:", response);

// Test changing customIdentifier
chatbot.setCustomIdentifier({
    userId: "user456",
    role: "standard",
    permissions: {
        fullAccess: false
    }
});

console.log("\nAfter updating customIdentifier (should show standard user, no age)...");
const response2 = await chatbot.sendMessage(
    "Add 5 and 7. Also, format the user data for Jane Smith, age 28. " +
    "Finally, tell me about the current user."
);

console.log("Response:", response2);

// Test edge case with missing parameters
console.log("\n=== Edge Case Tests ===");
console.log("Testing with missing parameters:");
try {
    await tools.call("formatUserData", { firstName: "Missing" }, { permissions: { fullAccess: true }});
} catch (error) {
    console.log("Error handled successfully:", error.message);
}

// Test what happens when customIdentifier is expected but not provided
console.log("\nTesting when customIdentifier is expected but not provided:");
const missingIdentifierResult = await tools.call("getCurrentUserInfo", {});
console.log("Result:", missingIdentifierResult);

console.log("\nEdge case tests completed."); 