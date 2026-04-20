// src/controllers/aiController.js
const axios = require('axios');
const aiService = require('../services/aiService');
const { earnCoins, getNum, getPetState } = require('../services/economyService');
const Pet = require('../models/Pet');
const LessonProgress = require('../models/LessonProgress');
const { updatePlanTaskStatus } = require('./LearningController');

// Địa chỉ của Server Python (đang chạy ở cổng 5000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';
const writingTaskMeta = new Map();

function extractWritingScore(result) {
    if (!result || typeof result !== 'object') return 0;
    if (Number.isFinite(result.overall_score)) return Number(result.overall_score);
    if (Number.isFinite(result?.scoring?.overall)) return Number(result.scoring.overall) * 10;
    if (Number.isFinite(result?.scoring?.band)) return Number(result.scoring.band) * 10;
    return 0;
}

/** Helper: lấy trạng thái pet của user hiện tại */
async function getUserPetState(userId) {
    if (!userId) return { status: 'neutral', expMultiplier: 1, expLocked: false };
    const pet = await Pet.findOne({ user: userId });
    if (!pet || !pet.hatched) return { status: 'neutral', expMultiplier: 1, expLocked: false };
    return getPetState(pet);
}

// 1a. Chức năng Chấm bài Writing PRO (Hệ thống Async mới)
exports.evaluateWriting = async (req, res) => {
    try {
        const { text, topic, promptId, timeSpentSec = 0 } = req.body;
        const userId = req.userId;

        // KIỂM TRA QUOTA
        const quota = await aiService.checkQuota(userId, 'writing');
        if (!quota.allowed) {
            return res.status(403).json({ error: quota.reason });
        }

        // Gọi sang server Python để bắt đầu Task
        const response = await axios.post(`${AI_SERVICE_URL}/api/ai/writing/evaluate`, { 
            text, topic 
        });

        if (response.data?.task_id && userId) {
            writingTaskMeta.set(String(response.data.task_id), {
                userId,
                promptId: promptId || null,
                timeSpentSec: Math.max(0, Number(timeSpentSec) || 0),
            });
        }

        // Ghi nhận lượt sử dụng ngay khi bắt đầu (hoặc sau khi hoàn thành tùy logic)
        await aiService.incrementUsage(userId, 'writing');

        res.status(202).json(response.data);

    } catch (error) {
        console.error("Lỗi khởi tạo Writing Pro:", error.message);
        res.status(500).json({ error: "Không thể kết nối AI Server." });
    }
};

// 1b. Kiểm tra trạng thái Task chấm bài
exports.getWritingStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { promptId, timeSpentSec = 0 } = req.query;
        const response = await axios.get(`${AI_SERVICE_URL}/api/ai/writing/status/${taskId}`);
        const taskMeta = writingTaskMeta.get(String(taskId));
        const effectivePromptId = promptId || taskMeta?.promptId || null;
        const effectiveUserId = req.userId || taskMeta?.userId;
        const effectiveTimeSpent = Math.max(
            0,
            Number(timeSpentSec) || Number(taskMeta?.timeSpentSec) || 0
        );
        
        // If task completed and we have promptId, trigger roadmap sync
        if (response.data?.status === 'completed') {
            if (effectivePromptId && effectiveUserId) {
                await updatePlanTaskStatus(effectiveUserId, effectivePromptId, 'completed');

                const score = Math.min(100, Math.max(0, extractWritingScore(response.data?.result)));
                await LessonProgress.findOneAndUpdate(
                    { userId: effectiveUserId, writingPromptId: effectivePromptId },
                    {
                        $set: {
                            score,
                            completedAt: new Date(),
                            rewarded: true,
                        },
                        $inc: {
                            attemptCount: 1,
                            timeSpentSec: effectiveTimeSpent,
                        },
                    },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true,
                    }
                );
            }
            writingTaskMeta.delete(String(taskId));
        } else if (response.data?.status === 'failed') {
            writingTaskMeta.delete(String(taskId));
        }
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy trạng thái Task." });
    }
};

// 1c. Sinh bài mẫu (Streaming Proxy)
exports.generateModelEssay = async (req, res) => {
    try {
        const { topic, essay } = req.body;
        
        // Thiết lập header cho streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        const response = await axios({
            method: 'post',
            url: `${AI_SERVICE_URL}/api/ai/writing/model-essay`,
            data: { topic, essay },
            responseType: 'stream'
        });

        response.data.pipe(res);

    } catch (error) {
        console.error("Lỗi Proxy Model Essay:", error.message);
        res.status(500).end("AI Server Error");
    }
};

