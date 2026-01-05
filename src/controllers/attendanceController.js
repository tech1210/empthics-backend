import { Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';

import Employee from '../models/employee.js';
import Attendance from '../models/attendance.js';
import Leave from '../models/leave.js';
import moment from 'moment-timezone';

const IST = 'Asia/Kolkata';

// --------------------------------------
// HOLIDAYS SUPPORTING FROM - TO RANGE
// --------------------------------------
export const HOLIDAYS = [
  { name: 'New Year', fromDate: '2026-01-01', toDate: '2026-01-01' },
  { name: 'Republic Day', fromDate: '2026-01-26', toDate: '2026-01-26' },
  { name: 'Holi', fromDate: '2026-03-04', toDate: '2026-03-04' },
  { name: 'Ram Navmi', fromDate: '2026-03-27', toDate: '2026-03-27' },
  { name: 'Raksha Bandhan', fromDate: '2026-08-28', toDate: '2026-08-28' },
  { name: 'Independence Day', fromDate: '2026-08-15', toDate: '2026-08-15' },
  { name: 'Janmashtami', fromDate: '2026-09-04', toDate: '2026-09-04' },
  { name: 'Gandhi Jayanti', fromDate: '2026-10-02', toDate: '2026-10-02' },
  { name: 'Dussehra', fromDate: '2026-10-20', toDate: '2026-10-22' },
  { name: 'Gurunanak Birthday', fromDate: '2026-11-05', toDate: '2026-11-05' },
  { name: 'Diwali', fromDate: '2026-11-08', toDate: '2026-11-08' },
  { name: 'Bhai Dooj', fromDate: '2026-11-11', toDate: '2026-11-11' },
  { name: 'Chhath Pooja', fromDate: '2026-11-16', toDate: '2026-11-16' },
  { name: 'Christmas', fromDate: '2026-12-25', toDate: '2026-12-25' },
];

// --------------------------------------
// HELPERS
// --------------------------------------
const SHIFT_START_TIME = '10:00';
const HALF_DAY_HOURS = 4;

// remove seconds
const normalize = (date) =>
  moment(date).tz(IST).seconds(0).milliseconds(0).toDate();

const formatTime = (date) =>
  date ? moment(date).tz(IST).format('hh:mm a') : '';

const formatDate = (date) =>
  date ? moment(date).tz(IST).format('DD/MM/YYYY') : '';

const calculateTotalHours = (inTime, outTime) => {
  if (!inTime || !outTime) return '0h 0m';
  const start = normalize(inTime);
  const end = normalize(outTime);

  const duration = moment.duration(moment(end).diff(moment(start)));
  const minutes = parseInt(duration.asMinutes(), 10);

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const isSunday = (date) => moment(date).tz(IST).day() === 0;

const isHoliday = (date) => {
  const today = moment(date).tz(IST).format('YYYY-MM-DD');
  return HOLIDAYS.some((h) => {
    const from = moment(h.fromDate).format('YYYY-MM-DD');
    const to = moment(h.toDate).format('YYYY-MM-DD');
    return today >= from && today <= to;
  });
};

// ================================================================
// CONTROLLER
// ================================================================
export const attendanceController = {
  // 🔹 Punch In/Out
  markAttendance: async (req, res, next) => {
    try {
      const { latitude, longitude, address } = req.body;
      const userId = req.user._id;
      const now = normalize(new Date());

      if (!latitude || !longitude || !address)
        throw CustomError.badRequest(
          'Latitude, longitude and address required'
        );

      const openRecord = await Attendance.findOne({
        user: userId,
        punchOut: { $exists: false },
      }).sort({ createdAt: -1 });

      const todayStr = moment(now).tz(IST).format('YYYY-MM-DD');

      if (openRecord) {
        const recordDay = moment(openRecord.punchIn)
          .tz(IST)
          .format('YYYY-MM-DD');

        // ========= MINIMUM 1 MINUTE GAP CHECK =========
        const diffMs = now.getTime() - new Date(openRecord.punchIn).getTime();
        const diffSeconds = diffMs / 1000;

        if (diffSeconds < 60) {
          throw CustomError.badRequest(
            'Please wait at least 1 minute before punching out.'
          );
        }
        // =============================================

        if (recordDay === todayStr) {
          openRecord.punchOut = now;
          openRecord.punchOutLocation = { latitude, longitude, address };
          await openRecord.save();
          return Response(res, 'Punched out successfully.');
        }

        openRecord.status = 'Absent';
        await openRecord.save();
      }

      await Attendance.create({
        user: userId,
        punchIn: now,
        punchInLocation: { latitude, longitude, address },
      });

      return Response(res, 'Punched in successfully.');
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Attendance Summary for logged-in employee (unchanged UI but more accurate)
  getAttendanceSummary: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const isRegularizationEnabled =
        req.user?.orgId?.isRegularizationEnabled || false;
      const { fromDate, toDate, status } = req.query;

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      let start = fromDate
        ? moment(fromDate).tz(IST).startOf('day').toDate()
        : null;

      let end = toDate ? moment(toDate).tz(IST).endOf('day').toDate() : null;

      if (start && !end) end = moment(start).tz(IST).endOf('day').toDate();
      if (!start && end) start = moment(end).tz(IST).startOf('day').toDate();

      const filter = { user: userId };
      if (start && end) filter.punchIn = { $gte: start, $lte: end };
      if (status && status !== '') filter.status = status;

      const attendanceRecords = await Attendance.find(filter)
        .sort({ punchIn: -1 })
        .skip(skip)
        .limit(limit);

      const totalRecords = await Attendance.countDocuments(filter);

      let totalMinutes = 0;
      attendanceRecords.forEach((rec) => {
        if (rec.punchIn && rec.punchOut) {
          const s = normalize(rec.punchIn);
          const e = normalize(rec.punchOut);
          totalMinutes += (e - s) / 60000;
        }
      });

      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      const hoursWorked = `${totalHours}h ${remainingMinutes}m`;

      const latestRecord = await Attendance.findOne({ user: userId }).sort({
        punchIn: -1,
      });

      const isPunchedIn = latestRecord ? !latestRecord.punchOut : false;
      const punchInTime = latestRecord ? formatTime(latestRecord.punchIn) : '';

      const recentAttendance = attendanceRecords.map((att) => ({
        date: formatDate(att.punchIn),
        punchIn: formatTime(att.punchIn),
        punchOut: formatTime(att.punchOut),
        totalHours: calculateTotalHours(att.punchIn, att.punchOut),
        status: att.status,
        punchInLocation: att?.punchInLocation?.address || '',
        punchOutLocation: att?.punchOutLocation?.address || '',
      }));

      return Response(res, 'Attendance summary fetched successfully', {
        isRegularizationEnabled,
        dateRange: { start, end },
        filterStatus: status || 'All',
        isPunchedIn,
        punchIn: punchInTime,
        hoursWorked,
        leavesLeft: 0,
        pendingLeaveRequests: 0,
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
        recentAttendance,
      });
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Dashboard Summary (unchanged)
  getDashboardSummary: async (req, res, next) => {
    try {
      const totalEmployees = await Employee.countDocuments({
        orgId: req.user._id,
        status: 'Active',
      });

      const empIds = await Employee.distinct('_id', {
        orgId: req.user._id,
      });

      const today = moment().tz(IST);
      const startOfDay = today.clone().startOf('day').toDate();
      const endOfDay = today.clone().endOf('day').toDate();

      const presentToday = await Attendance.distinct('user', {
        punchIn: { $gte: startOfDay, $lte: endOfDay },
        user: { $in: empIds },
      });

      const employeeList = await Employee.find({ orgId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

      return Response(res, 'Dashboard data fetched successfully', {
        totalEmployees,
        presentToday: presentToday.length,
        onLeave: 0,
        pendingRequests: 0,
        employeeList,
      });
    } catch (err) {
      next(err);
    }
  },

  // 🔹 Get All Attendance (unchanged display but accurate hours)
  getAllAttendance: async (req, res, next) => {
    try {
      const {
        employeeId: userId,
        startDate,
        endDate,
        status,
        search,
      } = req.query;

      let filter = {};
      if (userId) filter.user = userId;
      if (status) filter.status = status;

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: moment(startDate).tz(IST).startOf('day').toDate(),
          $lte: moment(endDate).tz(IST).endOf('day').toDate(),
        };
      }

      const attendanceList = await Attendance.find(filter)
        .populate('user', 'name email phone designation orgId status')
        .sort({ createdAt: -1 });

      const formatted = attendanceList.map((att) => ({
        employee: att.user?.name || 'N/A',
        email: att.user?.email,
        phone: att.user?.phone,
        designation: att.user?.designation,
        orgId: att.user?.orgId,
        status: att.user?.status,
        date: moment(att.createdAt).tz(IST).format('YYYY-MM-DD'),
        punchIn: formatTime(att.punchIn),
        punchOut: formatTime(att.punchOut),
        totalHours: calculateTotalHours(att.punchIn, att.punchOut),
        attendanceStatus: att.status,
        punchInLocation: att.punchInLocation || null,
        punchOutLocation: att.punchOutLocation || null,
      }));

      if (search) {
        return Response(
          res,
          'Filtered attendance data',
          formatted.filter((row) =>
            row.employee?.toLowerCase()?.includes(search.toLowerCase())
          )
        );
      }

      return Response(res, 'All attendance data fetched', formatted);
    } catch (err) {
      next(err);
    }
  },

  // 🔹 Create Leave
  createLeave: async (req, res, next) => {
    try {
      const { employeeId: userId, startDate, endDate, reason } = req.body;
      const orgId = req.user._id;

      const newLeave = new Leave({
        user: userId,
        orgId,
        startDate,
        endDate,
        reason,
        status: 'Approved',
      });

      await newLeave.save();
      Response(res, 'Leave created successfully', newLeave);
    } catch (e) {
      next(e);
    }
  },

  // 🔹 DAILY REPORT (Holiday + Sunday + Late + Half Day)
  getDailyAttendanceReport: async (req, res, next) => {
    try {
      const { date, search } = req.query;
      const orgId = req.user._id;

      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = normalize(new Date(targetDate.setHours(0, 0, 0, 0)));
      const endOfDay = normalize(
        new Date(targetDate.setHours(23, 59, 59, 999))
      );

      let employeeQuery = { orgId, status: 'Active' };
      if (search) employeeQuery.name = { $regex: search, $options: 'i' };

      const allEmployees = await Employee.find(employeeQuery);
      const employeeIds = allEmployees.map((emp) => emp._id);

      const attendanceRecords = await Attendance.find({
        user: { $in: employeeIds },
        punchIn: { $gte: startOfDay, $lte: endOfDay },
      });

      const leaveRecords = await Leave.find({
        user: { $in: employeeIds },
        status: 'Approved',
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay },
      });

      let presentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      const onLeaveCount = leaveRecords.length;

      const employeeReport = allEmployees.map((emp) => {
        const attendance = attendanceRecords.find(
          (att) => att.user.toString() === emp._id.toString()
        );

        const onLeave = leaveRecords.find(
          (l) => l.user.toString() === emp._id.toString()
        );

        let status = 'Absent';

        let reportData = {
          employee: emp.name,
          employeeId: emp.employeeId,
          date: startOfDay.toISOString().split('T')[0],
          inTime: '',
          outTime: '',
          totalHours: '0h 0m',
          inLocation: '',
          outLocation: '',
          status: emp.status,
        };

        if (isSunday(startOfDay) || isHoliday(startOfDay)) {
          status = 'Holiday';
        } else if (onLeave) {
          status = 'On Leave';
        } else if (attendance) {
          presentCount++;
          status = 'Present';

          const [sh, sm] = SHIFT_START_TIME.split(':');
          const shiftTime = new Date(startOfDay);
          shiftTime.setHours(sh, sm, 0, 0);

          if (normalize(attendance.punchIn) > normalize(shiftTime)) {
            status = 'Late';
            lateCount++;
          }

          const hours = attendance.punchOut
            ? (normalize(attendance.punchOut) - normalize(attendance.punchIn)) /
              3600000
            : 0;

          if (attendance.punchOut && hours > 0 && hours < HALF_DAY_HOURS) {
            status = 'Half Day';
            halfDayCount++;
          }

          reportData.inTime = formatTime(attendance.punchIn);
          reportData.outTime = formatTime(attendance.punchOut);
          reportData.totalHours = calculateTotalHours(
            attendance.punchIn,
            attendance.punchOut
          );
          reportData.inLocation = attendance.punchInLocation?.address || '--';
          reportData.outLocation = attendance.punchOutLocation?.address || '--';
        }

        reportData.attendanceStatus = status;
        return reportData;
      });

      const absentCount = allEmployees.length - presentCount - onLeaveCount;

      Response(res, 'Daily attendance report fetched', {
        summary: {
          totalEmployees: allEmployees.length,
          present: presentCount,
          late: lateCount,
          absent: absentCount < 0 ? 0 : absentCount,
          halfDay: halfDayCount,
          onLeave: onLeaveCount,
        },
        report: employeeReport,
      });
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Custom Attendance Report (Month / Year / Range)
  getCustomAttendanceReport: async (req, res, next) => {
    try {
      const { year, month, date } = req.query;

      if (!date && !year)
        throw CustomError.badRequest(
          'A valid `date` or `year` query parameter is required.'
        );

      const orgId = req.user._id;
      let startDate;
      let endDate;

      if (date) {
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime()))
          throw CustomError.badRequest('Invalid date format provided.');

        startDate = normalize(new Date(targetDate.setHours(0, 0, 0, 0)));
        endDate = normalize(new Date(targetDate.setHours(23, 59, 59, 999)));
      } else {
        if (month) {
          startDate = normalize(new Date(year, month - 1, 1));
          endDate = normalize(new Date(year, month, 0, 23, 59, 59, 999));
        } else {
          startDate = normalize(new Date(year, 0, 1));
          endDate = normalize(new Date(year, 11, 31, 23, 59, 59, 999));
        }
      }

      const allEmployees = await Employee.find({ orgId, status: 'Active' });
      const employeeIds = allEmployees.map((e) => e._id);

      let totalWorkingDays = 0;

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      )
        if (!isSunday(d) && !isHoliday(d)) totalWorkingDays++;

      const attendances = await Attendance.find({
        user: { $in: employeeIds },
        punchIn: { $gte: startDate, $lte: endDate },
      });

      const leaves = await Leave.find({
        user: { $in: employeeIds },
        status: 'Approved',
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      const employeeReport = allEmployees.map((emp) => {
        let present = 0,
          late = 0,
          absent = 0,
          halfDays = 0;

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          if (isSunday(d) || isHoliday(d)) continue;

          const dayStart = normalize(
            new Date(new Date(d).setHours(0, 0, 0, 0))
          );
          const dayEnd = normalize(
            new Date(new Date(d).setHours(23, 59, 59, 999))
          );

          const isOnLeave = leaves.some(
            (l) =>
              l.user.equals(emp._id) &&
              new Date(l.startDate) <= dayEnd &&
              new Date(l.endDate) >= dayStart
          );
          if (isOnLeave) continue;

          const att = attendances.find(
            (a) =>
              a.user.equals(emp._id) &&
              a.punchIn >= dayStart &&
              a.punchIn <= dayEnd
          );

          if (!att) {
            absent++;
          } else {
            present++;

            const [h, m] = SHIFT_START_TIME.split(':');
            const shiftTime = new Date(dayStart);
            shiftTime.setHours(h, m);

            if (normalize(att.punchIn) > normalize(shiftTime)) late++;

            const hours = att.punchOut
              ? (normalize(att.punchOut) - normalize(att.punchIn)) / 3600000
              : 0;

            if (hours > 0 && hours < HALF_DAY_HOURS) halfDays++;
          }
        }

        const attendancePercentage =
          totalWorkingDays > 0
            ? Math.round((present / totalWorkingDays) * 100)
            : 0;

        return {
          employee: emp.name,
          employeeId: emp.employeeId,
          present,
          late,
          absent,
          halfDays,
          attendancePercentage: `${attendancePercentage}%`,
        };
      });

      Response(res, 'Custom attendance report fetched', {
        summary: {
          totalWorkingDays,
        },
        report: employeeReport,
      });
    } catch (e) {
      next(e);
    }
  },
};
