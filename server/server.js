require('dotenv').config(); // Để đọc file .env
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const aiRoutes = require('./src/routes/aiRoutes')
const app = express();
connectDB();

app.use(express.json());
app.use(cors());
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT=process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});   