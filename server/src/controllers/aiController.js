// src/controllers/aiController.js
const axios = require('axios');
const aiService = require('../services/aiService');
const { earnCoins, getNum, getPetState } = require('../services/economyService');
const Pet = require('../models/Pet');

// Địa chỉ của Server Python (đang chạy ở cổng 5000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

/** Helper: lấy trạng thái pet của user hiện tại */
async function getUserPetState(userId) {
    if (!userId) return { status: 'neutral', expMultiplier: 1, expLocked: false };
    const pet = await Pet.findOne({ user: userId });
    if (!pet || !pet.hatched) return { status: 'neutral', expMultiplier: 1, expLocked: false };
    return getPetState(pet);
}

// 1. Chức năng Chấm bài Writing
exports.checkWriting = async (req, res) => {
    try {
        const { text, topic } = req.body;
        const userId = req.userId;

        // 🟢 KIỂM TRA QUOTA & QUYỀN TRUY CẬP
        const quota = await aiService.checkQuota(userId, 'writing');
        if (!quota.allowed) {
            return res.status(403).json({ 
                error: quota.reason, 
                code: 'QUOTA_EXCEEDED',
                limitReached: true 
            });
        }

        // Gọi sang Python kèm theo Mode (Online/Offline)
        const response = await axios.post(`${AI_SERVICE_URL}/api/writing/check`, { 
            text, 
            topic,
            mode: quota.mode // VIP: online, Standard: offline
        });

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'writing');

        // Cộng Coins + check expLocked
        let coinResult = null;
        let petState = null;
        if (userId) {
            petState = await getUserPetState(userId);
            if (petState.expLocked) {
                coinResult = { earned: 0, expLocked: true, message: 'Pet đang hấp hối! Hãy cứu pet để nhận EXP và Coins.' };
            } else {
                const reward = await getNum('economy_reward_writing', 40);
                const finalReward = Math.round(reward * petState.expMultiplier);
                coinResult = await earnCoins(userId, 'writing', finalReward);
                coinResult.expMultiplier = petState.expMultiplier;
                coinResult.expLocked = false;
            }
        }

        res.json({ 
            ...response.data, 
            coinResult, 
            petState,
            quotaRemaining: quota.remaining - 1,
            engine: quota.mode 
        });

    } catch (error) {
        console.error("Lỗi gọi AI Writing:", error.message);
        console.error("Error details:", error.response?.data || error);
        
        // Return error from Python if available, otherwise generic error
        const pythonError = error.response?.data?.error || error.message;
        res.status(500).json({ 
            error: `AI Server error: ${pythonError}`,
            details: error.response?.data 
        });
    }
};

// 2. Chức năng Chấm bài Speaking
exports.checkSpeaking = async (req, res) => {
    try {
        const userId = req.userId;
        
        // 🟢 KIỂM TRA QUOTA & QUYỀN TRUY CẬP
        const quota = await aiService.checkQuota(userId, 'speaking');
        if (!quota.allowed) {
            return res.status(403).json({ 
                error: quota.reason, 
                code: 'QUOTA_EXCEEDED',
                limitReached: true 
            });
        }

        let response;
        if (req.file) {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('audio', req.file.buffer, {
                filename: req.file.originalname || 'audio.mp3',
                contentType: req.file.mimetype || 'audio/mpeg',
            });
            // Gửi thêm mode sang Python
            form.append('mode', quota.mode);

            response = await axios.post(`${AI_SERVICE_URL}/api/speaking/check`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });
        } else {
            return res.status(400).json({ error: "Cần upload file audio." });
        }

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'speaking');

        // Cộng Coins + check expLocked
        let coinResult = null;
        let petState = null;
        if (userId) {
            petState = await getUserPetState(userId);
            if (petState.expLocked) {
                coinResult = { earned: 0, expLocked: true, message: 'Pet đang hấp hối! Hãy cứu pet để nhận EXP và Coins.' };
            } else {
                const reward = await getNum('economy_reward_speaking', 50);
                const finalReward = Math.round(reward * petState.expMultiplier);
                coinResult = await earnCoins(userId, 'speaking', finalReward);
                coinResult.expMultiplier = petState.expMultiplier;
                coinResult.expLocked = false;
            }
        }

        res.json({ 
            ...response.data, 
            coinResult, 
            petState,
            quotaRemaining: quota.remaining - 1,
            engine: quota.mode 
        });

    } catch (error) {
        console.error("Lỗi gọi AI Speaking:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi." });
    }
};

// 3. Chức năng Gợi ý Lộ trình
exports.getRecommendation = async (req, res) => {
    try {
        const { grammar, vocab, speaking } = req.body;
        const userId = req.userId;

        // 🟢 KIỂM TRA QUOTA (Dùng chung bộ đếm chat/recommendation)
        const quota = await aiService.checkQuota(userId, 'recommendation');
        if (!quota.allowed) {
            return res.status(403).json({ error: quota.reason });
        }

        // Gọi sang Python
        const response = await axios.post(`${AI_SERVICE_URL}/api/recommend`, {
            grammar, vocab, speaking
        });

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'recommendation');

        res.json(response.data);

    } catch (error) {
        console.error("Lỗi gọi AI Recommendation:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi." });
    }
};

// 4. Chức năng Hội thoại AI (Proxy)
exports.handleConversation = async (req, res) => {
    try {
        const userId = req.userId;

        // 🟢 KIỂM TRA QUOTA & QUYỀN TRUY CẬP (VIP Only)
        const quota = await aiService.checkQuota(userId, 'conversation');
        if (!quota.allowed) {
            return res.status(403).json({ 
                error: quota.reason, 
                code: 'VIP_ONLY',
                limitReached: true 
            });
        }

        let response;
        if (req.file) {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('audio', req.file.buffer, {
                filename: req.file.originalname || 'voice_input.wav',
                contentType: req.file.mimetype || 'audio/wav',
            });
            // Gửi thêm history nếu có
            if (req.body.history) {
                form.append('history', req.body.history);
            }

            response = await axios.post(`${AI_SERVICE_URL}/api/speaking/conversation`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });
        } else {
            return res.status(400).json({ error: "Cần upload file audio Hội thoại." });
        }

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'conversation');

        res.json(response.data);

    } catch (error) {
        console.error("Lỗi Hội thoại AI:", error.message);
        res.status(500).json({ error: "AI Server Hội thoại không phản hồi." });
    }
};

// 5. Chức năng Lấy câu chào đầu tiên (Proxy)
exports.getStartGreeting = async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/api/speaking/start`);
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi lấy câu chào AI:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi câu chào." });
    }
};


