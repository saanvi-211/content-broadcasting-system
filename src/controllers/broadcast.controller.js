const schedulingService = require('../services/scheduling.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /content/live/:teacherId
 * Public endpoint — no auth required
 * Returns currently active/live content for a given teacher
 */
const getLiveContent = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    // Validate teacher exists
    const teacher = await schedulingService.getTeacherById(teacherId);
    if (!teacher) {
      // Return empty rather than error (edge case: invalid teacher)
      return successResponse(res, { available: false, message: 'No content available', content: null });
    }

    const result = await schedulingService.getLiveContent(teacherId, subject || null);
    return successResponse(res, result, result.message);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch live content', error.statusCode || 500);
  }
};

module.exports = { getLiveContent };
