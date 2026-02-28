export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// Shared helper: get student IDs in faculty's program category
async function getFacultyStudentIds(faculty, User) {
  if (faculty.role !== 'faculty') return null; // admin sees all
  const facultyData = await User.findByPk(faculty.id, { attributes: ['programCategory'] });
  if (!facultyData?.programCategory) return null;

  const students = await User.findAll({
    where: { role: 'student', programCategory: facultyData.programCategory },
    attributes: ['id'],
  });

  if (students.length === 0) return [-1]; // force empty result
  return students.map((s) => s.id);
}

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { Activity, User } = await initDB();

    const studentIds = await getFacultyStudentIds(auth.user, User);
    const where = { status: 'pending' };
    if (studentIds) where.studentId = studentIds;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [{
        model: User, as: 'student',
        attributes: ['name', 'email', 'studentId', 'department', 'programCategory', 'program', 'specialization', 'year'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      activities: rows,
      pagination: { total: count, page, pages: Math.ceil(count / limit), hasMore: offset + rows.length < count },
    });
  } catch (error) {
    console.error('Get pending activities error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
