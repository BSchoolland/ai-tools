// a class that manages a fleet of chatbots, each of which communicates with a different user
import { ChatBot } from "./chatbot.js";
import { Tools } from "./tools.js";

class ChatbotType {
    constructor(model, tools, systemMessage, customIdentifier = null) {
        this.model = model;
        this.tools = tools;
        this.systemMessage = systemMessage;
        this.customIdentifier = customIdentifier;
    }
}

class Conversation {
    constructor(conversationID, chatbotType = null, existingChatbot = null, saveCallback = null) {
        if (!chatbotType && !existingChatbot) {
            throw new Error("Either chatbotType or existingChatbot must be provided");
        }
        this.conversationID = conversationID;
        this.chatbotType = chatbotType;
        this.chatbot = existingChatbot || new ChatBot({
            model: chatbotType.model,
            tools: chatbotType.tools,
            systemMessage: chatbotType.systemMessage,
            customIdentifier: chatbotType.customIdentifier
        });
        this.saveCallback = saveCallback;
        this.lastUpdateTime = Date.now();
    }

    async sendMessage(message) {
        const response = await this.chatbot.sendMessage(message);
        this.lastUpdateTime = Date.now(); // Update the timestamp after interaction
        this.save();
        return response;
    }

    // Set a new customIdentifier for this conversation's chatbot
    setCustomIdentifier(customIdentifier) {
        if (this.chatbot) {
            this.chatbot.setCustomIdentifier(customIdentifier);
        }
    }

    async save() {
        // save the conversation to the database
        if (this.saveCallback) {
            await this.saveCallback(this.conversationID, this.chatbot.getHistory());
            return true;
        } else {
            return false;
        }
    }

    async checkTTL(TTL) {
        // if the conversation has not been updated in the last TTL milliseconds, save it then instruct the chatbot manager to delete it
        if (Date.now() - this.lastUpdateTime > TTL) { 
            await this.save(); // initiate a save
            return true;
        } else { // otherwise, return false
            return false;
        }
    }

    getHistory() {
        return this.chatbot.getHistory();
    }
}

class ChatbotManager {
    constructor({
        model = "gpt-4o-mini",
        tools = new Tools(),
        systemMessage = "",
        customIdentifier = null,
        saveCallback = null,
        loadCallback = null,
        conversationTTL = 1000 * 60 * 60 * 24 * 30, // 30 days
        checkInterval = 1000 * 60 * 60 * 24 // 1 day
    }) {
        this.conversations = {};
        this.defaultChatbotType = new ChatbotType(model, tools, systemMessage, customIdentifier);
        this.saveCallback = saveCallback;
        this.loadCallback = loadCallback;
        this.conversationTTL = conversationTTL;
        // set up a timer to check the TTL of all conversations
        this.checkInterval = setInterval(() => this.cleanExpiredConversations(), checkInterval);
    }

    async cleanExpiredConversations() {
        try {
            const entries = Object.entries(this.conversations);
            const results = await Promise.all(
                entries.map(async ([conversationID, conversation]) => {
                    const isExpired = await conversation.checkTTL(this.conversationTTL);
                    return { conversationID, isExpired };
                })
            );

            results.forEach(({ conversationID, isExpired }) => {
                if (isExpired) {
                    delete this.conversations[conversationID];
                }
            });
        } catch (error) {
            console.error('Error cleaning expired conversations:', error);
        }
    }

    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    // get or create a conversation with a user
    async getConversation(
        {
            conversationID, 
            chatbotType = this.defaultChatbotType,
            model = null,
            tools = null,
            systemMessage = null,
            customIdentifier = null,
            existingChatbot = null,
            saveCallback = this.saveCallback,
        }
    ) {
        // If conversation exists, update last access time and return it
        if (this.conversations[conversationID]) {
            this.conversations[conversationID].lastUpdateTime = Date.now();
            
            // If a new customIdentifier is provided, update the existing conversation
            if (customIdentifier !== null) {
                this.conversations[conversationID].setCustomIdentifier(customIdentifier);
            }
            
            return this.conversations[conversationID];
        }

        // If we have a load callback, try to load an existing conversation
        if (this.loadCallback && !existingChatbot) {
            try {
                const savedHistory = await this.loadCallback(conversationID);
                if (savedHistory) {
                    // Create a chatbot with the loaded history
                    const loadedChatbot = new ChatBot({
                        model: model || chatbotType.model,
                        tools: tools || chatbotType.tools,
                        history: savedHistory,
                        customIdentifier: customIdentifier || chatbotType.customIdentifier
                    });
                    existingChatbot = loadedChatbot;
                }
            } catch (error) {
                console.error(`Error loading conversation for user ${conversationID}:`, error);
                // Continue with creating a new conversation
            }
        }

        if (existingChatbot) { // if an existing chatbot is provided, use it
            this.conversations[conversationID] = new Conversation(conversationID, null, existingChatbot, saveCallback);
        } else if (model || tools || systemMessage || customIdentifier) { // if any custom parameters are provided, create a new chatbot type for this conversation
            const customChatbotType = new ChatbotType(
                model || this.defaultChatbotType.model,
                tools || this.defaultChatbotType.tools,
                systemMessage || this.defaultChatbotType.systemMessage,
                customIdentifier || this.defaultChatbotType.customIdentifier
            );
            this.conversations[conversationID] = new Conversation(conversationID, customChatbotType, null, saveCallback);
        } else { // otherwise, use the default chatbot type
            this.conversations[conversationID] = new Conversation(conversationID, chatbotType, null, saveCallback);
        }
        return this.conversations[conversationID];
    }

    // Set a new customIdentifier for a specific conversation
    setCustomIdentifier(conversationID, customIdentifier) {
        if (this.conversations[conversationID]) {
            this.conversations[conversationID].setCustomIdentifier(customIdentifier);
            return true;
        }
        return false;
    }

    // Save all active conversations
    async saveAllConversations() {
        const savePromises = Object.values(this.conversations).map(conversation => conversation.save());
        await Promise.all(savePromises);
    }

    // Remove a conversation from memory (after saving it)
    async removeConversation(conversationID) {
        if (this.conversations[conversationID]) {
            await this.conversations[conversationID].save();
            delete this.conversations[conversationID];
            return true;
        }
        return false;
    }

    // Get stats about current conversations
    getStats() {
        const count = Object.keys(this.conversations).length;
        const oldestTimestamp = Math.min(
            ...Object.values(this.conversations).map(conv => conv.lastUpdateTime)
        );
        const newestTimestamp = Math.max(
            ...Object.values(this.conversations).map(conv => conv.lastUpdateTime)
        );
        
        return {
            activeConversations: count,
            oldestInteraction: new Date(oldestTimestamp),
            newestInteraction: new Date(newestTimestamp)
        };
    }
}

export { ChatbotManager };