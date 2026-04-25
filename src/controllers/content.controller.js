const contentService = require('../services/content.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Teacher: Upload content
const uploadContent = async (req, res) => {
  try {
    const { title, description, subject, startTime, endTime, rotationDuration } = req.body;
    const file = req.file;

    const content = await contentService.uploadContent({
      title,
      description,
      subject,
      file,
      uploadedBy: req.user.id,
      startTime,
      endTime,
      rotationDuration: rotationDuration ? parseInt(rotationDuration) : 5,
    });

    return successResponse(res, content, 'Content uploaded successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Upload failed', error.statusCode || 500);
  }
};

// Teacher: Get own content
const getMyContent = async (req, res) => {
  try {
    const { status, subject, page, limit } = req.query;
    const result = await contentService.getTeacherContent(req.user.id, {
      status,
      subject,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return paginatedResponse(res, result.content, result.pagination, 'Content fetched');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch content', error.statusCode || 500);
  }
};

// Principal: Get all content
const getAllContent = async (req, res) => {
  try {
    const { status, subject, teacher, page, limit } = req.query;
    const result = await contentService.getAllContent({
      status,
      subject,
      teacher,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return paginatedResponse(res, result.content, result.pagination, 'Content fetched');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch content', error.statusCode || 500);
  }
};

// Principal: Get pending content
const getPendingContent = async (req, res) => {
  try {
    const result = await contentService.getAllContent({
      status: 'pending',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });
    return paginatedResponse(res, result.content, result.pagination, 'Pending content fetched');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch pending content', error.statusCode || 500);
  }
};

// Principal: Approve content
const approveContent = async (req, res) => {
  try {
    const content = await contentService.approveContent(req.params.id, req.user.id);
    return successResponse(res, content, 'Content approved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Approval failed', error.statusCode || 500);
  }
};

// Principal: Reject content
const rejectContent = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const content = await contentService.rejectContent(req.params.id, req.user.id, rejectionReason);
    return successResponse(res, content, 'Content rejected');
  } catch (error) {
    return errorResponse(res, error.message || 'Rejection failed', error.statusCode || 500);
  }
};

// Get single content by ID (teacher or principal)
const getContentById = async (req, res) => {
  try {
    const content = await contentService.getContentById(req.params.id);
    // Teachers can only see their own content
    if (req.user.role === 'teacher' && content.uploaded_by !== req.user.id) {
      return errorResponse(res, 'Not authorized to view this content', 403);
    }
    return successResponse(res, content, 'Content fetched');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch content', error.statusCode || 500);
  }
};

module.exports = {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getContentById,
};
