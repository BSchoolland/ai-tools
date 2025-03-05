import { Tools } from "./tools.js";
import { History } from "../utils/history.js";
import { validateOptions } from "./validateOptions.js";
import { openAiModels } from "./config.js";
import { openAiToolLoop } from "./toolLoop.js";

/**
 * Assigns a task to an AI agent.
 * 
 * @param {Object} options - The options for the agent task.
 * @param {string} options.message - The user message to the agent.
 * @param {string} [options.systemMessage=""] - The system message to set the context for the agent.
 * @param {string} [options.model="gpt-4o-mini"] - The model to use for the agent.
 * @param {Tools} [options.tools=[]] - The tools that the agent can use.
 * @param {string} [options.apiKey] - The API key for authentication. If not provided, it will use the OPENAI_API_KEY environment variable.
 * @param {number} [options.maxToolCalls=25] - A limit on the number of tool calls the agent can make.
 * @param {number} [options.maxHistory=100] - The number of messages that can be stored in the conversation history.
 * @returns {string} - The response message from the agent.
 * @throws {Error} - Throws an error if the API call fails
 */
async function doAgentTask(options) {
    const defaults = {
        message: "",
        systemMessage: "",
        model: "gpt-4o-mini",
        tools: new Tools(),
        apiKey: null,
        maxToolCalls: 25,
        maxHistory: 100
    };
    const required = ["message", "tools"];
    const settings = { ...defaults, ...options };
    validateOptions(settings, new Set(Object.keys(defaults)), required);

    let { message, systemMessage, tools, model, apiKey, maxToolCalls, maxHistory } = settings;
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const history = new History();
    history.setSystemMessage(systemMessage);
    history.addMessage({ role: "user", content: message });

    // add a "mark complete" tool to the tools

    // add a "mark complete" tool to the tools
    let done = false;
    let failed = false;
    function markComplete() {
        done = true;
        return "Task completed, you may now reply to the user.";
    }
    function markFailed() {
        failed = true;
        done = true;
        return "Task failed, you may now reply to the user.";
    }
    const markCompleteTool = {
        func: markComplete,
        description: "Mark the task as complete.  This MUST be done before responding to the user.",
        parameters: {}
    }
    const markFailedTool = {
        func: markFailed,
        description: "Mark the task as failed",
        parameters: {}
    }
    tools.register(markCompleteTool);
    tools.register(markFailedTool);
    // if the model is an openai model, use the openai call function
    while (!done) {
        if (openAiModels.includes(model)) {
            let response = await openAiToolLoop({
                history: history,
                tools: tools,
                model: model,
                apiKey: apiKey,
                maxToolCalls: maxToolCalls,
                maxHistory: maxHistory
            });
            if (response.timedOut && !done) {
                // if the tool loop timed out and the task is not done, we need to mark the task as failed
                failed = true;
                done = true;
                return response.message;
            }
            if (!done) {
                history.addMessage({ role: "user", content: "Message to user blocked: you must complete the task (preferred) or mark it as failed before responding to the user.  \n(The user will not see this message, so you'll need to repeat yourself if your last message included important information.)" });
            } else {
                return response.message;
            }
        } else {
            done = true;
            throw new Error(`Model ${model} is not supported`);
        }
    }
}

export { doAgentTask };