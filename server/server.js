require('dotenv').config(); // Để đọc file .env
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('./src/config/passport');
const connectDB = require('./src/config/db');

// Import routes
const aiRoutes = require('./src/routes/aiRoutes');
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const onboardingRoutes = require('./src/routes/onboardingRoutes');

// Import CMS public routes
const topicRoutes = require('./src/routes/Public/PublicTopics');
const writingPromptRoutes = require('./src/routes/Public/PublicWritingPrompts');
const speakingQuestionRoutes = require('./src/routes/Public/PublicSpeakingQuestions');

// Import CMS admin routes
const adminTopicRoutes = require('./src/routes/Admin/AdminTopics');
const adminWritingPromptRoutes = require('./src/routes/Admin/AdminWritingPrompts');
const adminSpeakingQuestionRoutes = require('./src/routes/Admin/AdminSpeakingQuestions');
const petRoutes = require('./src/routes/petRoutes');
const { startPetDecayJob } = require('./src/jobs/petDecay');

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

// Session middleware for passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: true,          // hoặc set domain frontend cụ thể
    credentials: true,     // QUAN TRỌNG để gửi/nhận cookie
  })
);

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes); // Dashboard routes
app.use('/api/onboarding', onboardingRoutes); // Onboarding routes

// Public CMS routes
app.use('/api/topics', topicRoutes);
app.use('/api/writing-prompts', writingPromptRoutes);
app.use('/api/speaking-questions', speakingQuestionRoutes);

// Admin CMS routes
app.use('/api/admin/topics', adminTopicRoutes);
app.use('/api/admin/writing-prompts', adminWritingPromptRoutes);
app.use('/api/admin/speaking-questions', adminSpeakingQuestionRoutes);

// Pet feature
app.use('/api/pet', petRoutes);

// start background jobs
startPetDecayJob();



app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT=process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});   