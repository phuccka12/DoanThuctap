import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiCheck, FiLoader, FiImage, FiMusic, FiVideo } from 'react-icons/fi';
import axios from 'axios';

/**
 * FileUploader Component
 * Drag & drop file uploader with Cloudinary integration
 * 
 * Props:
 * - accept: File types (e.g., "image/*", "audio/*", "video/*")
 * - folder: Cloudinary folder name
 * - onUploadSuccess: Callback with uploaded file data
 * - onUploadError: Callback with error
 * - maxSize: Max file size in MB (default: 50)
 */
function FileUploader({ 
  accept = "image/*,audio/*,video/*",
  folder = "ielts-app",
  onUploadSuccess,
  onUploadError,
  maxSize = 50,
  placeholder = "Kéo thả file vào đây hoặc nhấn để chọn"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    setError(null);
    setUploadedFile(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const err = `File quá lớn! Kích thước tối đa: ${maxSize}MB`;
      setError(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    // Upload to Cloudinary
    await uploadFile(file);
  };

  // Upload file to backend (Cloudinary)
  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:3001/api/upload/single',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (response.data.success) {
        const uploadedData = {
          url: response.data.data.url,
          publicId: response.data.data.publicId,
          format: response.data.data.format,
          size: response.data.data.size,
          name: file.name
        };
        
        setUploadedFile(uploadedData);
        setUploading(false);
        
        if (onUploadSuccess) {
          onUploadSuccess(uploadedData);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || 'Upload thất bại!';
      setError(errorMsg);
      setUploading(false);
      
      if (onUploadError) {
        onUploadError(errorMsg);
      }
    }
  };

  // Remove uploaded file
  const handleRemove = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <FiImage className="text-3xl" />;
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <FiMusic className="text-3xl" />;
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return <FiVideo className="text-3xl" />;
    }
    return <FiUpload className="text-3xl" />;
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!uploadedFile && !uploading && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-gray-700 hover:border-gray-600 bg-gray-900'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
              <FiUpload className="text-3xl" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Kích thước tối đa: {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Progress */}
      {uploading && (
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <div className="flex items-center gap-4">
            <FiLoader className="text-3xl text-purple-500 animate-spin" />
            <div className="flex-1">
              <p className="text-white font-semibold mb-2">
                Đang upload... {uploadProgress}%
              </p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-linear-to-r from-purple-600 to-fuchsia-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadedFile && (
        <div className="border border-green-700 rounded-lg p-4 bg-green-900/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-900/50 flex items-center justify-center text-green-400 shrink-0">
              {uploadedFile.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={uploadedFile.url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                getFileIcon(uploadedFile.name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate mb-1">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                  title="Xóa"
                >
                  <FiX />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                <FiCheck />
                <span>Upload thành công!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">
            ⚠️ {error}
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
