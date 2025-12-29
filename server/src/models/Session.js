const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    refresh_token_hash: { type: String, required: true },
    jti: { type: String, required: true }, // id cho refresh token

    user_agent: { type: String, default: "" },
    ip: { type: String, default: "" },

    expires_at: { type: Date, required: true },
    revoked_at: { type: Date, default: null },
    last_used_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

sessionSchema.index({ user_id: 1 });
sessionSchema.index({ expires_at: 1 });

module.exports = mongoose.model("Session", sessionSchema);
