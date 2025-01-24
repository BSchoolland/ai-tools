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
        if (sliced[0].role !== "system" && this.history[0].role === "system") {
            sliced.unshift(this.history[0]);
        }
        return sliced;
    }

    // get last message
    getLastMessage() {
        return this.history[this.history.length - 1];
    }

    setSystemMessage(message) {
        // if the first message is a system message, edit it, otherwise add a new message at the beginning
        if (this.history[0].role === "system") {
            this.history[0].content = message;
        } else {
            this.history.unshift({ role: "system", content: message });
        }
    }
}

export { History };