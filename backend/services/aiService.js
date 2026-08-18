const { GoogleGenAI, Type, Schema } = require('@google/genai');

// Split the comma-separated API keys into an array, falling back to GEMINI_API_KEY if present
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k);

if (apiKeys.length === 0) {
    console.warn("WARNING: No GEMINI_API_KEYS provided in environment variables.");
}

let currentKeyIndex = 0;

function getAiClient() {
    if (apiKeys.length === 0) throw new Error("No API keys available.");
    return new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex] });
}

async function evaluateCode(code, language, question) {
    const prompt = `
        You are a programming test evaluator. 
        Evaluate the following code written in ${language}.
        
        Question Title: ${question.title}
        Description: ${question.description}
        Input Format: ${question.inputFormat}
        Output Format: ${question.outputFormat}
        Constraints: ${question.constraints}
        
        Sample Input:
        ${question.sampleInput}
        
        Expected Sample Output:
        ${question.sampleOutput}
        
        Hidden Input 1:
        ${question.hiddenInput1}
        
        Expected Hidden Output 1:
        ${question.hiddenOutput1}
        
        Hidden Input 2:
        ${question.hiddenInput2}
        
        Expected Hidden Output 2:
        ${question.hiddenOutput2}
        
        User Code:
        ${code}
        
        Does the code correctly solve the problem and pass the sample test case and BOTH hidden test cases?
        Provide the output for both test cases.
        `;

    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sampleTestPassed: {
                    type: Type.BOOLEAN,
                    description: "True if the sample test passed, False otherwise"
                },
                sampleOutputStr: {
                    type: Type.STRING,
                    description: "The actual output of the code for the sample test case"
                },
                hiddenTestPassed: {
                    type: Type.BOOLEAN,
                    description: "True if BOTH hidden test cases passed, False otherwise"
                },
                hiddenOutputStr: {
                    type: Type.STRING,
                    description: "The actual output of the code for the hidden test cases, or an explanation of which hidden test failed"
                },
                compilerError: {
                    type: Type.STRING,
                    description: "Any compiler or runtime error message, if applicable. Leave empty if none."
                }
            },
            required: ["sampleTestPassed", "sampleOutputStr", "hiddenTestPassed", "hiddenOutputStr", "compilerError"]
        }
    };

    let resultText = null;
    let lastError = null;

    // Try up to the number of available API keys
    const attempts = Math.max(1, apiKeys.length);
    for (let i = 0; i < attempts; i++) {
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
                config: config
            });
            resultText = response.text;
            break; // Success, exit retry loop
        } catch (error) {
            console.error(`API Key ${currentKeyIndex + 1} failed:`, error.message);
            lastError = error;
            // Switch to the next key
            if (apiKeys.length > 0) {
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                console.log(`Switching to API Key ${currentKeyIndex + 1}...`);
            }
        }
    }

    if (!resultText) {
        console.error("All API keys failed. Last error:", lastError);
        return {
            sampleTestPassed: false,
            sampleOutputStr: "",
            hiddenTestPassed: false,
            hiddenOutputStr: "",
            compilerError: "Failed to evaluate code using AI service. APIs exhausted. Error: " + (lastError ? lastError.message : 'Unknown error')
        };
    }
    
    try {
        return JSON.parse(resultText);
    } catch (parseError) {
        console.error("Failed to parse AI response:", resultText);
        return {
            sampleTestPassed: false,
            sampleOutputStr: "",
            hiddenTestPassed: false,
            hiddenOutputStr: "",
            compilerError: "AI returned an invalid response format."
        };
    }
}

module.exports = {
    evaluateCode
};
