import Attendance from '../models/attendance.js';

import { Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import RegularizationRequest from '../models/regularizationRequest.js';
import User from '../models/user.js';

dayjs.extend(utc);

// ✨ REFACTORED: Helper to calculate hours using dayjs
const calculateTotalHours = (inTime, outTime) => {
  if (!inTime || !outTime) return '00:00';
  const start = dayjs(inTime);
  const end = dayjs(outTime);
  const diffMinutes = end.diff(start, 'minute');
  const hours = String(Math.floor(diffMinutes / 60)).padStart(2, '0');
  const minutes = String(diffMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const regularizationController = {
  /**
   * 🔹 [EMPLOYEE] Create a new regularization request
   */

  toggleRegularization: async (req, res, next) => {
    try {
      const userId = req.user._id;

      await User.updateOne(
        { _id: userId },
        {
          $set: { isRegularizationEnabled: !req.user?.isRegularizationEnabled },
        }
      );

      Response(
        res,
        `Regularization Attendance ${
          req.user?.isRegularizationEnabled ? 'enabled' : 'disabled'
        } successfully`
      );
    } catch (e) {
      next(e);
    }
  },

  createRequest: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { date, reason, requestedInTime, requestedOutTime } = req.body;

      let orgData = await User.findOne({ _id: req.user.orgId }).select(
        'isRegularizationEnabled'
      );
      if (!orgData?.isRegularizationEnabled)
        throw CustomError.badRequest('Regularization Attendance is disabled!.');

      if (!date || !reason || !requestedInTime || !requestedOutTime) {
        throw CustomError.badRequest(
          'Date, reason, and requested times are required.'
        );
      }

      // Parse the incoming date (e.g., "06/10/2025") as UTC
      const startOfDay = dayjs.utc(date, 'DD/MM/YYYY').startOf('day').toDate();
      const endOfDay = dayjs.utc(date, 'DD/MM/YYYY').endOf('day').toDate();

      // Check for an existing pending request for the same date
      const existingRequest = await RegularizationRequest.findOne({
        employee: userId,
        date: startOfDay,
        status: 'Pending',
      });

      if (existingRequest) {
        throw CustomError.badRequest(
          'You already have a pending request for this date.'
        );
      }

      // Fetch original attendance (if exists)
      const originalAttendance = await Attendance.findOne({
        user: userId,
        punchIn: { $gte: startOfDay, $lte: endOfDay },
      });

      // 🕒 Combine date + time strings into full Date objects
      const requestedInDateTime = dayjs
        .utc(`${date} ${requestedInTime}`, 'DD/MM/YYYY HH:mm')
        .toDate();

      const requestedOutDateTime = dayjs
        .utc(`${date} ${requestedOutTime}`, 'DD/MM/YYYY HH:mm')
        .toDate();

      // Create new regularization request
      const newRequest = new RegularizationRequest({
        employee: userId,
        orgId: req.user.orgId,
        attendance: originalAttendance ? originalAttendance._id : null,
        date: startOfDay, // normalized date
        reason,
        originalInTime: originalAttendance ? originalAttendance.punchIn : null,
        originalOutTime: originalAttendance
          ? originalAttendance.punchOut
          : null,
        requestedInTime: requestedInDateTime,
        requestedOutTime: requestedOutDateTime,
      });

      await newRequest.save();

      Response(
        res,
        'Regularization request submitted successfully.',
        newRequest
      );
    } catch (e) {
      next(e);
    }
  },

  /**
   * 🔹 [EMPLOYER] Get all regularization requests for the organization
   */
  getOrgRequests: async (req, res, next) => {
    try {
      const { month, year, status } = req.query;
      const orgId = req.user._id;

      const filter = { orgId };
      if (status) filter.status = status;
      if (year && month) {
        // ✨ REFACTORED: Use dayjs for robust date filtering
        const startDate = dayjs
          .utc()
          .year(year)
          .month(month - 1)
          .startOf('month')
          .toDate();
        const endDate = dayjs
          .utc()
          .year(year)
          .month(month - 1)
          .endOf('month')
          .toDate();
        filter.date = { $gte: startDate, $lte: endDate };
      }

      const requests = await RegularizationRequest.find(filter)
        .populate('employee', 'name email phone photoUrl')
        .sort({ createdAt: -1 });

      // ✨ REFACTORED: Use dayjs for clean date and time formatting
      const formattedRequests = requests.map((req) => ({
        _id: req._id,
        user: req.employee,
        date: dayjs(req.date).utc().format('YYYY-MM-DD'),
        inOutTime: req.originalInTime
          ? `${dayjs(req.originalInTime).utc().format('HH:mm')} - ${dayjs(
              req.originalOutTime
            )
              .utc()
              .format('HH:mm')}`
          : 'N/A',
        workHours: calculateTotalHours(req.originalInTime, req.originalOutTime),
        reason: req.reason,
        updatedInOut: `${dayjs(req.requestedInTime)
          .utc()
          .format('HH:mm')} - ${dayjs(req.requestedOutTime)
          .utc()
          .format('HH:mm')}`,
        updatedWorkHours: calculateTotalHours(
          req.requestedInTime,
          req.requestedOutTime
        ),
        remarks: req.remarks,
        status: req.status,
      }));

      Response(res, 'Regularization requests fetched.', formattedRequests);
    } catch (e) {
      next(e);
    }
  },

  /**
   * 🔹 [EMPLOYER] Review (Accept/Reject) a request
   * This function doesn't handle date creation, so it remains largely the same.
   */
  reviewRequest: async (req, res, next) => {
    try {
      const { requestId, status, remarks } = req.body;
      const reviewedBy = req.user._id;

      if (!requestId || !status) {
        throw CustomError.badRequest('Request ID and status are required.');
      }
      if (status === 'Rejected' && !remarks) {
        throw CustomError.badRequest('Remarks are required for rejection.');
      }

      const request = await RegularizationRequest.findById(requestId);
      if (!request || request.orgId.toString() !== req.user._id.toString()) {
        throw CustomError.notFound(
          'Request not found or you do not have permission.'
        );
      }
      if (request.status !== 'Pending') {
        throw CustomError.badRequest(
          `This request has already been ${request.status.toLowerCase()}.`
        );
      }

      if (status === 'Accepted') {
        const attendanceRecord = await Attendance.findOne({
          _id: request.attendance,
        });

        if (attendanceRecord) {
          attendanceRecord.punchIn = request.requestedInTime;
          attendanceRecord.punchOut = request.requestedOutTime;
          await attendanceRecord.save();
        } else {
          const newAttendance = new Attendance({
            user: request.employee,
            punchIn: request.requestedInTime,
            punchOut: request.requestedOutTime,
            status: 'Present',
          });
          await newAttendance.save();
        }
      }

      request.status = status;
      request.remarks = remarks;
      request.reviewedBy = reviewedBy;
      await request.save();

      Response(res, `Request has been ${status.toLowerCase()}.`);
    } catch (e) {
      next(e);
    }
  },
};
