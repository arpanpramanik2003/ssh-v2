# 👑 Admin & Deployment Guide

## Table of Contents
- [Admin Account Setup](#admin-account-setup)
- [User Management](#user-management)
- [Security Best Practices](#security-best-practices)
- [Production Deployment](#production-deployment)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Access](#database-access)

---

## Admin Account Setup

### No Default Admin

For security, the system does **not** auto-create a default admin user. You must bootstrap it manually using a secret reset code.

### Step 1 — Set `ADMIN_RESET_CODE`

**Local dev:** Add to `.env.local`
```env
ADMIN_RESET_CODE=your_strong_random_code_here
```

**Production:** Add in Vercel Dashboard → Project → Settings → Environment Variables.

### Step 2 — Create Admin Account

Call the reset endpoint (PowerShell):

```powershell
# Local development
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/admin-password-reset" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"confirmCode":"YOUR_ADMIN_RESET_CODE","newUsername":"admin@yourdomain.com","newPassword":"YourSecurePassword123!"}'

# Production
Invoke-RestMethod `
  -Uri "https://your-app.vercel.app/api/auth/admin-password-reset" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"confirmCode":"YOUR_ADMIN_RESET_CODE","newUsername":"admin@yourdomain.com","newPassword":"YourSecurePassword123!"}'
```

Or with curl:
```bash
curl -X POST https://your-app.vercel.app/api/auth/admin-password-reset \
  -H "Content-Type: application/json" \
  -d '{"confirmCode":"YOUR_CODE","newUsername":"admin@domain.com","newPassword":"Secure@123"}'
```

**Success response:**
```json
{ "message": "Admin user created successfully", "username": "admin@domain.com" }
```

The same endpoint can also **reset** admin credentials if the admin account already exists.

### Security Notes
- ✅ No hardcoded credentials in the codebase
- ✅ Reset code lives only in environment variables
- ✅ Failed attempts are logged server-side
- ✅ Password must be at least 8 characters

---

## User Management

Access via Admin Dashboard → User Management.

### Actions Available
| Action | Description |
|--------|-------------|
| **Create User** | Add student, faculty, or admin accounts manually |
| **Edit User** | Update name, email, department, role, etc. |
| **Toggle Status** | Activate or deactivate an account (login blocked when inactive) |
| **Delete User** | Permanently remove a user and their data |

### Bulk Operations
Use **Reports** → Export CSV for bulk data review. For bulk user import, use the database directly (see [Database Access](#database-access)).

### Role Assignments
- `student` — default for self-registration
- `faculty` — must be created by admin
- `admin` — created via reset endpoint only

---

## Security Best Practices

### Environment Variables
- Never commit `.env.local` — it is gitignored by default
- Rotate `JWT_SECRET` periodically (all sessions invalidated — users re-login)
- Use a strong, unique `ADMIN_RESET_CODE` in production
- Set `NODE_ENV=production` on Vercel automatically

### Passwords
- Enforce strong passwords (8+ chars, uppercase, numbers, special chars)
- bcrypt with 12 rounds — safe against brute force
- Admin reset endpoint is the only way to bypass password requirements

### File Uploads
- Avatar uploads: 2 MB max, JPEG/PNG only
- Certificate uploads: 5 MB max, JPEG/PNG/PDF only
- Dev: stored in `public/uploads/` (excluded from git via `.gitignore`)
- Prod: stored on Cloudinary CDN with public access

### Production Checklist
- [ ] Remove test credentials banner from `app/login/page.jsx`
- [ ] Set real `JWT_SECRET` (64+ random chars)
- [ ] Set real `ADMIN_RESET_CODE`
- [ ] Set `DATABASE_URL` to Supabase PostgreSQL
- [ ] Set Cloudinary credentials
- [ ] Verify `NODE_ENV=production` on Vercel (automatic)

---

## Production Deployment

### Architecture

```
Browser  →  Vercel (Next.js)  →  Supabase (PostgreSQL)
                               →  Cloudinary (file storage)
```

**Total cost: $0/month** using free tiers.

---

### Step 1 — Supabase PostgreSQL

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Copy the **Connection String** (with password):
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
4. Save it as `DATABASE_URL` for Vercel

---

### Step 2 — Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Free account
2. Dashboard shows:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Save all three for Vercel

> If Cloudinary is not configured, the app falls back to local disk storage with a warning — safe for testing but **files won't persist** on Vercel (read-only filesystem).

---

### Step 3 — Deploy to Vercel

1. Push your repo to GitHub:
   ```bash
   git add .
   git commit -m "deploy"
   git push origin master
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import from GitHub

3. Configure:
   - **Root Directory:** leave blank if `package.json` is at repo root, or set to the folder containing it
   - **Framework Preset:** Next.js (auto-detected)

4. Add Environment Variables:

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | 64-char random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `DATABASE_URL` | Supabase connection string |
   | `CLOUDINARY_CLOUD_NAME` | Your cloud name |
   | `CLOUDINARY_API_KEY` | Your API key |
   | `CLOUDINARY_API_SECRET` | Your API secret |
   | `ADMIN_RESET_CODE` | Secure random code |
   | `NEXT_PUBLIC_API_URL` | `/api` |
   | `NEXT_PUBLIC_APP_NAME` | `Smart Student Hub` |
   | `NEXT_PUBLIC_APP_VERSION` | `2.0.0` |

5. Click **Deploy** ✅

6. After deployment, create admin account:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/admin-password-reset \
     -H "Content-Type: application/json" \
     -d '{"confirmCode":"YOUR_CODE","newUsername":"admin@domain.com","newPassword":"Admin@123!"}'
   ```

---

### Step 4 — Verify Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Expected
{ "message": "Smart Student Hub API is running!", "database": "Connected ✅" }
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `/api` | API base URL (client-side) |
| `NEXT_PUBLIC_APP_NAME` | ✅ | — | App display name |
| `NEXT_PUBLIC_APP_VERSION` | — | `2.0.0` | App version |
| `JWT_SECRET` | ✅ | — | JWT signing secret (64+ chars) |
| `JWT_EXPIRES_IN` | — | `7d` | Token expiry |
| `DB_NAME` | — | `smart_student_hub.db` | SQLite filename (dev only) |
| `DATABASE_URL` | Prod only | — | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Prod only | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Prod only | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Prod only | — | Cloudinary API secret |
| `ADMIN_RESET_CODE` | ✅ | — | Code to create/reset admin |

---

## Database Access

### Development (SQLite)

The SQLite database file is automatically created at the project root:
```
nextjs-frontend/smart_student_hub.db
```

Open with any SQLite browser (e.g., [DB Browser for SQLite](https://sqlitebrowser.org/)):
```bash
# Or via command line
npx sequelize-cli db:query "SELECT * FROM users"
```

### Production (Supabase)

Use Supabase Dashboard → Table Editor, or connect via any PostgreSQL client:
```
Host: db.xxxxx.supabase.co
Port: 5432
DB: postgres
User: postgres
Password: YOUR_PASSWORD
SSL: required
```

### Schema Auto-Migration

On every cold start, `initDB()` runs `sync({ alter: true })` which:
- Creates tables if they don't exist
- Adds new columns to existing tables
- **Never deletes data or drops columns**

SQLite foreign key constraints are temporarily disabled during `ALTER TABLE` operations to prevent constraint errors.

---

**Last Updated:** February 2026  
**Repository:** https://github.com/arpanpramanik2003/ssh-v2
