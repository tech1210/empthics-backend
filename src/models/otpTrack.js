import { Schema, model } from 'mongoose';

const OtpTrackSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },

    purpose: {
      type: String,
      enum: [
        'RESET_PASSWORD',
        'EMAIL_VERIFICATION',
        'PHONE_VERIFICATION',
        '2FA',
      ],
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
      required: true,
    },

    expiry: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to auto-delete after expiry
OtpTrackSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export default model('OtpTrack', OtpTrackSchema);
