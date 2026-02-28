# 👨‍🎓 Student Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Registration](#registration)
- [Dashboard Overview](#dashboard-overview)
- [Submitting an Activity](#submitting-an-activity)
- [Managing Activities](#managing-activities)
- [Viewing & Downloading Certificates](#viewing--downloading-certificates)
- [Profile Management](#profile-management)
- [Portfolio](#portfolio)
- [Browse Students](#browse-students)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Getting Started

### Logging In
1. Navigate to the Smart Student Hub URL
2. Select the **Student** login option
3. Enter your email and password
4. Click **Login**

### First Time Setup
1. **Complete your profile** — add phone number, date of birth, academic details, profile picture
2. **Explore the Dashboard** — familiarize yourself with the activity flow
3. **Submit your first activity** — start building your portfolio

---

## Registration

### Hierarchical Program Selection

Registration uses a cascading selection system:

1. Select **Program Category** (e.g., "Engineering & Technology")
2. Select **Program/Degree** (e.g., "B.Tech — Bachelor of Technology")
3. Select **Specialization** (if applicable, e.g., "Artificial Intelligence & Machine Learning")
4. Enter **Academic Year** (1st – 4th)
5. Enter **Student ID** (unique — provided by your institution)
6. Enter **Department** (e.g., "Computer Science")
7. Fill in name, email, and password

### Supported Program Categories

| # | Category | Examples |
|---|----------|---------|
| 1 | Engineering & Technology | B.Tech, M.Tech |
| 2 | Computer Applications | BCA, MCA |
| 3 | Science | B.Sc (Hons.), M.Sc |
| 4 | Agriculture & Fisheries | B.Sc Agriculture, B.F.Sc |
| 5 | Health Sciences & Pharmacy | B.Pharm, M.Pharm, BPT |
| 6 | Nursing | B.Sc Nursing, GNM |
| 7 | Maritime Studies | B.Sc Nautical Science |
| 8 | Management, Commerce & Law | BBA, MBA, B.Com, LL.B |
| 9 | Hospitality & Culinary Arts | B.Sc HHA, Culinary Arts |
| 10 | PhD Programs | Ph.D. (all disciplines) |

### Validation Rules
- **Email:** Unique per system, valid format required
- **Student ID:** Unique across all students
- **Password:** Minimum 8 characters, mixed case, numbers, and special character
- Dependent dropdowns auto-reset when a parent selection changes

---

## Dashboard Overview

The Student Dashboard shows:

### Statistics Cards
- **Total Activities** — all submissions
- **Approved** — activities credited to your portfolio
- **Pending** — awaiting faculty review
- **Rejected** — declined submissions
- **Total Credits** — sum of credits from approved activities

### Quick Actions
- Submit New Activity
- View My Activities
- Open Portfolio

---

## Submitting an Activity

1. Go to **Submit Activity** from the sidebar or dashboard
2. Fill in the form:

| Field | Required | Notes |
|-------|----------|-------|
| Title | ✅ | Clear, descriptive name |
| Type | ✅ | See activity types below |
| Date | ✅ | Date the activity took place |
| Duration | — | e.g., "2 days", "3 hours" |
| Organizer | — | Organization that ran the event |
| Description | — | Additional details |
| Credits Requested | — | Your estimate (faculty may adjust) |
| Certificate/Proof | — | PDF or image (max 5 MB) |

3. Click **Submit** — activity enters **Pending** status

### Activity Types
| Type | Description |
|------|-------------|
| `conference` | Technical conference or symposium |
| `workshop` | Workshop or seminar |
| `certification` | Professional certification exam |
| `competition` | Hackathon, coding contest, sports |
| `internship` | Internship placement |
| `leadership` | Elected/appointed leadership role |
| `community_service` | Social or community service |
| `club_activity` | College club membership/event |
| `online_course` | MOOC, online course completion |

---

## Managing Activities

### My Activities Page
- Filter by status: All / Pending / Approved / Rejected
- Search by title, type, or organizer
- See faculty remarks on reviewed activities

### Edit an Activity
- Editing is only allowed on **Pending** activities
- Click **Edit** → modify fields → save
- You can replace the certificate file during edit

### Delete an Activity
- Only **Pending** activities can be deleted
- Click **Delete** → confirm → activity is permanently removed

### Status Meanings
| Status | Meaning |
|--------|---------|
| 🟡 Pending | Awaiting faculty review |
| 🟢 Approved | Accepted — credits added to your portfolio |
| 🔴 Rejected | Declined — check faculty remarks |

---

## Viewing & Downloading Certificates

In **My Activities**, click **View Attachment** on any activity that has a certificate:

- **View** — opens the file inline (PDF opens in PDF.js viewer, images open directly)
- **Download** — downloads the file to your device

Both buttons work for files stored locally (dev) and on Cloudinary (production).

---

## Profile Management

Go to **Profile** from the sidebar.

### Updatable Fields
- Name, phone, date of birth, gender, category (General/OBC/SC/ST)
- Academic: department, year, program, specialization, student ID
- Academic results: 10th, 12th grades
- Address, languages, skills, hobbies
- Achievements, projects, certifications, other details
- Social links: LinkedIn, GitHub, Portfolio

### Avatar Upload
- Click the camera icon on your profile picture
- Upload a JPEG or PNG file (max 2 MB)
- Saved locally in dev, or to Cloudinary in production

---

## Portfolio

The Portfolio page is a clean, shareable view of your academic profile:
- Personal information
- Academic details and results
- Skills, hobbies, languages
- Approved activities with credits
- Projects and certifications
- Social links

Use this for NAAC documentation, scholarship applications, or sharing with recruiters.

---

## Browse Students

Browse the public directory of all students:
- Search by name, email, or student ID
- Filter by department or year
- View basic profile and activity statistics for any student

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't submit — validation error | Check all required fields are filled |
| File upload fails | Ensure file is under 5 MB and is JPEG, PNG, or PDF |
| Avatar upload fails | Ensure file is under 2 MB and is JPEG or PNG |
| Activity stuck on Pending | Faculty reviews submissions — check back later |
| Can't edit activity | Only Pending activities can be edited |
| Can't see certificate | Check if you have `filePath` set — re-submit if missing |
| Login fails | Verify email/password; contact admin if locked out |

---

## API Reference

Base URL: `/api` (relative — works in dev and prod)

All requests require:
```
Authorization: Bearer <your_jwt_token>
```

### Profile

```http
GET /api/students/profile
# Returns full user profile

PUT /api/students/profile
Content-Type: application/json
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "skills": "Python, React",
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
```

### Avatar Upload

```http
POST /api/students/upload-avatar
Content-Type: multipart/form-data
Body: avatar = <file>
```

### Activities

```http
GET /api/students/activities?status=pending&page=1&limit=10

POST /api/students/activities
Content-Type: multipart/form-data
Body:
  title = "AI Workshop"
  type = "workshop"
  date = "2025-11-15"
  duration = "2 days"
  organizer = "IIT Kharagpur"
  credits = 5
  certificate = <file>

PUT /api/students/activities/:id
Content-Type: multipart/form-data
Body: (same fields, all optional)

DELETE /api/students/activities/:id

GET /api/students/activities/stats
# Returns { total, approved, pending, rejected, totalCredits }
```

### Browse Students

```http
GET /api/students/browse?search=john&department=CSE&year=3&page=1&limit=20
```

---

**Last Updated:** February 2026  
**Repository:** https://github.com/arpanpramanik2003/ssh-v2
