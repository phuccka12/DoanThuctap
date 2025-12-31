const { z } = require('zod');

const createSpeakingQuestionSchema = z.object({
  body: z.object({
    topic_id: z.string().min(1, 'Topic ID là bắt buộc'),
    part: z.enum(['free', 'p1', 'p2', 'p3'], {
      errorMap: () => ({ message: 'Part phải là free, p1, p2 hoặc p3' })
    }),
    question: z.string().min(5, 'Câu hỏi phải có ít nhất 5 ký tự'),
    keywords: z.array(z.string()).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_active: z.boolean().optional()
  })
});

const updateSpeakingQuestionSchema = z.object({
  body: z.object({
    topic_id: z.string().optional(),
    part: z.enum(['free', 'p1', 'p2', 'p3']).optional(),
    question: z.string().min(5, 'Câu hỏi phải có ít nhất 5 ký tự').optional(),
    keywords: z.array(z.string()).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_active: z.boolean().optional()
  })
});

module.exports = {
  createSpeakingQuestionSchema,
  updateSpeakingQuestionSchema
};
