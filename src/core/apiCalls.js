async function openAiCall(history, tools = [], model = "gpt-4o-mini", apiKey = null) {
    if (apiKey === null) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    const body = {
        model: model,
        messages: history
    };
    
    // Only add tools if they are provided and non-empty
    if (tools && tools.length > 0) {
        body.tools = tools;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error.message}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
    }

    const message = responseData.choices[0].message.content || '';
    const tool_calls = responseData.choices[0].message.tool_calls || null;
    return { message, tool_calls };
}

export { openAiCall };