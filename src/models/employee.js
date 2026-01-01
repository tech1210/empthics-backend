import { Schema, model } from 'mongoose';
import { UserStatus } from '../utils/data.js';

const EmployeeSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // organization

    employeeId: { type: String, required: true },
    loginId: { type: String, required: true, unique: true }, // unique login ID

    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },

    role: { type: String, default: 'employee' },

    password: { type: String, required: true, select: false }, // hashed password
    tpass: { type: String, select: false }, // temp password

    designation: { type: String, required: true },
    joiningDate: { type: Date },

    photoUrl: { type: String },
    resumeUrl: { type: String },

    bankDetails: {
      accountHolderName: { type: String },
      bankName: { type: String },
      branch: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
    },

    workExperience: [
      {
        companyName: { type: String },
        designation: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
      },
    ],
    isOnboardingMailSent: {
      type: Boolean,
      default: false,
    },
    onboardingMailSentAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true,
    },
  },
  { timestamps: true }
);

const Employee = model('Employee', EmployeeSchema);

export default Employee;
