var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var history_exports = {};
__export(history_exports, {
  History: () => History
});
module.exports = __toCommonJS(history_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  History
});
