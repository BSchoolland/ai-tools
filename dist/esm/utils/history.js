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
    if (maxMessages === void 0) {
      return this.history;
    }
    let sliced = this.history.slice(-(maxMessages - 1));
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
    if (this.history.length === 0 || this.history[0].role !== "system") {
      this.history.unshift({ role: "system", content: message });
    } else {
      this.history[0].content = message;
    }
  }
}
export {
  History
};
