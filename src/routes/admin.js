import express from 'express';
import { userController } from '../controllers/userController.js';
import { adminAuth } from '../middlewares/auth.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { adminController } from '../controllers/adminController.js';

const router = express.Router();

//@route    GET /getUserById
//@desc     Get user by id
//@access   PRIVATE
router.get('/getUserById', adminAuth, userController.getUserById);

//@route    GET /getAllUsers
//@desc     Get all users
//@access   PRIVATE
router.get('/getAllUsers', adminAuth, userController.getAllUsers);

//@route    GET /getDashboardSummary
//@desc     getDashboardSummary
//@access   PRIVATE
router.get(
  '/getDashboardSummary',
  adminAuth,
  attendanceController.getDashboardSummary
);

router.get(
  '/bulkUploadHolidays',
  adminAuth,
  adminController.bulkUploadHolidays
);

//@route    GET /getAllAttendance
//@desc     getAllAttendance
//@access   PRIVATE
router.get(
  '/getAllAttendance',
  adminAuth,
  attendanceController.getAllAttendance
);

export default router;
