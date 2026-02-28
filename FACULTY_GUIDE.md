# 👨‍🏫 Faculty User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Review Queue](#review-queue)
- [All Activities](#all-activities)
- [All Students Directory](#all-students-directory)
- [Program Category System](#program-category-system)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In
1. Go to the Smart Student Hub login page
2. Select **Faculty** login
3. Enter your email and password
4. Click **Login**

> Faculty accounts are created by the Admin. You cannot self-register as faculty.

### First Time Setup
1. **Update your Profile** — add phone number and profile picture
2. **Set your Program Category** — determines which students' activities appear in your Review Queue
3. **Check the Review Queue** — start reviewing pending submissions

---

## Dashboard Overview

### Key Metrics
| Card | Description |
|------|-------------|
| Pending | Student submissions awaiting your review |
| Total Activities | All activities in the system |
| Approved | Activities you've approved |
| Rejected | Activities you've declined |
| Reviewed by Me | Your personal review count |

### Quick Actions
- Jump to Review Queue
- View All Activities
- Browse All Students

### Recent Reviews
Your 5 most recent reviews with:
- Student name and ID
- Activity type and title
- Review timestamp and status

---

## Review Queue

The primary faculty workflow. Shows only **Pending** activities from students in your assigned **Program Category**.

### Each Activity Card Shows
- Student name, ID, program, year, department
- Activity title, type, date, organizer, duration
- Description and requested credits
- Certificate/proof attachment (click **View Certificate** to expand)

### Viewing Certificates
Click **View Certificate** to expand the attachment panel:
- **View** — opens the file inline (PDF opens in PDF.js viewer, images open directly)
- **Download** — downloads the file to your device

Both buttons work for locally stored files (dev) and Cloudinary (production).

### Reviewing an Activity

**To Approve:**
1. Review the activity details and certificate
2. Adjust **Credits to Award** (range: 0–10; pre-filled with student's request, capped at 10)
3. Add optional **Remarks** (feedback for the student)
4. Click **Approve** ✅

**To Reject:**
1. Add **Remarks** explaining why (optional but recommended)
2. Click **Reject** ❌

After review, the activity is removed from the queue and the student sees the updated status with your remarks.

### Credit Guidelines

| Activity Type | Suggested Credits |
|---------------|------------------|
| International Conference | 8–10 |
| National Conference | 6–8 |
| Workshop (≥3 days) | 5–7 |
| Workshop (1–2 days) | 3–5 |
| Professional Certification | 6–8 |
| Internship (≥1 month) | 7–10 |
| Club Activity / Volunteer | 2–4 |
| Online Course | 3–6 |
| Competition (Winner) | 8–10 |
| Competition (Participant) | 3–5 |

> You can always override — use your judgment based on the quality and relevance of the submission.

---

## All Activities

View ALL activities in the system (not just pending), with filters:
- Filter by status (all / pending / approved / rejected)
- Filter by type
- Search by student name or title
- Paginated results

Use this for comprehensive portfolio reviews or generating personal reports.

---

## All Students Directory

A searchable directory of **all students** in the system.

### Search & Filter
| Filter | Options |
|--------|---------|
| Search | Name, email, student ID |
| Department | Free text filter |
| Year | 1, 2, 3, 4 |
| Page size | Configurable |

### Student Profile View
Click any student to see:
- Personal details (name, ID, department, year, program)
- Contact info (email, phone)
- Academic results (10th, 12th)
- Skills, hobbies, languages
- Activity statistics (total, approved, credits earned)
- Projects, certifications, achievements
- Social links (LinkedIn, GitHub, Portfolio)

This view is **read-only** — faculty cannot modify student data.

---

## Program Category System

Faculty are assigned a **Program Category** which filters their Review Queue to show only relevant students.

### Categories

| Category | Programs |
|----------|----------|
| Engineering & Technology | B.Tech, M.Tech, B.E., M.E. |
| Computer Applications | BCA, MCA |
| Science | B.Sc (Hons.), M.Sc, Integrated |
| Agriculture & Fisheries | B.Sc Agriculture, B.F.Sc |
| Health Sciences & Pharmacy | B.Pharm, M.Pharm, BPT, BMLT |
| Nursing | B.Sc Nursing, GNM, P.B.B.Sc |
| Maritime Studies | B.Sc Nautical Science, DNS |
| Management, Commerce & Law | BBA, MBA, B.Com, LL.B, CA |
| Hospitality & Culinary Arts | B.Sc HHA, Culinary Arts |
| PhD Programs | Ph.D. (all disciplines) |

### How It Works
- Students register with their Program Category
- Faculty with a matching category see those students in **Review Queue**
- Faculty with **no category** assigned see **all pending activities** (super-reviewer role)
- Admins can update a faculty member's programCategory via User Management

---

## Best Practices

1. **Review promptly** — students depend on approved credits for portfolios and compliance reporting
2. **Check the certificate** — always view the proof before approving
3. **Add remarks when rejecting** — helps students understand what's missing and resubmit correctly
4. **Be consistent with credits** — use the credit guidelines as a reference
5. **Use All Activities** — periodically review the full list to catch any anomalies

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Review Queue is empty | All activities in your category may be reviewed; or no students in your category have submitted |
| Certificate won't open | Check your browser allows popups; try the Download button instead |
| Can't see certain students | Your Program Category filter may exclude them; ask admin to update your category |
| Approved activity not shown in student portfolio | Activity approval is instant; ask student to refresh |
| Login fails | Contact admin to verify your account is active |

---

**Last Updated:** February 2026  
**Repository:** https://github.com/arpanpramanik2003/ssh-v2
