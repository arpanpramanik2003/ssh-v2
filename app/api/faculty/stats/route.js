export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { Activity, User } = await initDB();

    let studentIds = null;

    if (auth.user.role === 'faculty') {
      const faculty = await User.findByPk(auth.user.id, { attributes: ['programCategory'] });
      if (faculty?.programCategory) {
        const studentsInCategory = await User.findAll({
          where: { role: 'student', programCategory: faculty.programCategory },
          attributes: ['id'],
        });
        studentIds = studentsInCategory.map((s) => s.id);
        if (studentIds.length === 0) {
          return NextResponse.json({
            totalActivities: 0, pendingCount: 0, approvedCount: 0,
            rejectedCount: 0, reviewedByMe: 0, recentReviews: [],
          });
        }
      }
    }

    const activityWhere = studentIds ? { studentId: studentIds } : {};

    const [totalActivities, pendingCount, approvedCount, rejectedCount, reviewedByMe, recentReviews] =
      await Promise.all([
        Activity.count({ where: activityWhere }),
        Activity.count({ where: { ...activityWhere, status: 'pending' } }),
        Activity.count({ where: { ...activityWhere, status: 'approved' } }),
        Activity.count({ where: { ...activityWhere, status: 'rejected' } }),
        Activity.count({ where: { ...activityWhere, approvedBy: auth.user.id } }),
        Activity.findAll({
          where: { ...activityWhere, approvedBy: auth.user.id },
          include: [{ model: User, as: 'student', attributes: ['name', 'studentId'] }],
          order: [['updatedAt', 'DESC']],
          limit: 5,
        }),
      ]);

    return NextResponse.json({ totalActivities, pendingCount, approvedCount, rejectedCount, reviewedByMe, recentReviews });
  } catch (error) {
    console.error('Faculty stats error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
