import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hashedToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index: automatically deletes document at expiresAt timestamp
    },
  },
  {
    timestamps: true,
  }
);

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
