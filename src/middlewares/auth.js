import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import CustomError from '../utils/CustomError.js';
import { JWT_SECRET } from '../configs/index.js';
import Employee from '../models/employee.js';

/**
 * Middleware to authenticate any user (User or Employee)
 */
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      throw CustomError.unAuthorized('Authorization header missing');

    const token = authHeader.split(' ')[1];
    if (!token) throw CustomError.unAuthorized('Token not found');

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw CustomError.unAuthorized('Invalid or expired token');
    }

    // First try User table
    let user = await User.findById(decoded.id)
      .select('name email role status orgId isRegularizationEnabled')
      .populate('orgId', 'name email');
    // If not found in User, try Employee table (only Active employees)
    if (!user) {
      user = await Employee.findOne({
        _id: decoded.id,
        status: 'Active',
      })
        .populate('orgId', 'name email isRegularizationEnabled')
        .select('name email role designation orgId status');
    }

    if (!user) throw CustomError.unAuthorized('User not found or inactive');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to allow only admin/superadmin/organization
 */
export const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      // Check role
      if (!['superadmin', 'organization'].includes(req.user.role)) {
        return next(CustomError.forbidden('Access denied'));
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};
