const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return errorResponse(res, 'name, email, password and role are required', 400);
    }
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }
    const data = await authService.register({ name, email, password, role });
    return successResponse(res, data, 'Registration successful', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Registration failed', error.statusCode || 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }
    const data = await authService.login({ email, password });
    return successResponse(res, data, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Login failed', error.statusCode || 500);
  }
};

const getProfile = async (req, res) => {
  return successResponse(res, req.user, 'Profile fetched');
};

module.exports = { register, login, getProfile };
