const { z } = require('zod');

const createWritingPromptSchema = z.object({
  body: z.object({
    topic_id: z.string().min(1, 'Topic ID là bắt buộc'),
    type: z.enum(['topic', 'task1', 'task2'], {
      errorMap: () => ({ message: 'Loại phải là topic, task1 hoặc task2' })
    }),
    prompt: z.string().min(10, 'Đề bài phải có ít nhất 10 ký tự'),
    image_url: z.string().url('URL hình ảnh không hợp lệ').optional().nullable(),
    ideas: z.array(z.string()).optional(),
    min_words: z.number().int().min(0).optional(),
    max_words: z.number().int().min(0).optional(),
    model_essay: z.string().optional().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_active: z.boolean().optional()
  })
});

const updateWritingPromptSchema = z.object({
  body: z.object({
    topic_id: z.string().optional(),
    type: z.enum(['topic', 'task1', 'task2']).optional(),
    prompt: z.string().min(10, 'Đề bài phải có ít nhất 10 ký tự').optional(),
    image_url: z.string().url('URL hình ảnh không hợp lệ').optional().nullable(),
    ideas: z.array(z.string()).optional(),
    min_words: z.number().int().min(0).optional(),
    max_words: z.number().int().min(0).optional(),
    model_essay: z.string().optional().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_active: z.boolean().optional()
  })
});

module.exports = {
  createWritingPromptSchema,
  updateWritingPromptSchema
};
