import Attendance from '../models/attendance.js';
import Holiday from '../models/holiday.js';
import { Response } from '../utils/index.js';

export const adminController = {
  /**
   * =============================
   *  HOLIDAY - BULK UPLOAD (ADMIN)
   *  FORMAT: YYYY-MM-DD ONLY
   * =============================
   */
  bulkUploadHolidays: async (req, res, next) => {
    try {
      const { orgId, holidays } = req.body;

      if (!orgId) throw CustomError.badRequest('orgId is required');
      if (!holidays || !Array.isArray(holidays) || holidays.length === 0)
        throw CustomError.badRequest('holidays array is required');

      const savedList = [];

      for (let h of holidays) {
        if (!h.name || !h.fromDate || !h.toDate)
          throw CustomError.badRequest(
            'Each holiday must contain name, fromDate, toDate (yyyy-mm-dd)'
          );

        const fromDate = new Date(h.fromDate);
        const toDate = new Date(h.toDate);

        if (isNaN(fromDate) || isNaN(toDate))
          throw CustomError.badRequest(
            `Invalid date format in holiday: ${h.name}. Use YYYY-MM-DD`
          );

        if (toDate < fromDate)
          throw CustomError.badRequest(
            `toDate cannot be smaller than fromDate for ${h.name}`
          );

        try {
          const saved = await Holiday.findOneAndUpdate(
            {
              orgId,
              fromDate,
              toDate,
            },
            {
              orgId,
              name: h.name,
              fromDate,
              toDate,
              year: fromDate.getFullYear(),
              description: h.description || '',
              isActive: true,
            },
            { upsert: true, new: true }
          );

          savedList.push(saved);
        } catch (err) {
          console.log('Skipped holiday (probably duplicate):', h.name);
        }
      }

      return Response(res, 'Holidays uploaded successfully', {
        totalSaved: savedList.length,
        holidays: savedList,
      });
    } catch (e) {
      next(e);
    }
  },
};
