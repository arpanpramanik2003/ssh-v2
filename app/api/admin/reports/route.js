export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';
    const status = searchParams.get('status') || 'all';

    const { Activity } = await initDB();

    let whereConditions = ['1=1'];
    let params = [];

    if (startDate) { whereConditions.push('a."createdAt" >= ?'); params.push(startDate); }
    if (endDate) { whereConditions.push('a."createdAt" <= ?'); params.push(endDate + ' 23:59:59'); }
    if (status !== 'all') { whereConditions.push('a.status = ?'); params.push(status); }

    const whereClause = whereConditions.join(' AND ');

    const activitiesQuery = `
      SELECT 
        a.id, a.title, a.type, a.date, a.credits, a.organizer, a.description,
        a.status, a."createdAt", a."updatedAt",
        u.name as "userName", u."studentId", u.department,
        u."programCategory", u.program, u.specialization, u.year, u."admissionYear"
      FROM activities a
      LEFT JOIN users u ON a."studentId" = u.id
      WHERE ${whereClause}
      ORDER BY a."createdAt" DESC
    `;

    const activities = await Activity.sequelize.query(activitiesQuery, {
      replacements: params,
      type: Activity.sequelize.QueryTypes.SELECT,
    });

    const approvedActivities = activities.filter((a) => a.status === 'approved');
    const totalCredits = approvedActivities.reduce((sum, a) => sum + (parseFloat(a.credits) || 0), 0);

    const statusBreakdown = activities.reduce((acc, a) => { acc[a.status || 'Unknown'] = (acc[a.status || 'Unknown'] || 0) + 1; return acc; }, {});
    const programCategoryBreakdown = activities.reduce((acc, a) => { const c = a.programCategory || 'Unknown'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const activityTypeBreakdown = activities.reduce((acc, a) => { const t = a.type || 'Unknown'; acc[t] = (acc[t] || 0) + 1; return acc; }, {});

    if (format === 'csv') {
      const safe = (v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""'));
      const header = 'Student Name,Student ID,Program Category,Program,Specialization,Department,Year,Admission Year,Activity Title,Type,Date,Credits,Organizer,Status,Created Date,Description\n';
      const rows = activities.map((a) => [
        `"${safe(a.userName)}"`, `"${safe(a.studentId)}"`, `"${safe(a.programCategory)}"`,
        `"${safe(a.program)}"`, `"${safe(a.specialization)}"`, `"${safe(a.department)}"`,
        `"${safe(a.year)}"`, `"${safe(a.admissionYear)}"`, `"${safe(a.title)}"`,
        `"${safe(a.type)}"`, `"${safe(a.date)}"`, parseFloat(a.credits) || 0,
        `"${safe(a.organizer)}"`, `"${safe(a.status)}"`, `"${safe(a.createdAt)}"`, `"${safe(a.description)}"`,
      ].join(',')).join('\n');

      const csv = '\ufeff' + header + rows;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalActivities: activities.length,
        totalApprovedActivities: approvedActivities.length,
        totalCredits: Math.round(totalCredits * 10) / 10,
        statusBreakdown, programCategoryBreakdown, activityTypeBreakdown,
        dateRange: { start: startDate, end: endDate },
      },
      activities: activities.map((a) => ({
        id: a.id, title: a.title, type: a.type, date: a.date, credits: parseFloat(a.credits) || 0,
        organizer: a.organizer, description: a.description, status: a.status,
        createdAt: a.createdAt,
        student: { name: a.userName, studentId: a.studentId, department: a.department,
          programCategory: a.programCategory, program: a.program, specialization: a.specialization,
          year: a.year, admissionYear: a.admissionYear },
      })),
    });
  } catch (error) {
    console.error('Generate reports error:', error);
    return NextResponse.json({ error: 'Failed to generate reports', details: error.message }, { status: 500 });
  }
}
