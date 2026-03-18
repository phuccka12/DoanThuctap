const mongoose = require('mongoose');

const WritingScenarioSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WritingScenario',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  evaluation: {
    overall_score: Number,
    radar_chart: {
      tone: Number,
      vocab: Number,
      creativity: Number,
      grammar: Number
    },
    persona_feedback: String,
    detailed_analysis: {
      pros: [String],
      cons: [String],
      suggestions: [String]
    },
    better_version: String
  },
  reward: {
    coins: { type: Number, default: 0 },
    exp: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying of history
WritingScenarioSubmissionSchema.index({ userId: 1, scenarioId: 1, createdAt: -1 });

module.exports = mongoose.model('WritingScenarioSubmission', WritingScenarioSubmissionSchema);
