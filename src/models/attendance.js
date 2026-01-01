import { Schema, model } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    punchIn: {
      type: Date,
      required: true,
    },

    punchOut: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      default: 'Present',
    },

    punchInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },

    punchOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
  },
  { timestamps: true }
);

export default model('Attendance', AttendanceSchema);
