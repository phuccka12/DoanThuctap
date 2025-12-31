require('dotenv').config(); // Để đọc file .env
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const connectDB = require('./src/config/db');

// Import routes
const aiRoutes = require('./src/routes/aiRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Import CMS public routes
const topicRoutes = require('./src/routes/Public/PublicTopics');
const writingPromptRoutes = require('./src/routes/Public/PublicWritingPrompts');
const speakingQuestionRoutes = require('./src/routes/Public/PublicSpeakingQuestions');

// Import CMS admin routes
const adminTopicRoutes = require('./src/routes/Admin/AdminTopics');
const adminWritingPromptRoutes = require('./src/routes/Admin/AdminWritingPrompts');
const adminSpeakingQuestionRoutes = require('./src/routes/Admin/AdminSpeakingQuestions');

// Khởi tạo app
const app = express();

// Kết nối DB
connectDB();

// Trust proxy
app.set("trust proxy", 1);

// Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: true,          // hoặc set domain frontend cụ thể
    credentials: true,     // QUAN TRỌNG để gửi/nhận cookie
  })
);

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Public CMS routes
app.use('/api/topics', topicRoutes);
app.use('/api/writing-prompts', writingPromptRoutes);
app.use('/api/speaking-questions', speakingQuestionRoutes);

// Admin CMS routes
app.use('/api/admin/topics', adminTopicRoutes);
app.use('/api/admin/writing-prompts', adminWritingPromptRoutes);
app.use('/api/admin/speaking-questions', adminSpeakingQuestionRoutes);



app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT=process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});   