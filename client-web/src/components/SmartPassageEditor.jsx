import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './SmartPassageEditor.css';
import { FiZap, FiLink, FiRefreshCw } from 'react-icons/fi';

/**
 * SmartPassageEditor - Rich Text Editor with AI Features
 * Features:
 * - Rich text editing with ReactQuill
 * - AI Generate button
 * - Auto-link Vocabulary button
 * - Word count display
 */

// Helper: Clean AI-generated text (remove unwanted HTML tags/entities)
const cleanAIText = (text) => {
  if (!text) return '';
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  let cleaned = textarea.value;
  
  // Remove <p> and </p> tags (AI sometimes adds these)
  cleaned = cleaned.replace(/<\/?p>/gi, '');
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
};

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline',
  'list', // Remove 'bullet' - it's part of 'list'
  'link'
];

function SmartPassageEditor({ 
  value, 
  onChange, 
  onAIGenerate, 
  onScanVocabulary,
  aiGenerating = false,
  scanningVocab = false,
  linkedVocabCount = 0,
  passageId = null
}) {
  const quillRef = useRef(null);
  const [editorValue, setEditorValue] = useState(value || '');

  // Sync with external value changes
  useEffect(() => {
    console.log('🔄 SmartPassageEditor received new value:', value?.substring(0, 100));
    if (value !== editorValue) {
      // Clean AI-generated text before setting
      const cleanedValue = cleanAIText(value || '');
      setEditorValue(cleanedValue);
    }
  }, [value]);

  const handleChange = (content) => {
    console.log('✏️ Editor changed:', content?.substring(0, 100));
    setEditorValue(content);
    onChange(content);
  };

  const wordCount = editorValue ? editorValue.replace(/<[^>]*>/g, '').trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-300">
          Nội dung bài đọc * 
          <span className="ml-2 text-xs text-gray-400">({wordCount} từ)</span>
        </label>
        
        <div className="flex gap-2">
          {/* AI Generate Button */}
          <button
            type="button"
            onClick={onAIGenerate}
            disabled={aiGenerating}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {aiGenerating ? (
              <FiRefreshCw className="animate-spin" size={14} />
            ) : (
              <FiZap size={14} />
            )}
            {aiGenerating ? 'Generating...' : 'AI Generate'}
          </button>

          {/* Scan Vocabulary Button */}
          {passageId && (
            <button
              type="button"
              onClick={onScanVocabulary}
              disabled={scanningVocab}
              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {scanningVocab ? (
                <FiRefreshCw className="animate-spin" size={14} />
              ) : (
                <FiLink size={14} />
              )}
              {scanningVocab ? 'Scanning...' : `Auto-Link Vocab`}
              {linkedVocabCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {linkedVocabCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="quill-editor-wrapper">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder="Nhập nội dung bài đọc hoặc dùng AI Generate..."
          className="bg-gray-700 rounded-lg text-white"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>💡 Tip: Dùng AI Generate để tạo nội dung tự động</span>
        {linkedVocabCount > 0 && (
          <span className="text-green-400">
            ✓ {linkedVocabCount} từ vựng đã được link
          </span>
        )}
      </div>
    </div>
  );
}

export default SmartPassageEditor;
