export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User, Activity } = await initDB();
    const { Op } = await import('sequelize');

    const [totalUsers, studentCount, facultyCount, adminCount, totalActivities, pendingActivities, approvedActivities, rejectedActivities] =
      await Promise.all([
        User.count(),
        User.count({ where: { role: 'student' } }),
        User.count({ where: { role: 'faculty' } }),
        User.count({ where: { role: 'admin' } }),
        Activity.count(),
        Activity.count({ where: { status: 'pending' } }),
        Activity.count({ where: { status: 'approved' } }),
        Activity.count({ where: { status: 'rejected' } }),
      ]);

    let programCategoryStats = [];
    try {
      programCategoryStats = await User.findAll({
        attributes: ['programCategory', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
        where: { programCategory: { [Op.not]: null }, role: { [Op.in]: ['student', 'faculty'] } },
        group: ['programCategory'],
        raw: true,
      });
    } catch {}

    let activityTypeStats = [];
    try {
      activityTypeStats = await Activity.findAll({
        attributes: ['type', [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']],
        group: ['type'],
        raw: true,
      });
    } catch {}

    let topStudents = [];
    try {
      const studentsWithActivities = await User.findAll({
        where: { role: 'student' },
        include: [{ model: Activity, as: 'activities', attributes: ['credits', 'status'], required: false }],
        attributes: ['id', 'name', 'studentId', 'department', 'programCategory', 'program', 'specialization'],
        raw: false,
      });

      topStudents = studentsWithActivities
        .map((student) => {
          const activities = student.activities || [];
          const approved = activities.filter((a) => a.status === 'approved');
          const totalCredits = approved.reduce((sum, a) => sum + (parseFloat(a.credits) || 0), 0);
          return {
            id: student.id, name: student.name || 'Unknown', studentId: student.studentId || 'N/A',
            department: student.department, programCategory: student.programCategory,
            program: student.program, specialization: student.specialization,
            totalCredits: Math.round(totalCredits * 10) / 10, activityCount: activities.length,
          };
        })
        .filter((s) => s.activityCount > 0 || s.totalCredits > 0)
        .sort((a, b) => b.totalCredits - a.totalCredits || b.activityCount - a.activityCount)
        .slice(0, 10);
    } catch {}

    return NextResponse.json({
      userStats: { totalUsers, studentCount, facultyCount, adminCount },
      activityStats: { totalActivities, pendingActivities, approvedActivities, rejectedActivities },
      programCategoryStats: programCategoryStats.map((c) => ({ programCategory: c.programCategory || 'Unknown', count: parseInt(c.count) || 0 })),
      activityTypeStats: activityTypeStats.map((t) => ({ type: t.type || 'Unknown', count: parseInt(t.count) || 0 })),
      topStudents,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin statistics', details: error.message }, { status: 500 });
  }
}
