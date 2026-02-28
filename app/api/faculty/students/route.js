export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { Op } from 'sequelize';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const year = searchParams.get('year');
    const programCategory = searchParams.get('programCategory');
    const program = searchParams.get('program');
    const specialization = searchParams.get('specialization');
    const admissionYear = searchParams.get('admissionYear');
    const offset = (page - 1) * limit;

    const { User, Activity } = await initDB();

    const where = { role: 'student' };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { program: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
      ];
    }
    if (programCategory && programCategory !== 'all') where.programCategory = programCategory;
    if (program && program !== 'all') where.program = program;
    if (specialization && specialization !== 'all') where.specialization = specialization;
    if (year && year !== 'all') where.year = parseInt(year);
    if (admissionYear && admissionYear !== 'all') where.admissionYear = parseInt(admissionYear);

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'email', 'studentId', 'department', 'year',
        'programCategory', 'program', 'specialization', 'admissionYear',
        'phone', 'dateOfBirth', 'gender', 'category', 'address',
        'tenthResult', 'twelfthResult', 'skills', 'languages', 'hobbies', 'achievements',
        'projects', 'certifications', 'linkedinUrl', 'githubUrl', 'portfolioUrl',
        'profilePicture', 'otherDetails', 'isActive', 'createdAt',
      ],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    const studentsWithStats = await Promise.all(
      rows.map(async (student) => {
        const [totalActivities, approvedActivities, totalCredits] = await Promise.all([
          Activity.count({ where: { studentId: student.id } }),
          Activity.count({ where: { studentId: student.id, status: 'approved' } }),
          Activity.sum('credits', { where: { studentId: student.id, status: 'approved' } }),
        ]);
        return { ...student.toJSON(), stats: { totalActivities, approvedActivities, totalCredits: totalCredits || 0 } };
      })
    );

    return NextResponse.json({
      students: studentsWithStats,
      pagination: { total: count, page, pages: Math.ceil(count / limit), hasMore: offset + rows.length < count },
    });
  } catch (error) {
    console.error('Get faculty students error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
