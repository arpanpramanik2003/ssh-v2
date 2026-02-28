# 🏗️ Database & API Architecture

## Table of Contents
- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Database Schema](#database-schema)
- [Entity Relationships](#entity-relationships)
- [API Routes](#api-routes)
- [Auth & Authorization](#auth--authorization)
- [File Storage](#file-storage)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Query Patterns](#query-patterns)
- [Error Handling](#error-handling)

---

## Overview

Smart Student Hub v2 is a **Next.js full-stack application**. The API layer lives inside Next.js as **App Router API Routes** (`app/api/*/route.js`) served from the same process as the UI — no separate backend server.

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| API | Next.js Route Handlers (`app/api/`) |
| ORM | Sequelize |
| DB (dev) | SQLite — auto-created at `smart_student_hub.db` |
| DB (prod) | Supabase PostgreSQL |
| Auth | JWT — signed/verified server-side in API routes |
| Files (dev) | Local disk → `public/uploads/` |
| Files (prod) | Cloudinary CDN |

---

## Architecture Diagram

```
Browser (React + Tailwind)
        │
        │  HTTP  (same origin — no CORS needed in dev)
        ▼
┌───────────────────────────────────────────────┐
│           Next.js Application                 │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │  App Router Pages  (app/**/page.jsx)│    │
│   │  – Client components                │    │
│   │  – Protected by middleware.js       │    │
│   └─────────────────────────────────────┘    │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │  API Route Handlers  (app/api/**)   │    │
│   │  – JWT auth via lib/auth.js         │    │
│   │  – DB queries via lib/database.js   │    │
│   │  – File ops via lib/cloudStorage.js │    │
│   └─────────────────────────────────────┘    │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │  lib/database.js                    │    │
│   │  Sequelize ORM                      │    │
│   └──────────────┬──────────────────────┘    │
└──────────────────┼────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   SQLite (dev)      │
        │   PostgreSQL (prod) │
        └─────────────────────┘
```

---

## Database Schema

### USER Table (`users`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO | Unique identifier |
| `name` | STRING | NOT NULL | Full name |
| `email` | STRING | NOT NULL, UNIQUE | Login email |
| `password` | STRING | NOT NULL | bcrypt hash |
| `role` | ENUM | DEFAULT 'student' | `student` / `faculty` / `admin` |
| `department` | STRING | NULLABLE | Department/branch |
| `year` | INTEGER | NULLABLE | Academic year |
| `studentId` | STRING | UNIQUE, NULLABLE | Institution student ID |
| `program` | STRING | NULLABLE | Degree program |
| `programCategory` | STRING | NULLABLE | Category (Engineering, Science…) |
| `specialization` | STRING | NULLABLE | Sub-specialization |
| `isActive` | BOOLEAN | DEFAULT true | Account active state |
| `profilePicture` | STRING | NULLABLE | URL or `/uploads/avatars/…` path |
| `phone` | STRING | NULLABLE | Contact number |
| `dateOfBirth` | DATE | NULLABLE | Date of birth |
| `gender` | ENUM | NULLABLE | Male / Female / Other |
| `category` | ENUM | NULLABLE | General / OBC / SC / ST |
| `tenthResult` | STRING | NULLABLE | 10th grade result |
| `twelfthResult` | STRING | NULLABLE | 12th grade result |
| `address` | TEXT | NULLABLE | Residential address |
| `languages` | STRING | NULLABLE | Comma-separated |
| `skills` | STRING | NULLABLE | Comma-separated |
| `hobbies` | STRING | NULLABLE | Comma-separated |
| `achievements` | TEXT | NULLABLE | Academic/extra-curricular |
| `projects` | TEXT | NULLABLE | Project descriptions |
| `certifications` | TEXT | NULLABLE | External certifications |
| `otherDetails` | TEXT | NULLABLE | Miscellaneous |
| `linkedinUrl` | STRING | NULLABLE | LinkedIn profile |
| `githubUrl` | STRING | NULLABLE | GitHub profile |
| `portfolioUrl` | STRING | NULLABLE | Personal website |
| `createdAt` | TIMESTAMP | AUTO | Created time |
| `updatedAt` | TIMESTAMP | AUTO | Last updated time |

**Indexes:** Primary `id`, Unique `email`, Unique `studentId`

---

### ACTIVITY Table (`activities`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO | Unique identifier |
| `studentId` | INTEGER | FK → users(id) | Submitting student |
| `title` | STRING | NOT NULL | Activity title |
| `type` | ENUM | NOT NULL | Activity category |
| `description` | TEXT | NULLABLE | Detailed description |
| `date` | DATE | NOT NULL | Activity date |
| `duration` | STRING | NULLABLE | e.g. "3 days" |
| `organizer` | STRING | NULLABLE | Organizing body |
| `filePath` | STRING | NULLABLE | `/uploads/certificates/…` or Cloudinary URL |
| `status` | ENUM | DEFAULT 'pending' | `pending` / `approved` / `rejected` |
| `approvedBy` | INTEGER | FK → users(id), NULLABLE | Reviewer's user ID |
| `remarks` | TEXT | NULLABLE | Faculty feedback |
| `credits` | DECIMAL(3,1) | DEFAULT 0 | Credits awarded |
| `createdAt` | TIMESTAMP | AUTO | Submission time |
| `updatedAt` | TIMESTAMP | AUTO | Last updated |

**Activity types:** `conference` · `workshop` · `certification` · `competition` · `internship` · `leadership` · `community_service` · `club_activity` · `online_course`

---

## Entity Relationships

```mermaid
erDiagram
    USER ||--o{ ACTIVITY : "submits"
    USER ||--o{ ACTIVITY : "approves"

    USER {
        int id PK
        string name
        string email UK
        string role
        string studentId UK
        boolean isActive
    }

    ACTIVITY {
        int id PK
        int studentId FK
        string title
        string type
        string filePath
        string status
        int approvedBy FK
        decimal credits
    }
```

### Sequelize Associations (defined in `lib/database.js`)

```javascript
User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
```

---

## API Routes

All routes live under `app/api/` as Next.js Route Handlers.

### 🔓 Auth — `/api/auth`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Get JWT token |
| GET | `/auth/profile` | 🔒 Any role | Current user profile |
| POST | `/auth/admin-password-reset` | Public + `ADMIN_RESET_CODE` | Create or reset admin |

### 👨‍🎓 Students — `/api/students`

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/students/profile` | student, admin | My profile |
| PUT | `/students/profile` | student, admin | Update profile |
| POST | `/students/upload-avatar` | student, admin | Upload avatar (multipart/form-data) |
| POST | `/students/activities` | student, admin | Submit activity + optional certificate |
| GET | `/students/activities` | student, admin | List my activities (paginated, filterable) |
| PUT | `/students/activities/:id` | student, admin | Update pending activity |
| DELETE | `/students/activities/:id` | student, admin | Delete pending activity |
| GET | `/students/activities/stats` | student, admin | My dashboard statistics |
| GET | `/students/browse` | student, faculty, admin | Browse all student profiles |

### 👨‍🏫 Faculty — `/api/faculty`

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/faculty/stats` | faculty, admin | Dashboard statistics |
| GET | `/faculty/activities/pending` | faculty, admin | Activities awaiting review |
| GET | `/faculty/activities` | faculty, admin | All activities (filterable) |
| PUT | `/faculty/activities/:id` | faculty, admin | Approve or reject + set credits |
| GET | `/faculty/students` | faculty, admin | All students with search/filter/pagination |

### 👑 Admin — `/api/admin`

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/admin/stats` | admin | System-wide statistics |
| GET | `/admin/users` | admin | All users |
| POST | `/admin/users` | admin | Create user |
| PUT | `/admin/users/:id` | admin | Update user |
| DELETE | `/admin/users/:id` | admin | Delete user |
| POST | `/admin/users/:id/toggle-status` | admin | Activate / deactivate user |
| GET | `/admin/reports` | admin | Export reports |

### 📁 Files — `/api/files`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/files/view?url=<fileUrl>` | Inline view — serves local file from disk or proxies Cloudinary |
| GET | `/files/download?url=<fileUrl>` | Download — serves local file with `Content-Disposition: attachment` or redirects Cloudinary signed URL |

**Local files:** `url` = `/uploads/certificates/filename.pdf` — read from `public/uploads/`  
**Cloudinary files:** `url` = `https://res.cloudinary.com/…` — proxied or redirected

---

## Auth & Authorization

### JWT Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as /api/auth/login
    participant DB as Database

    C->>A: POST {email, password}
    A->>DB: SELECT user WHERE email
    DB-->>A: User row
    A->>A: bcrypt.compare(password, hash)
    A->>A: jwt.sign({id, role}, JWT_SECRET)
    A-->>C: {token, user}

    C->>A: GET /api/auth/profile (Authorization: Bearer <token>)
    A->>A: jwt.verify(token, JWT_SECRET)
    A->>DB: SELECT user WHERE id
    DB-->>A: User
    A-->>C: User profile
```

### Authorization Matrix

| Endpoint | Student | Faculty | Admin |
|----------|:-------:|:-------:|:-----:|
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| GET /students/profile | ✅ own | ❌ | ✅ |
| PUT /students/profile | ✅ own | ❌ | ✅ |
| POST /students/activities | ✅ | ❌ | ✅ |
| GET /students/activities | ✅ own | ❌ | ✅ |
| GET /faculty/activities/pending | ❌ | ✅ | ✅ |
| PUT /faculty/activities/:id | ❌ | ✅ | ✅ |
| GET /faculty/students | ❌ | ✅ | ✅ |
| GET /admin/users | ❌ | ❌ | ✅ |
| POST /admin/users | ❌ | ❌ | ✅ |
| DELETE /admin/users/:id | ❌ | ❌ | ✅ |
| GET /admin/stats | ❌ | ❌ | ✅ |

---

## File Storage

### How it works (lib/cloudStorage.js)

```
NODE_ENV === 'production'
  AND Cloudinary credentials are real (not placeholder strings)
  → Upload to Cloudinary CDN → returns https://res.cloudinary.com/… URL

Otherwise (development, or missing creds)
  → Write to public/uploads/<folder>/<timestamp-random.ext>
  → Returns /uploads/<folder>/filename.ext
  → Next.js serves it as a static file from public/
```

### Upload directories (dev)

```
public/
└── uploads/
    ├── avatars/        ← Profile pictures (POST /students/upload-avatar)
    └── certificates/   ← Activity proof files (POST /students/activities)
```

### File Limits
- Avatars: **2 MB**, JPEG/PNG only
- Certificates: **5 MB**, JPEG/PNG/PDF

---

## Data Flow Diagrams

### Activity Submission

```mermaid
sequenceDiagram
    participant S as Student
    participant API as /api/students/activities
    participant FS as File Storage
    participant DB as Database

    S->>API: POST multipart/form-data (title, type, date, certificate)
    API->>API: Verify JWT & role
    API->>FS: uploadFile(buffer, 'certificates')
    FS-->>API: /uploads/certificates/file.pdf  (dev) OR Cloudinary URL (prod)
    API->>DB: INSERT INTO activities (filePath=url, status='pending')
    DB-->>API: Activity created
    API-->>S: 201 {activity}
```

### Faculty Review

```mermaid
sequenceDiagram
    participant F as Faculty
    participant API as /api/faculty/activities/:id
    participant DB as Database

    F->>API: PUT {status: 'approved', credits: 5, remarks: '...'}
    API->>API: Verify JWT & faculty/admin role
    API->>DB: UPDATE activities SET status, approvedBy, credits, remarks
    DB-->>API: Updated row
    API-->>F: 200 {activity}
```

### File View/Download

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as /api/files/view or /download
    participant Disk as public/uploads
    participant CDN as Cloudinary

    B->>API: GET ?url=/uploads/certificates/file.pdf
    API->>Disk: fs.readFileSync(public/uploads/certificates/file.pdf)
    Disk-->>API: Buffer
    API-->>B: 200 Content-Type: application/pdf

    B->>API: GET ?url=https://res.cloudinary.com/...
    API->>CDN: fetch(cloudinaryUrl)
    CDN-->>API: Buffer
    API-->>B: 200 Content-Type: application/pdf
```

---

## Query Patterns

### Student Stats
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
  SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected,
  COALESCE(SUM(CASE WHEN status='approved' THEN credits ELSE 0 END), 0) AS totalCredits
FROM activities
WHERE studentId = ?;
```

### Pending Activities for Faculty
```sql
SELECT a.*, u.name, u.email, u.studentId, u.department, u.year, u.program
FROM activities a
  INNER JOIN users u ON a.studentId = u.id
WHERE a.status = 'pending'
ORDER BY a.createdAt DESC;
```

### Top Students by Credits (Admin)
```sql
SELECT u.name, u.email, u.department, u.year,
       COUNT(a.id) AS activityCount,
       SUM(a.credits) AS totalCredits
FROM users u
  INNER JOIN activities a ON u.id = a.studentId
WHERE u.role = 'student' AND a.status = 'approved'
GROUP BY u.id
ORDER BY totalCredits DESC
LIMIT 10;
```

---

## Error Handling

### Standard API Errors

| Error | HTTP Status | Cause |
|-------|-------------|-------|
| Missing/invalid JWT | 401 | No token or expired |
| Wrong role | 403 | Insufficient permissions |
| Not found | 404 | Record doesn't exist |
| Validation failed | 400 | Missing required fields |
| Duplicate email/studentId | 409 | Unique constraint |
| DB unavailable | 503 | Connection error |
| Unhandled exception | 500 | Internal server error |

### DB Sync Strategy (lib/database.js)

On startup, `initDB()` runs once (cached via `globalThis`):
1. Tries `sync({ alter: true })` — adds missing columns without dropping data
2. On SQLite: disables FK checks during alter to avoid constraint errors
3. Falls back to `sync()` (no-op, just ensures tables exist) if alter fails
4. Always marks as initialized — never retries on every request

---

## Environment Configuration

```env
# Required for all environments
JWT_SECRET=64_char_hex_string
JWT_EXPIRES_IN=7d
DB_NAME=smart_student_hub.db          # SQLite filename (dev)
ADMIN_RESET_CODE=secure_random_code

# Required for production only
DATABASE_URL=postgresql://user:pass@host:5432/db
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Public (available in browser)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=Smart Student Hub
NEXT_PUBLIC_APP_VERSION=2.0.0
```

---

**Last Updated:** February 2026  
**Version:** 2.0  
**Maintained by:** Smart Student Hub Development Team
