import { ChatBot } from "./chatbot.js";
import { Tools } from "./tools.js";
class ChatbotType {
  constructor(model, tools, systemMessage) {
    this.model = model;
    this.tools = tools;
    this.systemMessage = systemMessage;
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
      systemMessage: chatbotType.systemMessage
    });
    this.saveCallback = saveCallback;
    this.lastUpdateTime = Date.now();
  }
  async sendMessage(message) {
    const response = await this.chatbot.sendMessage(message);
    this.lastUpdateTime = Date.now();
    this.save();
    return response;
  }
  async save() {
    if (this.saveCallback) {
      await this.saveCallback(this.conversationID, this.chatbot.getHistory());
      return true;
    } else {
      return false;
    }
  }
  async checkTTL(TTL) {
    if (Date.now() - this.lastUpdateTime > TTL) {
      await this.save();
      return true;
    } else {
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
    saveCallback = null,
    loadCallback = null,
    conversationTTL = 1e3 * 60 * 60 * 24 * 30,
    // 30 days
    checkInterval = 1e3 * 60 * 60 * 24
    // 1 day
  }) {
    this.conversations = {};
    this.defaultChatbotType = new ChatbotType(model, tools, systemMessage);
    this.saveCallback = saveCallback;
    this.loadCallback = loadCallback;
    this.conversationTTL = conversationTTL;
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
      console.error("Error cleaning expired conversations:", error);
    }
  }
  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
  // get or create a conversation with a user
  async getConversation({
    conversationID,
    chatbotType = this.defaultChatbotType,
    model = null,
    tools = null,
    systemMessage = null,
    existingChatbot = null,
    saveCallback = this.saveCallback
  }) {
    if (this.conversations[conversationID]) {
      this.conversations[conversationID].lastUpdateTime = Date.now();
      return this.conversations[conversationID];
    }
    if (this.loadCallback && !existingChatbot) {
      try {
        const savedHistory = await this.loadCallback(conversationID);
        if (savedHistory) {
          const loadedChatbot = new ChatBot({
            model: model || chatbotType.model,
            tools: tools || chatbotType.tools,
            history: savedHistory
          });
          existingChatbot = loadedChatbot;
        }
      } catch (error) {
        console.error(`Error loading conversation for user ${conversationID}:`, error);
      }
    }
    if (existingChatbot) {
      this.conversations[conversationID] = new Conversation(conversationID, null, existingChatbot, saveCallback);
    } else if (model || tools || systemMessage) {
      const customChatbotType = new ChatbotType(
        model || this.defaultChatbotType.model,
        tools || this.defaultChatbotType.tools,
        systemMessage || this.defaultChatbotType.systemMessage
      );
      this.conversations[conversationID] = new Conversation(conversationID, customChatbotType, null, saveCallback);
    } else {
      this.conversations[conversationID] = new Conversation(conversationID, chatbotType, null, saveCallback);
    }
    return this.conversations[conversationID];
  }
  // Save all active conversations
  async saveAllConversations() {
    const savePromises = Object.values(this.conversations).map((conversation) => conversation.save());
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
      ...Object.values(this.conversations).map((conv) => conv.lastUpdateTime)
    );
    const newestTimestamp = Math.max(
      ...Object.values(this.conversations).map((conv) => conv.lastUpdateTime)
    );
    return {
      activeConversations: count,
      oldestInteraction: new Date(oldestTimestamp),
      newestInteraction: new Date(newestTimestamp)
    };
  }
}
export {
  ChatbotManager
};
