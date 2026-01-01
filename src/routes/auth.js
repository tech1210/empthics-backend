import express from 'express';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { employeeController } from '../controllers/employeeController.js';
import { upload } from '../middlewares/upload.js';
import { uploadController } from '../controllers/uploadController.js';

const router = express.Router();

//@route    POST /signup
//@desc     Signin
//@access   PUBLIC
router.post('/signup', authController.signup);

//@route    get /verifyEmail
//@desc     verifyEmail
//@access   PRIVATE
router.get('/verifyEmail', authController.verifyEmail);

//@route    POST /login
//@desc     Login
//@access   PUBLIC
router.post('/login', authController.login);

//@route    POST /sendResetPasswordOtp
//@desc     sendResetPasswordOtp
//@access   PUBLIC
router.post('/sendResetPasswordOtp', authController.sendResetPasswordOtp);

//@route    POST /verifyResetPasswordOtp
//@desc     verifyResetPasswordOtp
//@access   PUBLIC
router.post('/verifyResetPasswordOtp', authController.verifyResetPasswordOtp);

//@route    GET /getUserProfile
//@desc     Get user profile
//@access   PRIVATE
router.get('/getUserProfile', auth, userController.getUserProfile);

// @route    PUT /updateUserProfile
// @desc     Update employee profile
// @access   PRIVATE
router.put('/updateUserProfile', auth, employeeController.updateUserProfile);

// @route    PUT /updateBankDetails
// @desc     Update bank details
// @access   PRIVATE
router.put('/updateBankDetails', auth, employeeController.updateBankDetails);

// @route    PUT /updateExperience
// @desc     Update work experience
// @access   PRIVATE
router.put('/updateExperience', auth, employeeController.updateExperience);

// @route    POST /uploadFile
// @desc     Upload file to ImageKit
// @access   PRIVATE
router.post(
  '/uploadFile',
  auth,
  upload.single('file'),
  uploadController.uploadFile
);

export default router;
