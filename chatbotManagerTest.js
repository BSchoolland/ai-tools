import { Tools, ChatbotManager } from './dist/esm/index.js';

// Create a tool that uses customIdentifier
function getUserTimeZone(customIdentifier = null) {
    if (!customIdentifier || !customIdentifier.timezone) {
        return "No timezone configured for this user";
    }
    return `This user's timezone is: ${customIdentifier.timezone}`;
}

// Create a tool that requires user permission stored in customIdentifier
function getAdminInfo(customIdentifier = null) {
    if (!customIdentifier || !customIdentifier.permissions || !customIdentifier.permissions.isAdmin) {
        return "Access denied: Admin privileges required";
    }
    return "Sensitive admin information: System load is 42%, 7 users online";
}

// Setup tools
const tools = new Tools();

// Register tools that use customIdentifier
tools.register({
    func: getUserTimeZone,
    acceptsCustomIdentifier: true,
    description: "Get the user's configured timezone",
    parameters: {}
});

tools.register({
    func: getAdminInfo,
    acceptsCustomIdentifier: true,
    description: "Get admin-only system information",
    parameters: {}
});

// Create a chatbot manager
const manager = new ChatbotManager({
    model: "gpt-4o-mini",
    tools: tools,
    systemMessage: "You are an assistant that can provide user-specific information. Use the available tools to help users.",
    customIdentifier: {
        // Default customIdentifier for all chatbots
        timezone: "UTC",
        permissions: {
            isAdmin: false
        }
    }
});

// Test function to create different conversations with different customIdentifiers
async function testWithDifferentUsers() {
    console.log("=== Testing ChatbotManager with customIdentifier ===\n");
    
    // Create a conversation for a regular user with a specific timezone
    const regularUser = await manager.getConversation({
        conversationID: "user_123",
        customIdentifier: {
            timezone: "America/New_York",
            permissions: {
                isAdmin: false
            },
            userId: "user_123"
        }
    });
    
    // Create a conversation for an admin user
    const adminUser = await manager.getConversation({
        conversationID: "admin_456",
        customIdentifier: {
            timezone: "Europe/London",
            permissions: {
                isAdmin: true
            },
            userId: "admin_456"
        }
    });
    
    // Test regular user access
    console.log("Regular User (user_123) - Timezone Request:");
    const regularTimezoneResponse = await regularUser.sendMessage("What's my timezone?");
    console.log(regularTimezoneResponse);
    
    console.log("\nRegular User (user_123) - Admin Info Request:");
    const regularAdminResponse = await regularUser.sendMessage("Show me admin information");
    console.log(regularAdminResponse);
    
    // Test admin user access
    console.log("\nAdmin User (admin_456) - Timezone Request:");
    const adminTimezoneResponse = await adminUser.sendMessage("What's my timezone?");
    console.log(adminTimezoneResponse);
    
    console.log("\nAdmin User (admin_456) - Admin Info Request:");
    const adminInfoResponse = await adminUser.sendMessage("Show me admin information");
    console.log(adminInfoResponse);
    
    // Update a user's customIdentifier during a conversation
    console.log("\n=== Updating customIdentifier mid-conversation ===");
    console.log("Promoting regular user to admin...");
    
    manager.setCustomIdentifier("user_123", {
        timezone: "America/New_York",
        permissions: {
            isAdmin: true  // Now they're an admin
        },
        userId: "user_123"
    });
    
    // Now the regular user should have admin access
    console.log("\nRegular User (now admin) - Admin Info Request:");
    const updatedRegularAdminResponse = await regularUser.sendMessage("Show me admin information again");
    console.log(updatedRegularAdminResponse);
    
    console.log("\nTest completed.");
}

// Run the test
testWithDifferentUsers().catch(console.error); 