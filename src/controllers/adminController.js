import Attendance from '../models/attendance.js';
import { Response } from '../utils/index.js';

export const adminController = {
  getDashboardSummary: async (req, res, next) => {
    try {
      // Get total employees (excluding superadmins/organizations if you want)
      const totalEmployees = await User.countDocuments({ role: 'employee' });

      // Date range for today
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Employees who punched in today
      const presentToday = await Attendance.distinct('user', {
        punchIn: { $gte: startOfDay, $lte: endOfDay },
      });

      // On leave (stub → depends on Leave model)
      const onLeave = 0; // await Leave.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, status: 'Approved' });

      // Pending leave requests (stub)
      const pendingRequests = 0; // await Leave.countDocuments({ status: 'Pending' });

      // Get employee list (latest 20)
      const employeeList = await User.find({ role: 'employee' })
        .sort({ createdAt: -1 })
        .limit(20);

      return Response(res, 'Dashboard data fetched successfully', {
        totalEmployees,
        presentToday: presentToday.length,
        onLeave,
        pendingRequests,
        employeeList,
      });
    } catch (err) {
      next(err);
    }
  },
};
