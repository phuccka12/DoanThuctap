const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (upload to Cloudinary directly)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedAudio = /mp3|wav|ogg|m4a/;
  const allowedVideo = /mp4|mov|avi|mkv/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  // Check file type
  if (
    allowedImages.test(extname) ||
    allowedAudio.test(extname) ||
    allowedVideo.test(extname)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, audio, and video files are allowed.'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

module.exports = upload;
