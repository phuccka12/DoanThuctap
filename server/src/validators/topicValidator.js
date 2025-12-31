const { z } = require('zod');

const createTopicSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên chủ đề là bắt buộc').max(100, 'Tên chủ đề không được quá 100 ký tự'),
    cover_image: z.string().url('URL hình ảnh không hợp lệ').optional().nullable(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_active: z.boolean().optional()
  })
});

const updateTopicSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    cover_image: z.string().url().optional().nullable(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_active: z.boolean().optional()
  })
});

module.exports = {
  createTopicSchema,
  updateTopicSchema
};
