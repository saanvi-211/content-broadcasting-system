require('dotenv').config();
const { query } = require('./database');

const migrate = async () => {
  console.log('Running migrations...');

  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('principal', 'teacher')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ users table');

    // Content table
    await query(`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        rotation_duration INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ content table');

    // Content slots table (subject-based grouping)
    await query(`
      CREATE TABLE IF NOT EXISTS content_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject VARCHAR(100) NOT NULL,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(subject, teacher_id)
      );
    `);
    console.log('✓ content_slots table');

    // Content schedule table
    await query(`
      CREATE TABLE IF NOT EXISTS content_schedule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        slot_id UUID NOT NULL REFERENCES content_slots(id) ON DELETE CASCADE,
        rotation_order INTEGER NOT NULL DEFAULT 0,
        duration INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ content_schedule table');

    // Indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_content_subject ON content(subject);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_content_slots_teacher ON content_slots(teacher_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_schedule_slot_id ON content_schedule(slot_id);`);
    console.log('✓ indexes created');

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
