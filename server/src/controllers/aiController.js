// src/controllers/aiController.js
const axios = require('axios');

// Địa chỉ của Server Python (đang chạy ở cổng 5000)
const AI_SERVICE_URL = 'http://127.0.0.1:5000';

// 1. Chức năng Chấm bài Writing
exports.checkWriting = async (req, res) => {
    try {
        const { text } = req.body;

        // Gọi sang Python
        const response = await axios.post(`${AI_SERVICE_URL}/api/writing/check`, {
            text: text
        });

        // Python trả về gì thì gửi y nguyên cho Client
        res.json(response.data);

    } catch (error) {
        console.error("Lỗi gọi AI Writing:", error.message);
        res.status(500).json({ error: "AI Server đang bận hoặc bị lỗi." });
    }
};

// 2. Chức năng Chấm bài Speaking
exports.checkSpeaking = async (req, res) => {
    try {
        const { audioFile } = req.body; // hoặc req.file nếu upload file

        // Gọi sang Python (tạm thời trả về mock data)
        // Sau này sẽ implement Whisper để transcribe audio
        res.json({
            message: "Speaking check endpoint - Coming soon!",
            note: "Sẽ implement Whisper để chuyển audio thành text và chấm điểm"
        });

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