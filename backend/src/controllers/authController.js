const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const OtpVerification = require('../models/OtpVerification');
const { generateToken } = require('../utils/jwt');
const { sendOtpEmail } = require('../utils/sendEmail');

// POST /api/students/register
exports.registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, phone, courseName, trainerName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'Password must contain letters, numbers, and special characters (e.g. @$!%*?&#)'
      });
    }

    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      courseName,
      trainerName
    });

    const token = generateToken({ id: student._id, role: 'student', email: student.email });

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        courseName: student.courseName,
        trainerName: student.trainerName,
        status: student.status
      }
    });
  } catch (error) {
    next(error);
  }
};

function updateDailyStreak(student) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!student.lastActiveDate) {
    student.dailyStreak = 1;
    student.lastActiveDate = todayStr;
  } else if (student.lastActiveDate !== todayStr) {
    const lastDate = new Date(student.lastActiveDate);
    const today = new Date(todayStr);
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      student.dailyStreak = (student.dailyStreak || 0) + 1;
    } else if (diffDays > 1) {
      student.dailyStreak = 1;
    }
    student.lastActiveDate = todayStr;
  }
}

// POST /api/students/login
exports.loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (student.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    student.lastLogin = new Date();
    updateDailyStreak(student);
    await student.save();

    const token = generateToken({ id: student._id, role: 'student', email: student.email });

    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        courseName: student.courseName,
        trainerName: student.trainerName,
        status: student.status,
        mockTestAllowed: student.mockTestAllowed,
        dailyStreak: student.dailyStreak || 1,
        gameCoins: student.gameCoins ?? 200,
        lastActiveDate: student.lastActiveDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/login
exports.loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    let admin = await Admin.findOne({ username });

    // Seed default admin if none exists
    if (!admin && username === 'admin') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password || 'admin@123', salt);
      admin = await Admin.create({ username: 'admin', password: hashedPassword });
    }

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken({ id: admin._id, role: 'admin', username: admin.username });

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/students/forgot-password/request
exports.requestForgotPassword = async (req, res, next) => {
  try {
    const { phone, email } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier) {
      return res.status(400).json({ message: 'Registered student email address is required' });
    }

    let student = null;
    if (identifier.includes('@') || email) {
      student = await Student.findOne({ email: identifier.toLowerCase() });
    } else {
      const cleanDigits = identifier.replace(/[^0-9]/g, '');
      const last10 = cleanDigits.slice(-10);
      student = await Student.findOne({
        $or: [{ phone: identifier }, { phone: cleanDigits }, { phone: { $regex: last10 + '$' } }]
      });
    }

    if (!student) {
      return res.status(404).json({
        message: 'No registered student account found with this email address'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert verification record strictly keyed by student email
    await OtpVerification.findOneAndUpdate(
      { email: student.email.toLowerCase() },
      {
        phone: student.phone || '',
        email: student.email.toLowerCase(),
        otp,
        expiryTime,
        verified: false
      },
      { upsert: true, new: true }
    );

    // Send real email OTP via Nodemailer
    let emailSent = false;
    let mailErrorReason = '';
    if (student.email) {
      try {
        await sendOtpEmail({
          toEmail: student.email,
          studentName: student.name,
          otp,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('[EMAIL ERROR] Failed sending OTP email:', mailErr.message);
        mailErrorReason = mailErr.message;
      }
    }

    const isEmailRequest = Boolean(email && email.trim()) || identifier.includes('@');
    if (isEmailRequest && !emailSent) {
      return res.status(500).json({
        success: false,
        message: mailErrorReason || 'Unable to send OTP email. Please ensure EMAIL_USER and EMAIL_PASS are configured in backend/.env'
      });
    }

    let maskedEmail = '';
    if (student.email && student.email.includes('@')) {
      const parts = student.email.split('@');
      const prefix = parts[0];
      const domain = parts[1];
      maskedEmail = `${prefix.slice(0, Math.min(2, prefix.length))}***@${domain}`;
    }

    const maskedPhone = student.phone
      ? `${student.phone.slice(0, 2)}******${student.phone.slice(-2)}`
      : '';

    const targetInfo = maskedEmail || maskedPhone || 'your registered account';

    res.json({
      success: true,
      message: `OTP sent successfully to ${targetInfo}`,
      email: student.email,
      phone: student.phone,
      maskedEmail,
      maskedPhone,
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/students/forgot-password/verify-otp
exports.verifyOtpOnly = async (req, res, next) => {
  try {
    const { phone, email, otp } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP are required' });
    }

    let query;
    if (identifier.includes('@') || email) {
      query = { email: identifier.toLowerCase() };
    } else {
      const cleanDigits = identifier.replace(/[^0-9]/g, '');
      const last10 = cleanDigits.slice(-10);
      query = {
        $or: [{ phone: identifier }, { phone: cleanDigits }, { phone: { $regex: last10 + '$' } }]
      };
    }

    const record = await OtpVerification.findOne(query);

    if (!record || record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct 6-digit OTP.' });
    }

    if (new Date() > record.expiryTime) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    record.verified = true;
    await record.save();

    res.json({
      success: true,
      message: 'OTP verified successfully! Please enter your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/students/forgot-password/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { phone, email, newPassword } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'Password must contain letters, numbers, and special characters (e.g. @$!%*?&#)'
      });
    }

    let query;
    if (identifier.includes('@') || email) {
      query = { email: identifier.toLowerCase(), verified: true };
    } else {
      const cleanDigits = identifier.replace(/[^0-9]/g, '');
      const last10 = cleanDigits.slice(-10);
      query = {
        $or: [{ phone: identifier }, { phone: cleanDigits }, { phone: { $regex: last10 + '$' } }],
        verified: true
      };
    }

    const record = await OtpVerification.findOne(query);

    if (!record) {
      return res.status(403).json({ message: 'Please verify the OTP before setting a new password' });
    }

    if (new Date() > record.expiryTime) {
      return res.status(400).json({ message: 'Verification session expired. Please request OTP again.' });
    }

    // Strictly match the student by their verified email address!
    let student = null;
    if (record.email) {
      student = await Student.findOne({ email: record.email.toLowerCase() });
    } else if (record.phone) {
      student = await Student.findOne({ phone: record.phone });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    await student.save();

    await OtpVerification.deleteOne({ _id: record._id });

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Legacy POST /api/students/forgot-password/verify (Backward compatibility)
exports.verifyForgotPassword = async (req, res, next) => {
  try {
    const { email, phone, otp, newPassword } = req.body;
    const identifier = (email || phone || '').trim();
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    let query;
    if (identifier.includes('@') || email) {
      query = { email: identifier.toLowerCase() };
    } else {
      const cleanDigits = identifier.replace(/[^0-9]/g, '');
      const last10 = cleanDigits.slice(-10);
      query = {
        $or: [{ phone: identifier }, { phone: cleanDigits }, { phone: { $regex: last10 + '$' } }]
      };
    }

    const record = await OtpVerification.findOne(query);

    if (!record || record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > record.expiryTime) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    let student = null;
    if (record.email) {
      student = await Student.findOne({ email: record.email.toLowerCase() });
    } else if (record.phone) {
      student = await Student.findOne({ phone: record.phone });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    await student.save();

    await OtpVerification.deleteOne({ _id: record._id });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/profile
exports.getStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    updateDailyStreak(student);
    await student.save();
    res.json(student);
  } catch (error) {
    next(error);
  }
};
