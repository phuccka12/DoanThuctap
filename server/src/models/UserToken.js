const mongoose = require("mongoose");

const userTokenSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["verify_email", "reset_password"], required: true },

    token_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used_at: { type: Date, default: null },

    ip: { type: String, default: "" },
    user_agent: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

userTokenSchema.index({ user_id: 1, type: 1 });
userTokenSchema.index({ expires_at: 1 });

module.exports = mongoose.model("UserToken", userTokenSchema);
