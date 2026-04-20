const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const GEMINI_MODEL = 'gemini-2.5-flash';
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3'; // Hoặc model bạn đang cài local

let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Dịch vụ cung cấp AI tập trung hỗ trợ Fallback
 */
class AiProviderService {
    /**
     * Gọi Gemini AI với cơ chế tự động fallback sang Ollama nếu lỗi 429/503
     */
    async generateContent(prompt, options = {}) {
        const { useFallback = true, systemInstruction = "" } = options;

        try {
            if (!genAI) throw new Error('GEMINI_API_KEY_MISSING');

            const model = genAI.getGenerativeModel({ 
                model: GEMINI_MODEL,
                systemInstruction: systemInstruction 
            });

            console.log(`🌐 [AI PROVIDER] Calling Gemini (${GEMINI_MODEL})...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return {
                text: response.text(),
                source: 'gemini'
            };

        } catch (error) {
            const isQuotaError = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
            const isServiceError = error.status === 503 || error.message?.includes('503');

            if (useFallback && (isQuotaError || isServiceError)) {
                console.warn(`⚠️ [AI PROVIDER] Gemini hit limit (${error.status}). Attempting fallback to Ollama...`);
                return await this.callOllama(prompt, systemInstruction);
            }

            throw error;
        }
    }

    /**
     * Gọi Ollama (Local AI) làm dự phòng
     */
    async callOllama(prompt, systemInstruction = "") {
        try {
            const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser: ${prompt}` : prompt;
            
            const response = await axios.post(OLLAMA_URL, {
                model: OLLAMA_MODEL,
                prompt: fullPrompt,
                stream: false
            }, { timeout: 30000 });

            console.log(`✅ [AI PROVIDER] Fallback to Ollama successful.`);
            return {
                text: response.data.response,
                source: 'ollama'
            };
        } catch (ollamaError) {
            console.error(`❌ [AI PROVIDER] Ollama fallback failed:`, ollamaError.message);
            // Nếu cả 2 đều hỏng, ném lỗi gốc của Gemini ra để controller xử lý message
            throw new Error('AI_ALL_PROVIDERS_FAILED');
        }
    }
}

module.exports = new AiProviderService();
