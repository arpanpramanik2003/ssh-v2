# 🎓 Smart Student Hub — v2

A comprehensive full-stack platform for managing student academic activities, portfolios, and achievements. Built as a **single Next.js application** — no separate backend server required.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Test Credentials](#test-credentials)
- [User Guides](#user-guides)
- [Security](#security)

---

## 📝 Overview

Smart Student Hub v2 is a **full-stack Next.js application** that consolidates the frontend UI and backend API into a single deployable unit using Next.js App Router and API Routes.

- **Students** submit and track academic activities
- **Faculty** review and approve student submissions
- **Admins** manage users and generate comprehensive reports

Perfect for NAAC/AICTE compliance and student portfolio management.

---

## ✨ Features

### 👨‍🎓 Student Portal
- Submit academic activities (conferences, workshops, certifications, etc.)
- Track activity status (pending, approved, rejected)
- Build a digital portfolio
- Upload certificates and documents
- View personal statistics and credits
- Update profile and avatar

### 👨‍🏫 Faculty Portal
- Review pending student activities
- Approve or reject submissions with remarks and custom credits
- Filter by department and status
- View comprehensive activity dashboard
- **All Students Directory** — search, filter, and view complete student profiles with pagination

### 👑 Admin Portal
- User management (create, edit, delete, deactivate)
- Generate detailed reports (JSON/CSV)
- View system-wide analytics
- Department-wise breakdowns and top student rankings

### 🎨 UI & Design
- **Dark Mode** — full dark theme with automatic system detection
- **Responsive Design** — works seamlessly on all devices
- **Modern Gradients** — beautiful color schemes throughout
- WCAG-compliant color contrasts

---

## 🛠️ Tech Stack

| Concern | Technology |
|---|---|
| Framework | **Next.js 14** (App Router, API Routes) |
| UI | **React 18**, **Tailwind CSS** |
| Auth | **JWT** (server-side only, never exposed to browser) |
| ORM | **Sequelize** |
| Database (dev) | **SQLite** (auto-created, zero config) |
| Database (prod) | **PostgreSQL** (Supabase) |
| File storage (dev) | Local `public/uploads/` (served as static assets) |
| File storage (prod) | **Cloudinary** CDN |
| Deployment | **Vercel** (single deploy — no separate backend needed) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/arpanpramanik2003/ssh-v2.git
cd ssh-v2

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's it. **No separate backend process needed.**

| Service | URL |
|---|---|
| App | `http://localhost:3000` |
| API | `http://localhost:3000/api` |
| Health check | `http://localhost:3000/api/health` |

> **SQLite database** is created automatically on first run. No setup required.

---

## 📂 Project Structure

```
nextjs-frontend/                  ← Root of the deployable Next.js app
├── app/
│   ├── layout.jsx                ← Root layout (dark mode, providers)
│   ├── page.jsx                  ← Landing / redirect
│   ├── login/page.jsx            ← Login page
│   ├── (protected)/              ← Auth-guarded pages
│   │   ├── student/
│   │   │   ├── activities/
│   │   │   ├── browse/
│   │   │   ├── portfolio/
│   │   │   └── submit/
│   │   ├── faculty/
│   │   └── admin/
│   └── api/                      ← Next.js API Routes (the backend)
│       ├── auth/
│       │   ├── login/route.js
│       │   ├── register/route.js
│       │   ├── profile/route.js
│       │   └── admin-password-reset/route.js
│       ├── students/
│       │   ├── activities/route.js
│       │   ├── activities/[activityId]/route.js
│       │   ├── activities/stats/route.js
│       │   ├── profile/route.js
│       │   └── upload-avatar/route.js
│       ├── faculty/
│       │   ├── activities/route.js
│       │   ├── activities/[id]/route.js
│       │   ├── stats/route.js
│       │   └── students/route.js
│       ├── admin/
│       │   ├── users/route.js
│       │   ├── users/[id]/route.js
│       │   ├── stats/route.js
│       │   └── reports/route.js
│       └── files/
│           ├── view/route.js     ← Proxy for PDF/image viewing
│           └── download/route.js ← File download handler
│
├── components/                   ← React UI components
│   ├── admin/
│   ├── faculty/
│   ├── shared/
│   └── student/
│
├── lib/                          ← Server-side utilities (API routes only)
│   ├── auth.js                   ← JWT sign/verify helpers
│   ├── database.js               ← Sequelize init (SQLite dev / Postgres prod)
│   ├── cloudStorage.js           ← Local disk (dev) / Cloudinary (prod)
│   └── models/
│       ├── User.js
│       └── Activity.js
│
├── contexts/                     ← Client-side React contexts (Auth, Theme)
├── utils/                        ← Client-side utilities (API calls, constants)
├── middleware.js                 ← Next.js route protection
├── .env.local                    ← Local env variables (gitignored)
├── .env.example                  ← Template — copy to .env.local
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# ── Public (exposed to browser) ────────────────────────────────
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=Smart Student Hub
NEXT_PUBLIC_APP_VERSION=2.0.0

# ── Server-side only (never exposed to browser) ─────────────────

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_random_secret
JWT_EXPIRES_IN=7d

# Database
DB_NAME=smart_student_hub.db                          # SQLite (dev, auto-created)
# DATABASE_URL=postgresql://...@db.supabase.co/postgres  # PostgreSQL (prod)

# Cloudinary — only needed for production
# Leave as placeholder for local dev (files go to public/uploads/)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin account bootstrap
ADMIN_RESET_CODE=your_secure_reset_code
```

> **Local dev:** Cloudinary is **not required**. Uploaded files are saved to `public/uploads/` and served automatically by Next.js.  
> **Production (Vercel):** Add all env vars in Vercel Dashboard → Project → Settings → Environment Variables.

---

## 🌐 Deployment

### Recommended Stack (all free tiers)

```
Next.js App  →  Vercel            (free, single deployment)
Database     →  Supabase Postgres  (500 MB free)
Storage      →  Cloudinary CDN     (25 GB free)
```

**Total cost: $0/month**

### Deploy to Vercel

1. Push this repo to GitHub
2. Import at [vercel.com](https://vercel.com) — set root directory to the folder containing `package.json`
3. Add all environment variables in Vercel Dashboard
4. Set `DATABASE_URL` to your Supabase PostgreSQL connection string
5. Set `CLOUDINARY_*` credentials
6. Deploy ✅

See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for complete step-by-step deployment instructions.

---

## 📊 API Documentation

### Base URL
| Environment | URL |
|---|---|
| Development | `http://localhost:3000/api` |
| Production | `https://your-app.vercel.app/api` |

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Key Endpoints

#### Auth — `/api/auth`
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/profile` | 🔒 Authenticated |
| POST | `/auth/admin-password-reset` | Public + reset code |

#### Student — `/api/students`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students/activities` | My activities (with pagination/filter) |
| POST | `/students/activities` | Submit new activity + certificate |
| PUT | `/students/activities/:id` | Update pending activity |
| DELETE | `/students/activities/:id` | Delete pending activity |
| GET | `/students/activities/stats` | My dashboard stats |
| GET | `/students/profile` | My profile |
| PUT | `/students/profile` | Update profile |
| POST | `/students/upload-avatar` | Upload profile picture |
| GET | `/students/browse` | Browse all students |

#### Faculty — `/api/faculty`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/faculty/activities/pending` | Review queue |
| PUT | `/faculty/activities/:id` | Approve or reject |
| GET | `/faculty/activities` | All activities |
| GET | `/faculty/students` | All students (search/filter) |
| GET | `/faculty/stats` | Dashboard stats |

#### Admin — `/api/admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | All users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/stats` | System-wide statistics |
| GET | `/admin/reports` | Generate reports (JSON/CSV) |

#### Files — `/api/files`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files/view?url=...` | Proxy file for inline viewing (PDF, images) |
| GET | `/files/download?url=...` | Download file (local or Cloudinary) |

See [DATABASE_API_ARCHITECTURE.md](DATABASE_API_ARCHITECTURE.md) for full technical reference.

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smartstudenthub.com` | `Admin@123` |
| Student | `pramanikarpan089@gmail.com` | `Arpan@123` |
| Faculty | `faculty@smartstudenthub.com` | `Faculty@123` |

> ⚠️ Remove the test credentials banner from `app/login/page.jsx` before final production.

---

## 🗺️ User Guides

| Guide | Contents |
|---|---|
| [STUDENT_GUIDE.md](STUDENT_GUIDE.md) | Registration, activity submission, portfolio, profile management |
| [FACULTY_GUIDE.md](FACULTY_GUIDE.md) | Review workflow, student directory, best practices |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | Admin setup, deployment, security, environment variables |
| [DATABASE_API_ARCHITECTURE.md](DATABASE_API_ARCHITECTURE.md) | DB schema, API routes, auth flows, data architecture |

---

## 🔒 Security Features

- ✅ JWT authentication — server-side only, never exposed to client
- ✅ Password hashing — bcrypt with 12 rounds
- ✅ Strong password policy — 8+ chars, mixed case, numbers, special chars
- ✅ Role-based access control (student / faculty / admin)
- ✅ Next.js middleware for route protection
- ✅ Input validation on all API routes
- ✅ File upload limits — 5 MB certificates, 2 MB avatars
- ✅ HTTPS enforced in production (Vercel)
- ✅ Database SSL — encrypted Supabase connection
- ✅ Cloudinary placeholder detection — prevents 401 errors on first run

---

## 🎯 Activity Types

`conference` · `workshop` · `certification` · `competition` · `internship` · `leadership` · `community_service` · `club_activity` · `online_course`

---

## 📝 License

MIT — see [LICENSE](LICENSE)

---

## 👥 Team

Built by **Arpan Pramanik** for SIH 2025.

**Repository:** https://github.com/arpanpramanik2003/ssh-v2  
**Happy Coding! 🚀**