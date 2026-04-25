require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./database');

const seed = async () => {
  console.log('Seeding database...');

  try {
    const passwordHash = await bcrypt.hash('password123', 12);

    // Seed principal
    await query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Principal Admin', 'principal@school.com', passwordHash, 'principal']);

    // Seed teachers
    await query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Teacher One', 'teacher1@school.com', passwordHash, 'teacher']);

    await query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Teacher Two', 'teacher2@school.com', passwordHash, 'teacher']);

    console.log('\n✅ Seed completed!');
    console.log('\nDemo Credentials:');
    console.log('Principal: principal@school.com / password123');
    console.log('Teacher 1: teacher1@school.com / password123');
    console.log('Teacher 2: teacher2@school.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
