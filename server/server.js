require('dotenv').config(); // Để đọc file .env
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const aiRoutes = require('./src/routes/aiRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const app = express();
connectDB();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());

app.use(
  cors({
    origin: true,          // hoặc set domain frontend cụ thể
    credentials: true,     // QUAN TRỌNG để gửi/nhận cookie
  })
);


app.use(express.json());
app.use(cors());
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT=process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});   