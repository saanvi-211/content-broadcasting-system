# 📡 Content Broadcasting System

A backend API system for broadcasting educational content from teachers to students, with role-based access, approval workflows, and subject-based scheduling/rotation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| File Upload | Multer (local disk) |
| API Docs | Swagger/OpenAPI |
| Rate Limiting | express-rate-limit |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/content-broadcasting-system.git
cd content-broadcasting-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 4. Create the database
```bash
psql -U postgres -c "CREATE DATABASE content_broadcasting;"
```

### 5. Run migrations
```bash
npm run migrate
```

### 6. Seed demo users
```bash
npm run seed
```

### 7. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3000`
API Docs: `http://localhost:3000/api-docs`

---

## 🔐 Demo Credentials

After running the seed:

| Role | Email | Password |
|------|-------|----------|
| Principal | principal@school.com | password123 |
| Teacher 1 | teacher1@school.com | password123 |
| Teacher 2 | teacher2@school.com | password123 |

---

## 📋 API Overview

### Auth Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, returns JWT |
| GET | `/auth/profile` | JWT | Get current user profile |

### Teacher Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/content/upload` | Teacher | Upload content with file |
| GET | `/content/my` | Teacher | View own content |

### Principal Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/content/all` | Principal | View all content |
| GET | `/content/pending` | Principal | View pending content |
| PATCH | `/content/:id/approve` | Principal | Approve content |
| PATCH | `/content/:id/reject` | Principal | Reject with reason |

### Public Broadcasting (Students)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/content/live/:teacherId` | None | Get live content |
| GET | `/content/live/:teacherId?subject=maths` | None | Filter by subject |

---

## 📤 Upload Content (Teacher)

```bash
curl -X POST http://localhost:3000/content/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Chapter 1 Notes" \
  -F "subject=maths" \
  -F "description=Introduction to algebra" \
  -F "startTime=2026-04-25T09:00:00Z" \
  -F "endTime=2026-04-25T18:00:00Z" \
  -F "rotationDuration=5" \
  -F "file=@/path/to/image.png"
```

---

## 🔄 Scheduling Logic

- Content needs `startTime` and `endTime` to ever go live
- Multiple approved content per subject rotates based on `rotationDuration` (minutes)
- Example: Maths has [A(5min), B(5min), C(5min)]
  - 0-5min → A is live
  - 5-10min → B is live
  - 10-15min → C is live
  - 15min → loops back to A

---

## 🧪 Testing the Live Endpoint

```bash
# Get teacher's ID from /auth/profile or seed data
curl http://localhost:3000/content/live/TEACHER_UUID

# Filter by subject
curl http://localhost:3000/content/live/TEACHER_UUID?subject=maths
```

---

## 🏗️ Folder Structure

```
src/
├── app.js                    # Express app entry
├── config/
│   ├── database.js           # PostgreSQL pool
│   ├── migrate.js            # DB migration runner
│   ├── seed.js               # Demo data seeder
│   └── swagger.js            # API docs config
├── controllers/
│   ├── auth.controller.js
│   ├── content.controller.js
│   └── broadcast.controller.js
├── middlewares/
│   ├── auth.middleware.js    # JWT + RBAC
│   ├── upload.middleware.js  # Multer
│   └── rateLimiter.middleware.js
├── routes/
│   ├── auth.routes.js
│   ├── content.routes.js
│   └── broadcast.routes.js
├── services/
│   ├── auth.service.js
│   ├── content.service.js
│   └── scheduling.service.js  # Core rotation logic
└── utils/
    ├── jwt.js
    └── response.js
uploads/                        # Local file storage
architecture-notes.txt          # System design decisions
```

---

## 🌐 Deployment (Render.com — Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set environment variables from `.env.example`
5. Build command: `npm install`
6. Start command: `node src/app.js`
7. Add a free PostgreSQL instance on Render
8. Run migrations: use Render's shell → `npm run migrate && npm run seed`

---

## ⚠️ Assumptions & Notes

- File storage is local disk (S3 integration is noted as bonus)
- Rate limiting is in-memory (for production, use Redis-backed limiter)
- Rotation epoch is midnight UTC daily — resets each day
- Content slots are auto-created on first upload for a subject
- All subjects are stored lowercase for consistency

---

## 📖 API Documentation

Interactive Swagger docs available at: `http://localhost:3000/api-docs`
