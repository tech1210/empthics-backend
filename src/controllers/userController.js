import Employee from '../models/employee.js';
import User from '../models/user.js';

import { Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';
import { generatePresignedUrl } from '../utils/s3Upload.js';

export const userController = {
  getAllUsers: async (req, res, next) => {
    try {
      let { page = 1, limit = 10 } = req.query;

      if (Number(page) === 0) page = 1;
      const skip = (page - 1) * limit;

      let [users, total] = await Promise.all([
        User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(),
      ]);

      // Add SNO to each inquiry
      users = users.map((inquiry, index) => ({
        ...inquiry.toObject(),
        sno: index + 1 + skip, // Calculate SNO based on index and skip
      }));

      const totalPages = Math.ceil(total / limit);

      Response(res, 'Success', { users, totalPages, total });
    } catch (e) {
      next(e);
    }
  },

  getUserProfile: async (req, res, next) => {
    try {
      const userId = req.user._id;
      let result = await User.findOne({ _id: userId }).lean();

      if (!result) result = await Employee.findOne({ _id: userId }).lean();

      result = JSON.parse(JSON.stringify(result));
      if (result?.photoUrl)
        result.photoUrlPresigned = await generatePresignedUrl(result.photoUrl);

      if (result?.resumeUrl)
        result.resumeUrlPresigned = await generatePresignedUrl(
          result.resumeUrl
        );

      Response(res, 'Success', result);
    } catch (e) {
      next(e);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const { id } = req.query;
      let result = await User.findOne({ _id: id });

      if (!result) throw CustomError.userNotFound();

      Response(res, 'Success', result);
    } catch (e) {
      next(e);
    }
  },
};
