import { Schema, model } from 'mongoose';
import { UserStatus } from '../utils/data.js';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, unique: true },
    password: { type: String, select: false },
    tpass: { type: String, select: false },
    image: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: 'User' },

    role: {
      type: String,
      enum: ['superadmin', 'organization'],
    },

    joiningDate: { type: Date },
    isRegularizationEnabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true,
    },
    emailVerified: { type: Boolean, default: true },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
  },
  { timestamps: true }
);

const User = model('User', UserSchema);

export default User;
