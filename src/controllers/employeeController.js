import bcrypt from 'bcryptjs';

import { generateLoginId, Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';

import { sendEmail } from '../utils/sendMail.js';
import Employee from '../models/employee.js';
import { employeeCreationTemplate } from '../utils/htmlTemplate/index.js';

// Generate random 8-digit numeric password
const generateNumericPassword = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Validations
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10}$/.test(phone);
const isValidDate = (date) => !isNaN(Date.parse(date));

export const employeeController = {
  // 🔹 Create Employee
  createEmployee: async (req, res, next) => {
    try {
      let {
        name,
        email,
        phone,
        password,
        designation,
        joiningDate,
        employeeId,
      } = req.body;

      if (req.user.role !== 'organization') {
        throw CustomError.forbidden('Only organizations can add employees');
      }

      // ✅ Validations
      if (!name || !name.trim())
        throw CustomError.badRequest('Name is required');
      if (!phone || !isValidPhone(phone))
        throw CustomError.badRequest('Valid 10-digit phone number is required');
      if (!designation || !designation.trim())
        throw CustomError.badRequest('Designation is required');
      if (email && !isValidEmail(email))
        throw CustomError.badRequest('Invalid email format');
      if (!employeeId) throw CustomError.badRequest('Employee ID is required');
      if (!joiningDate)
        throw CustomError.badRequest('Joining date is required');
      if (!isValidDate(joiningDate))
        throw CustomError.badRequest('Invalid joining date');

      email = email.toLowerCase().trim();
      designation = designation.trim();
      employeeId = String(employeeId).trim();
      name = name.trim();

      // ✅ Check if employee exists in this org
      let existingEmployee = await Employee.exists({
        orgId: req.user._id,
        phone,
      });

      if (existingEmployee)
        throw CustomError.badRequest(
          'Employee with this phone number already exists in this organization'
        );

      existingEmployee = await Employee.exists({ orgId: req.user._id, email });

      if (existingEmployee)
        throw CustomError.badRequest(
          'Employee with this email already exists in this organization'
        );

      existingEmployee = await Employee.exists({
        orgId: req.user._id,
        employeeId,
      });

      if (existingEmployee)
        throw CustomError.badRequest(
          'Employee with this "EMPLOYEE ID" already exists in this organization'
        );

      // ✅ New employee
      let rawPassword = password || generateNumericPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      // const employeeId = `EMP-${Date.now()}`; // simple unique employee ID

      const newEmployee = new Employee({
        orgId: req.user._id,
        employeeId,
        name,
        phone,
        email,
        password: hashedPassword,
        tpass: rawPassword,
        designation,
        joiningDate: joiningDate || null,
        status: 'Active',
        loginId: generateLoginId(),
      });

      await newEmployee.save();

      let empData = await Employee.findOne({ _id: newEmployee._id });

      Response(res, 'Employee created successfully', empData);
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Re-Send Employee Onboarding Email
  sendOnboardingMail: async (req, res, next) => {
    try {
      const { id } = req.body;

      if (!id) throw CustomError.badRequest('Employee ID is required');

      if (req.user.role !== 'organization') {
        throw CustomError.forbidden(
          'Only organizations can send onboarding mail'
        );
      }

      const employee = await Employee.findOne({
        _id: id,
        orgId: req.user._id,
      }).select('+tpass');

      if (!employee) throw CustomError.notFound('Employee not found');
      if (!employee.email)
        throw CustomError.badRequest('Employee does not have email');

      const payload = {
        organizationName: req.user.name,
        employeeId: employee.employeeId,
        loginId: employee.loginId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        password: employee.tpass, // same like first mail
      };

      const htmlContent = employeeCreationTemplate(payload);

      Response(res, 'Employee onboarding email sent successfully', {
        email: employee.email,
        employeeId: employee.employeeId,
        sentAt: employee.onboardingMailSentAt,
      });

      await sendEmail(
        employee.email,
        `Welcome to [${req.user.name}]! Your Employee Account Details`,
        htmlContent
      );

      // 🔹 Update tracking
      employee.isOnboardingMailSent = true;
      employee.onboardingMailSentAt = new Date();

      await employee.save();
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Get employees of org
  getEmployees: async (req, res, next) => {
    try {
      if (req.user.role !== 'organization') {
        throw CustomError.forbidden('Only organizations can view employees');
      }

      const { page = 1, search = '', status } = req.query;
      const limit = 50;
      const skip = (parseInt(page) - 1) * limit;

      const filter = {
        orgId: req.user._id,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
        ],
      };

      if (status) filter.status = status;

      const total = await Employee.countDocuments(filter);
      const employees = await Employee.find(filter)
        .select('-password -tpass')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      Response(res, 'Employees fetched successfully', {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        limit,
        employees,
      });
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Update Employee
  updateEmployee: async (req, res, next) => {
    try {
      const {
        id,
        name,
        email,
        phone,
        password,
        designation,
        joiningDate,
        status,
      } = req.body;

      if (req.user.role !== 'organization') {
        throw CustomError.forbidden('Only organizations can update employees');
      }

      const employee = await Employee.findOne({ orgId: req.user._id, _id: id });
      if (!employee) throw CustomError.notFound('Employee not found');

      if (email && !isValidEmail(email))
        throw CustomError.badRequest('Invalid email format');
      if (phone && !isValidPhone(phone))
        throw CustomError.badRequest('Invalid 10-digit phone number');
      if (joiningDate && !isValidDate(joiningDate))
        throw CustomError.badRequest('Invalid joining date');

      // ✅ Duplicate check in org
      if (
        (phone || email) &&
        (phone !== employee.phone || email !== employee.email)
      ) {
        const duplicate = await Employee.findOne({
          orgId: req.user._id,
          _id: { $ne: employee._id },
          $or: [{ phone }, { email }],
        });
        if (duplicate)
          throw CustomError.badRequest(
            'Phone or email already exists in this org'
          );
      }

      if (name) employee.name = name;
      if (email) employee.email = email;
      if (phone) employee.phone = phone;
      if (designation) employee.designation = designation;
      if (joiningDate) employee.joiningDate = joiningDate;
      if (status) employee.status = status;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        employee.password = await bcrypt.hash(password, salt);
        employee.tpass = password;
      }

      await employee.save();

      Response(res, 'Employee updated successfully', {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        status: employee.status,
      });
    } catch (e) {
      next(e);
    }
  },

  // 🔹 Delete (mark inactive)
  deleteEmployee: async (req, res, next) => {
    try {
      const { id } = req.body;

      if (req.user.role !== 'organization') {
        throw CustomError.forbidden('Only organizations can delete employees');
      }

      const employee = await Employee.findOne({ orgId: req.user._id, _id: id });
      if (!employee) throw CustomError.notFound('Employee not found');

      employee.status = 'Inactive';
      await employee.save();

      Response(res, 'Employee marked as inactive', employee);
    } catch (e) {
      next(e);
    }
  },

  // ✅ Update basic employee profile
  updateUserProfile: async (req, res, next) => {
    try {
      const userId = req.user._id; // logged-in user id (from auth middleware)
      const { name, phone, designation, photoUrl } = req.body;

      const updatedEmployee = await Employee.findByIdAndUpdate(
        userId,
        { name, phone, designation, photoUrl },
        { new: true, runValidators: true }
      );

      if (!updatedEmployee) throw CustomError.notFound('Employee not found');

      Response(res, 'Profile updated successfully', updatedEmployee);
    } catch (e) {
      next(e);
    }
  },

  // ✅ Update bank details
  updateBankDetails: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { accountHolderName, bankName, branch, accountNumber, ifscCode } =
        req.body;

      const updatedEmployee = await Employee.findByIdAndUpdate(
        userId,
        {
          bankDetails: {
            accountHolderName,
            bankName,
            branch,
            accountNumber,
            ifscCode,
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedEmployee) throw CustomError.notFound('Employee not found');

      Response(
        res,
        'Bank details updated successfully',
        updatedEmployee.bankDetails
      );
    } catch (e) {
      next(e);
    }
  },

  // ✅ Add or update work experience
  updateExperience: async (req, res, next) => {
    try {
      const userId = req.user._id;
      let { experiences, resumeUrl } = req.body;

      // Nothing to update
      if (!experiences && !resumeUrl) {
        throw CustomError.badRequest('Nothing to update');
      }

      const updateData = {};
      if (experiences && typeof experiences === 'string')
        experiences = JSON.parse(experiences);
      if (Array.isArray(experiences)) updateData.workExperience = experiences;
      if (resumeUrl) updateData.resumeUrl = resumeUrl;

      const updatedEmployee = await Employee.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedEmployee) throw CustomError.notFound('Employee not found');

      Response(res, 'Employee profile updated successfully', {
        workExperience: updatedEmployee.workExperience,
        resumeUrl: updatedEmployee.resumeUrl,
      });
    } catch (e) {
      next(e);
    }
  },
};
