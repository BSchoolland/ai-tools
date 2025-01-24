// class for handling conversation history

class History {
    constructor(history = []) {
        this.history = history;
    }

    // add a message to the history
    addMessage(message) {
        this.history.push(message);
    }

    // get the history with an optional maxMessages parameter
    getHistory(maxMessages) {
        
        // if there is no maxMessages parameter, return the entire history
        if (maxMessages === undefined) {
            return this.history;
        }
        
        let sliced = this.history.slice(-(maxMessages - 1));
        
        // Restore the system message if it is the first message and has been removed
        if (this.history.length > 0 && this.history[0].role === "system" && (!sliced[0] || sliced[0].role !== "system")) {
            sliced.unshift(this.history[0]);
        }
        
        return sliced;
    }

    // get last message
    getLastMessage() {
        const lastMessage = this.history.length > 0 ? this.history[this.history.length - 1] : null;
        return lastMessage;
    }

    setSystemMessage(message) {
        
        // if history is empty or first message isn't a system message, add the system message at the beginning
        if (this.history.length === 0 || this.history[0].role !== "system") {
            this.history.unshift({ role: "system", content: message });
        } else {
            this.history[0].content = message;
        }
        
    }
}

export { History };