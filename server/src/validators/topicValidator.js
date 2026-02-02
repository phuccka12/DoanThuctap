const { z } = require('zod');

const createTopicSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên chủ đề là bắt buộc').max(100, 'Tên chủ đề không được quá 100 ký tự'),
    cover_image: z.string().url('URL hình ảnh không hợp lệ').optional().nullable().or(z.literal('')),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_active: z.boolean().optional(),
    description: z.string().max(500, 'Mô tả không được quá 500 ký tự').optional().nullable(),
    icon_name: z.string().max(50, 'Tên icon không được quá 50 ký tự').optional().nullable(),
    keywords: z.array(z.string()).optional(),
    frequency: z.enum(['high', 'medium', 'low']).optional()
  })
});

const updateTopicSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    cover_image: z.string().url().optional().nullable().or(z.literal('')),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_active: z.boolean().optional(),
    description: z.string().max(500).optional().nullable(),
    icon_name: z.string().max(50).optional().nullable(),
    keywords: z.array(z.string()).optional(),
    frequency: z.enum(['high', 'medium', 'low']).optional(),
    nodes: z.array(z.any()).optional() // Support CourseBuilder nodes
  })
});

module.exports = {
  createTopicSchema,
  updateTopicSchema
};
