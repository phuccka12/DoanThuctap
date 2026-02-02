const cloudinary = require('cloudinary').v2;

// Function to configure Cloudinary (called when needed)
const configureCloudinary = () => {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Debug log
    console.log('🔧 Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
    });
  }
  return cloudinary;
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path or buffer
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} resourceType - 'image' | 'video' | 'raw' (for audio)
 */
const uploadToCloudinary = async (filePath, folder = 'ielts-app', resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
      // Optimization options
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to cloud');
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from cloud');
  }
};

/**
 * Generate transformation URL (resize, crop, etc.)
 */
const getTransformedUrl = (publicId, transformations = {}) => {
  configureCloudinary();
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true
  });
};

module.exports = {
  cloudinary: configureCloudinary(),
  uploadToCloudinary,
  deleteFromCloudinary,
  getTransformedUrl
};
