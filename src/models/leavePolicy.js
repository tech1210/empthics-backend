import { Schema, model } from 'mongoose';

const LeavePolicySchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },

    approvalLevels: { type: Number, default: 1 },

    minApplyBeforeDays: { type: Number, default: 0 },
    maxBackDateApplyDays: { type: Number, default: 0 },
    requiresDocumentAfterDays: { type: Number, default: 0 },

    sandwichRule: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LeavePolicy = model('LeavePolicy', LeavePolicySchema);
export default LeavePolicy;