// 1. Chức năng Chấm bài Writing (Route cũ - đồng bộ)
exports.checkWriting = async (req, res) => {
    try {
        const { text, topic, promptId, timeSpentSec = 0 } = req.body;
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

        // Gọi sang Python Writing Pro (Master Pipeline)
        const response = await axios.post(`${AI_SERVICE_URL}/api/ai/writing/evaluate`, { 
            text, 
            topic,
            mode: quota.mode 
        });

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'writing');

        // Sync with Roadmap V4.0 (if promptId provided)
        if (promptId) {
            await updatePlanTaskStatus(userId, promptId, 'completed');

            const score = Math.min(100, Math.max(0, extractWritingScore(response.data)));
            await LessonProgress.findOneAndUpdate(
                { userId, writingPromptId: promptId },
                {
                    $set: {
                        score,
                        completedAt: new Date(),
                        rewarded: true,
                    },
                    $inc: {
                        attemptCount: 1,
                        timeSpentSec: Math.max(0, Number(timeSpentSec) || 0),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            );
        }

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
            form.append('mode', quota.mode);

            // Xử lý stream
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            response = await axios.post(`${AI_SERVICE_URL}/api/speaking/check-stream`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                responseType: 'stream'
            });
        } else {
            return res.status(400).json({ error: "Cần upload file audio." });
        }

        // Ghi nhận lượt sử dụng
        await aiService.incrementUsage(userId, 'speaking');

        // Khởi tạo biến để gom data stream
        let finalDeepAnalysis = null;
        let finalOverallScore = 0;
        let isDone = false;

        response.data.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            res.write(chunkStr);
            
            // Thử trích xuất điểm số từ luồng dữ liệu 
            // format: event: deep_analysis\ndata: { ... }\n\n
            try {
                const lines = chunkStr.split('\n');
                let itIsDeepAnalysis = false;
                for (let line of lines) {
                    if (line.startsWith('event: deep_analysis') || line.startsWith('event: quick_score')) {
                        itIsDeepAnalysis = true;
                    }
                    if (itIsDeepAnalysis && line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed && typeof parsed === 'object') {
                                if (parsed.overall_score) {
                                  finalOverallScore = Number(parsed.overall_score);
                                  finalDeepAnalysis = parsed;
                                } else if (parsed.scores?.overall) {
                                  finalOverallScore = Number(parsed.scores.overall);
                                  finalDeepAnalysis = parsed;
                                }
                            }
                        } catch (e) {}
                        itIsDeepAnalysis = false;
                    }
                }
            } catch (err) {}
        });

        response.data.on('end', async () => {
            if (isDone) return;
            isDone = true;

            // Sync with Roadmap V4.0
            if (req.body.speakingId) {
                await updatePlanTaskStatus(userId, req.body.speakingId, 'completed');
            }
            if (req.body.question_id) {
                await updatePlanTaskStatus(userId, req.body.question_id, 'completed');
            }

            const speakingItemId = req.body.question_id || req.body.speakingId || null;
            const timeSpentSec = Math.max(0, Number(req.body.timeSpentSec) || 0);

            if (speakingItemId && userId) {
                try {
                    const score = finalOverallScore > 0
                        ? Math.min(100, Math.max(0, Math.round(finalOverallScore * 10)))
                        : 0;

                    await LessonProgress.create({
                        userId,
                        speakingId: speakingItemId,
                        score,
                        timeSpentSec,
                        completedAt: new Date(),
                        rewarded: true,
                    });
                } catch (saveErr) {}
            }

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

            // Gửi event cuối kèm theo coin info
            const finalEventPayload = {
                ok: true,
                coinResult,
                petState,
                quotaRemaining: quota.remaining - 1,
                engine: quota.mode
            };
            res.write(`event: database_done\ndata: ${JSON.stringify(finalEventPayload)}\n\n`);
            res.end();
        });

        response.data.on('error', (err) => {
           console.error("Stream error in proxy:", err);
           res.end();
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
            // Gửi thêm history và voice nếu có
            if (req.body.history) {
                form.append('history', req.body.history);
            }
            if (req.body.voice) {
                form.append('voice', req.body.voice);
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
        const { voice } = req.query;
        const url = voice ? `${AI_SERVICE_URL}/api/speaking/start?voice=${voice}` : `${AI_SERVICE_URL}/api/speaking/start`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi lấy câu chào AI:", error.message);
        res.status(500).json({ error: "AI Server không phản hồi câu chào." });
    }
};


