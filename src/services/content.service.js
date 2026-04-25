const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

const uploadContent = async ({ title, description, subject, file, uploadedBy, startTime, endTime, rotationDuration }) => {
  if (!file) throw { statusCode: 400, message: 'File is required' };
  if (!title) throw { statusCode: 400, message: 'Title is required' };
  if (!subject) throw { statusCode: 400, message: 'Subject is required' };

  const fileUrl = `/uploads/${file.filename}`;
  const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');

  const result = await query(
    `INSERT INTO content 
      (title, description, subject, file_url, file_path, file_type, file_size, uploaded_by, status, start_time, end_time, rotation_duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
     RETURNING *`,
    [
      title,
      description || null,
      subject.toLowerCase(),
      fileUrl,
      file.path,
      fileType,
      file.size,
      uploadedBy,
      startTime || null,
      endTime || null,
      rotationDuration || 5,
    ]
  );

  const content = result.rows[0];

  // Auto-create or find slot for this subject + teacher
  await query(
    `INSERT INTO content_slots (subject, teacher_id)
     VALUES ($1, $2)
     ON CONFLICT (subject, teacher_id) DO NOTHING`,
    [subject.toLowerCase(), uploadedBy]
  );

  const slotResult = await query(
    'SELECT id FROM content_slots WHERE subject = $1 AND teacher_id = $2',
    [subject.toLowerCase(), uploadedBy]
  );

  if (slotResult.rows.length > 0) {
    const slotId = slotResult.rows[0].id;
    // Get next rotation order
    const orderResult = await query(
      'SELECT COALESCE(MAX(rotation_order), -1) + 1 AS next_order FROM content_schedule WHERE slot_id = $1',
      [slotId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    await query(
      'INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration) VALUES ($1, $2, $3, $4)',
      [content.id, slotId, nextOrder, rotationDuration || 5]
    );
  }

  return content;
};

const getTeacherContent = async (teacherId, { status, subject, page = 1, limit = 10 }) => {
  let conditions = ['c.uploaded_by = $1'];
  let params = [teacherId];
  let idx = 2;

  if (status) {
    conditions.push(`c.status = $${idx++}`);
    params.push(status);
  }
  if (subject) {
    conditions.push(`c.subject = $${idx++}`);
    params.push(subject.toLowerCase());
  }

  const offset = (page - 1) * limit;
  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM content c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT c.*, u.name AS uploader_name,
            p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return {
    content: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getAllContent = async ({ status, subject, teacher, page = 1, limit = 10 }) => {
  let conditions = [];
  let params = [];
  let idx = 1;

  if (status) {
    conditions.push(`c.status = $${idx++}`);
    params.push(status);
  }
  if (subject) {
    conditions.push(`c.subject = $${idx++}`);
    params.push(subject.toLowerCase());
  }
  if (teacher) {
    conditions.push(`c.uploaded_by = $${idx++}`);
    params.push(teacher);
  }

  const offset = (page - 1) * limit;
  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM content c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT c.*, u.name AS uploader_name, p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return {
    content: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const approveContent = async (contentId, principalId) => {
  const result = await query(
    `UPDATE content
     SET status = 'approved', approved_by = $1, approved_at = NOW()
     WHERE id = $2 AND status = 'pending'
     RETURNING *`,
    [principalId, contentId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Content not found or not in pending state' };
  }

  return result.rows[0];
};

const rejectContent = async (contentId, principalId, rejectionReason) => {
  if (!rejectionReason || rejectionReason.trim() === '') {
    throw { statusCode: 400, message: 'Rejection reason is required' };
  }

  const result = await query(
    `UPDATE content
     SET status = 'rejected', approved_by = $1, rejection_reason = $2, approved_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [principalId, rejectionReason, contentId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Content not found or not in pending state' };
  }

  return result.rows[0];
};

const getContentById = async (contentId) => {
  const result = await query(
    `SELECT c.*, u.name AS uploader_name, p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     WHERE c.id = $1`,
    [contentId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Content not found' };
  }

  return result.rows[0];
};

module.exports = {
  uploadContent,
  getTeacherContent,
  getAllContent,
  approveContent,
  rejectContent,
  getContentById,
};
