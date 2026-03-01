// src/controllers/aiController.js
const axios = require('axios');
const { earnCoins, getNum } = require('../services/economyService');

// Địa chỉ của Server Python (đang chạy ở cổng 5000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

// 1. Chức năng Chấm bài Writing
exports.checkWriting = async (req, res) => {
    try {
        const { text, topic } = req.body;

        // Gọi sang Python
        const response = await axios.post(`${AI_SERVICE_URL}/api/writing/check`, { text, topic });

        // Cộng Coins sau khi nộp bài (nếu user đã đăng nhập)
        let coinResult = null;
        if (req.userId) {
            const reward = await getNum('economy_reward_writing', 40);
            coinResult = await earnCoins(req.userId, 'writing', reward);
        }

        res.json({ ...response.data, coinResult });

    } catch (error) {
        console.error("Lỗi gọi AI Writing:", error.message);
        res.status(500).json({ error: "AI Server đang bận hoặc bị lỗi." });
    }
};

// 2. Chức năng Chấm bài Speaking
exports.checkSpeaking = async (req, res) => {
    try {
        let response;
        if (req.file) {
            // Upload file tới Python
            const FormData = require('form-data');
            const form = new FormData();
            form.append('audio', req.file.buffer, {
                filename:    req.file.originalname || 'audio.mp3',
                contentType: req.file.mimetype || 'audio/mpeg',
            });
            response = await axios.post(`${AI_SERVICE_URL}/api/speaking/check`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });
        } else {
            return res.status(400).json({ error: "Cần upload file audio." });
        }

        // Cộng Coins sau khi nộp bài
        let coinResult = null;
        if (req.userId) {
            const reward = await getNum('economy_reward_speaking', 50);
            coinResult = await earnCoins(req.userId, 'speaking', reward);
        }

        res.json({ ...response.data, coinResult });

    } catch (error) {
        console.error("Lỗi gọi AI Speaking:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi." });
    }
};

// 3. Chức năng Gợi ý Lộ trình
exports.getRecommendation = async (req, res) => {
    try {
        // Lấy điểm số từ Body (hoặc sau này lấy từ Database của User)
        const { grammar, vocab, speaking } = req.body;

        // Gọi sang Python
        const response = await axios.post(`${AI_SERVICE_URL}/api/recommend`, {
            grammar, vocab, speaking
        });

        res.json(response.data);

    } catch (error) {
        console.error("Lỗi gọi AI Recommendation:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi." });
    }
};