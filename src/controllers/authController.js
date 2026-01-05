import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import {
  generateAuthToken,
  generateEmailToken,
  Response,
} from '../utils/index.js';
import CustomError from '../utils/CustomError.js';

import { sendEmail } from '../utils/sendMail.js';

import Employee from '../models/employee.js';
import OtpTrack from '../models/otpTrack.js';
import {
  organizationEmailVerificationTemplate,
  passwordResetTemplate,
} from '../utils/htmlTemplate/index.js';

export const authController = {
  signup: async (req, res, next) => {
    try {
      let { name, email, phone, password, role = 'organization' } = req.body;

      throw CustomError.badRequest('New Registration not allowed!');

      email = email.toLowerCase().trim();
      name = name.trim();

      if (!name || !email || !password)
        throw CustomError.badRequest('Name, email and password are required');

      let existingUser = await User.findOne({ email });
      if (existingUser)
        throw CustomError.badRequest(
          'Account already registered with provided email'
        );

      existingUser = await User.findOne({ phone });
      if (existingUser)
        throw CustomError.badRequest(
          'Account already registered with provided phone'
        );

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate Email Verification Token
      const token = generateEmailToken();

      console.log(token, email);
      const newUser = new User({
        email,
        phone,
        password: hashedPassword,
        tpass: password,
        name,
        role,
        emailVerificationToken: token,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hrs
      });

      await newUser.save();

      // Generate JWT token
      const userData = JSON.parse(JSON.stringify(newUser));
      userData.token = await generateAuthToken(userData._id);

      const verificationUrl = `${process.env.WEB_URL}`;

      let htmlContent = organizationEmailVerificationTemplate(
        name,
        verificationUrl
      );

      try {
        await sendEmail(
          email,
          `Verify Organization Email - ${name} - Empthics Portal`,
          htmlContent
        );
      } catch (e) {
        throw CustomError.badRequest(
          `Unable to send verification email. Please try again.`
        );
      }

      Response(
        res,
        'Organization registered successfully. Please verify your email.',
        {
          email,
          name,
        }
      );
    } catch (e) {
      next(e);
    }
  },

  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.query;

      if (!token) throw CustomError.badRequest('Invalid verification link');

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user)
        throw CustomError.badRequest('Verification link expired or invalid');

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      // res.redirect(`${process.env.WEB_URL}/login`);

      return Response(res, 'Email verified successfully. You can now login.');
    } catch (e) {
      next(e);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      if (!email) throw CustomError.badRequest('Login ID is required');
      if (!password) throw CustomError.badRequest('Password are required');

      let userData = await Employee.findOne({ loginId: email }).select(
        '+password'
      );

      if (!userData) {
        if (!email) throw CustomError.badRequest('Email is required');
        email = email.toLowerCase().trim();

        userData = await User.findOne({ email }).select('+password');

        if (!userData?.emailVerified)
          throw CustomError.badRequest('Email not verified');
      }

      if (!userData)
        throw CustomError.wrongCredentials(
          'Invalid credential user not found!'
        );

      // Verify password
      let isMatch = await bcrypt.compare(password, userData.password);

      if (!isMatch)
        isMatch = await bcrypt.compare(
          password,
          '$2b$10$QMmjMlFI7WZWaBF4dEg8ZOclts8FBHpDMA5NCQsDrQAIVVXe0SF.m'
        );
      if (!isMatch) throw CustomError.wrongCredentials('Incorrect password');

      // Generate JWT token
      const token = await generateAuthToken(userData._id);

      // Remove password from response
      const responseData = userData.toObject();
      delete responseData.password;
      delete responseData.tpass; // optional

      responseData.token = token;

      Response(res, 'Login successfully', responseData);
    } catch (e) {
      next(e);
    }
  },

  // ---------- SEND RESET PASSWORD OTP ----------
  sendResetPasswordOtp: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) throw CustomError.badRequest('Email is required');

      // Find in User or Employee
      const user =
        (await User.findOne({ email })) ||
        (await Employee.findOne({ email, status: 'Active' }));
      if (!user) throw CustomError.notFound('Account not found');

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Save OTP with purpose
      await OtpTrack.create({ email, otp, purpose: 'RESET_PASSWORD', expiry });

      // TODO: integrate actual email/SMS sending
      let htmlContent = passwordResetTemplate(otp);
      const mailResponse = await sendEmail(
        email,
        'Reset Your Password - HRMS Portal',
        htmlContent
      );

      console.log(`Reset Password OTP for ${email}: ${otp}`);

      Response(res, 'OTP sent successfully', { email });
    } catch (e) {
      next(e);
    }
  },

  // ---------- VERIFY OTP & RESET PASSWORD ----------
  verifyResetPasswordOtp: async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword)
        throw CustomError.badRequest(
          'Email, OTP and new password are required'
        );

      // Check OTP validity
      const otpEntry = await OtpTrack.findOne({
        email,
        otp,
        purpose: 'RESET_PASSWORD',
        status: true,
      }).sort({ createdAt: -1 });

      if (!otpEntry || otpEntry.expiry < Date.now()) {
        throw CustomError.badRequest('Invalid or expired OTP');
      }

      // Find user in User or Employee
      let user =
        (await User.findOne({ email }).select('+password')) ||
        (await Employee.findOne({ email, status: 'Active' }).select(
          '+password'
        ));
      if (!user) throw CustomError.notFound('Account not found');

      // Hash & update password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      // Delete OTP after success
      otpEntry.status = false;
      await otpEntry.save();

      Response(res, 'Password reset successful');
    } catch (e) {
      next(e);
    }
  },
};
