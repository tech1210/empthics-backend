import express from 'express';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';
import { auth, adminAuth } from '../middlewares/auth.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { employeeController } from '../controllers/employeeController.js';
import { regularizationController } from '../controllers/regularizationController.js';
import { LeaveController } from '../controllers/leaveController.js';

const router = express.Router();

//@route    POST /createEmployee
//@desc     Create Employee
//@access   PRIVATE
router.post('/createEmployee', adminAuth, employeeController.createEmployee);

//@route    POST /sendOnboardingMail
//@desc     Create Employee
//@access   PRIVATE
router.post(
  '/sendOnboardingMail',
  adminAuth,
  employeeController.sendOnboardingMail
);

//@route    GET /getEmployees
//@desc     Get all employees of organization
//@access   PRIVATE
router.get('/getEmployees', adminAuth, employeeController.getEmployees);

//@route    PUT /updateEmployee
//@desc     Update employee details
//@access   PRIVATE
router.put('/updateEmployee', adminAuth, employeeController.updateEmployee);

//@route    DELETE /deleteEmployee
//@desc     Delete an employee
//@access   PRIVATE
router.post('/deleteEmployee', adminAuth, employeeController.deleteEmployee);

//@route    POST /markAttendance
//@desc     markAttendance
//@access   PRIVATE
router.post('/markAttendance', auth, attendanceController.markAttendance);

// RegularizationRequest
router.post(
  '/toggleRegularization',
  adminAuth,
  regularizationController.toggleRegularization
);
router.post('/createRequest', auth, regularizationController.createRequest);
router.get('/getOrgRequests', auth, regularizationController.getOrgRequests);
router.post('/reviewRequest', auth, regularizationController.reviewRequest);

// Leave
router.post('/createLeave', auth, attendanceController.createLeave);

// Attendance Reports
router.get(
  '/getDailyAttendanceReport',
  auth,
  attendanceController.getDailyAttendanceReport
);

router.get(
  '/getCustomAttendanceReport',
  auth,
  attendanceController.getCustomAttendanceReport
);

router.get(
  '/getAttendanceSummary',
  auth,
  attendanceController.getAttendanceSummary
);

// User Profile
router.get('/getUserProfile', auth, userController.getUserProfile);

// Leave Type CRUD
router.post('/createLeaveType', auth, LeaveController.createLeaveType);
router.get('/getLeaveTypes', auth, LeaveController.getLeaveTypes);
router.put('/updateLeaveType', auth, LeaveController.updateLeaveType);
router.delete('/deleteLeaveType', auth, LeaveController.deleteLeaveType);

// Employee Leaves
router.post('/applyLeave', auth, LeaveController.applyLeave);
router.get('/myLeaves', auth, LeaveController.myLeaves);

// Manager
router.post('/approveLeave', auth, LeaveController.approveLeave);

export default router;
