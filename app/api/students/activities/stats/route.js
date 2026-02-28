export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { fn, col } from 'sequelize';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { Activity } = await initDB();

    const stats = await Activity.findAll({
      where: { studentId: auth.user.id },
      attributes: [
        'status',
        [fn('COUNT', col('status')), 'count'],
        [fn('SUM', col('credits')), 'totalCredits'],
      ],
      group: ['status'],
    });

    const totalActivities = await Activity.count({ where: { studentId: auth.user.id } });
    const totalCredits = await Activity.sum('credits', {
      where: { studentId: auth.user.id, status: 'approved' },
    });

    return NextResponse.json({
      totalActivities,
      totalCredits: totalCredits || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.getDataValue('count'));
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
