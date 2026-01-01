import { Schema, model } from 'mongoose';

const LeaveBalanceSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },

    allocated: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },

    year: { type: Number, required: true },
  },
  { timestamps: true }
);

const LeaveBalance = model('LeaveBalance', LeaveBalanceSchema);
export default LeaveBalance;
