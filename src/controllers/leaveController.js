import LeaveType from '../models/leaveType.js';
import LeavePolicy from '../models/leavePolicy.js';
import LeaveBalance from '../models/leaveBalance.js';
import Leave from '../models/leave.js';

import CustomError from '../utils/CustomError.js';
import { Response } from '../utils/index.js';

export const LeaveController = {
  /**
   * =============================
   * LEAVE TYPE CRUD (ADMIN)
   * =============================
   */

  createLeaveType: async (req, res, next) => {
    try {
      const { orgId, name, code } = req.body;

      if (!orgId || !name || !code)
        throw CustomError.badRequest('orgId, name & code required');

      const exist = await LeaveType.findOne({ orgId, code });
      if (exist) throw CustomError.badRequest('Leave Code already exists');

      const data = await LeaveType.create(req.body);

      Response(res, 'Leave Type Created', data);
    } catch (e) {
      next(e);
    }
  },

  getLeaveTypes: async (req, res, next) => {
    try {
      const { orgId } = req.query;
      if (!orgId) throw CustomError.badRequest('orgId required');

      const data = await LeaveType.find({ orgId }).sort({ createdAt: -1 });

      Response(res, 'Leave Types Fetched', data);
    } catch (e) {
      next(e);
    }
  },

  updateLeaveType: async (req, res, next) => {
    try {
      const { id } = req.params;

      const updated = await LeaveType.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!updated) throw CustomError.badRequest('Leave Type not found');

      Response(res, 'Leave Type Updated', updated);
    } catch (e) {
      next(e);
    }
  },

  deleteLeaveType: async (req, res, next) => {
    try {
      const { id } = req.params;

      const deleted = await LeaveType.findByIdAndDelete(id);
      if (!deleted) throw CustomError.badRequest('Leave Type not found');

      Response(res, 'Leave Type Deleted');
    } catch (e) {
      next(e);
    }
  },

  /**
   * =============================
   * APPLY LEAVE
   * =============================
   */
  applyLeave: async (req, res, next) => {
    try {
      const { orgId, employeeId, leaveTypeId, startDate, endDate, reason } =
        req.body;

      if (!orgId || !employeeId || !leaveTypeId || !startDate || !endDate)
        throw CustomError.badRequest('Required fields missing');

      // check overlapping
      const overlap = await Leave.findOne({
        employeeId,
        status: { $ne: 'Rejected' },
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
      });

      if (overlap)
        throw CustomError.badRequest('Leave already applied in these dates');

      // check balance
      const balance = await LeaveBalance.findOne({
        orgId,
        employeeId,
        leaveTypeId,
      });

      if (!balance) throw CustomError.badRequest('Leave balance not assigned');

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (balance.remaining < days)
        throw CustomError.badRequest('Insufficient Leave Balance');

      const leave = await Leave.create({
        orgId,
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        totalDays: days,
        reason,
        status: 'PENDING',
      });

      Response(res, 'Leave Applied', leave);
    } catch (e) {
      next(e);
    }
  },

  /**
   * =============================
   * APPROVE / REJECT
   * =============================
   */
  approveLeave: async (req, res, next) => {
    try {
      const { leaveId, action, remark } = req.body;

      const leave = await Leave.findById(leaveId);
      if (!leave) throw CustomError.badRequest('Leave Not Found');

      if (action === 'APPROVE') {
        leave.status = 'Approved';

        await LeaveBalance.findOneAndUpdate(
          {
            employeeId: leave.employeeId,
            leaveTypeId: leave.leaveTypeId,
          },
          {
            $inc: {
              used: leave.totalDays,
              remaining: -leave.totalDays,
            },
          }
        );
      } else {
        leave.status = 'Rejected';
      }

      leave.remarks = remark;
      await leave.save();

      Response(res, `Leave ${leave.status}`, leave);
    } catch (e) {
      next(e);
    }
  },

  /**
   * =============================
   * MY LEAVES
   * =============================
   */
  myLeaves: async (req, res, next) => {
    try {
      const { employeeId } = req.query;

      const leaves = await Leave.find({ employeeId }).sort({
        createdAt: -1,
      });

      Response(res, 'My Leaves Fetched', leaves);
    } catch (e) {
      next(e);
    }
  },
};
