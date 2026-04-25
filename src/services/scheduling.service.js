const { query } = require('../config/database');

/**
 * Scheduling Logic:
 * 
 * For each teacher, we get all approved content within its active time window.
 * Content is grouped by subject, and within each subject, rotated based on duration.
 * 
 * Rotation algorithm:
 * 1. Get all approved, active (within start_time/end_time) content for teacher
 * 2. Group by subject
 * 3. For each subject, determine which content is "active" now using rotation_order and duration
 * 4. The rotation is deterministic: based on current time and total cycle duration
 *    - Total cycle = sum of all durations in subject
 *    - elapsed = (currentTime - epoch) % totalCycleDuration
 *    - Walk through sorted items by rotation_order, accumulating duration
 *    - Active item = first item where accumDuration > elapsed
 * 
 * Edge cases handled:
 * - No approved content → empty response
 * - Content approved but no active schedule window → empty response
 * - Invalid subject filter → empty response
 */

const getLiveContent = async (teacherId, subject = null) => {
  const now = new Date();

  // Build query for active, approved content
  let conditions = [
    "c.uploaded_by = $1",
    "c.status = 'approved'",
    "c.start_time IS NOT NULL",
    "c.end_time IS NOT NULL",
    "c.start_time <= $2",
    "c.end_time >= $2",
  ];
  let params = [teacherId, now];
  let idx = 3;

  if (subject) {
    conditions.push(`c.subject = $${idx++}`);
    params.push(subject.toLowerCase());
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const result = await query(
    `SELECT c.id, c.title, c.description, c.subject, c.file_url, c.file_type,
            c.file_size, c.start_time, c.end_time, c.rotation_duration,
            cs_sched.rotation_order, cs_sched.duration AS slot_duration,
            u.name AS teacher_name
     FROM content c
     LEFT JOIN content_schedule cs_sched ON cs_sched.content_id = c.id
     LEFT JOIN users u ON c.uploaded_by = u.id
     ${whereClause}
     ORDER BY c.subject, cs_sched.rotation_order ASC`,
    params
  );

  if (result.rows.length === 0) {
    return { available: false, message: 'No content available', content: null };
  }

  // Group by subject
  const bySubject = {};
  for (const row of result.rows) {
    if (!bySubject[row.subject]) bySubject[row.subject] = [];
    bySubject[row.subject].push(row);
  }

  // Determine active content per subject
  const activeContent = {};
  const nowMs = now.getTime();

  for (const [subj, items] of Object.entries(bySubject)) {
    if (items.length === 0) continue;

    // Sort by rotation_order
    items.sort((a, b) => (a.rotation_order ?? 0) - (b.rotation_order ?? 0));

    // Total cycle duration in ms
    const totalCycleMs = items.reduce((sum, item) => sum + (item.slot_duration || item.rotation_duration || 5) * 60 * 1000, 0);

    if (totalCycleMs === 0) {
      activeContent[subj] = items[0];
      continue;
    }

    // Elapsed time within cycle — use a fixed reference epoch (midnight UTC of today)
    const epochStart = new Date(now);
    epochStart.setUTCHours(0, 0, 0, 0);
    const elapsed = (nowMs - epochStart.getTime()) % totalCycleMs;

    let accumulated = 0;
    let active = items[0]; // fallback to first

    for (const item of items) {
      const itemDurationMs = (item.slot_duration || item.rotation_duration || 5) * 60 * 1000;
      accumulated += itemDurationMs;
      if (elapsed < accumulated) {
        active = item;
        break;
      }
    }

    activeContent[subj] = active;
  }

  const activeList = Object.values(activeContent);

  if (activeList.length === 0) {
    return { available: false, message: 'No content available', content: null };
  }

  // If subject filter provided, return single or empty
  if (subject) {
    const subjectContent = activeContent[subject.toLowerCase()];
    if (!subjectContent) {
      return { available: false, message: 'No content available', content: null };
    }
    return { available: true, message: 'Content available', content: subjectContent };
  }

  return { available: true, message: 'Content available', content: activeList };
};

const getTeacherById = async (teacherId) => {
  const result = await query(
    'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
    [teacherId, 'teacher']
  );
  return result.rows[0] || null;
};

module.exports = { getLiveContent, getTeacherById };
