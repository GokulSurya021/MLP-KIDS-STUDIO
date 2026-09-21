const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email: email.toLowerCase(), phone, password });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        noAccount: true,
        message: 'No account found. New user? Please create a new account.'
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect username or password'
      });
    }
    const adminEmails = ['gokulsurya021@gmail.com', 'admin@mlpkids.com', (process.env.ADMIN_EMAIL || '').toLowerCase()].filter(Boolean);
    if (adminEmails.includes(user.email.toLowerCase()) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        noAccount: true,
        message: 'No account found. New user? Please create a new account.'
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = expireTime;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Verification code generated successfully!',
      otp, // Provided for immediate verification & testing
      expiresIn: '15 minutes'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error while generating reset code' });
  }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.'
      });
    }

    if (!user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Update password (hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error while resetting password' });
  }
};

// @route GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const adminEmail = (process.env.ADMIN_EMAIL || 'gokulsurya021@gmail.com').toLowerCase();
    if (user && user.email.toLowerCase() === adminEmail && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getProfile };
