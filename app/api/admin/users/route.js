export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { getCategoryValue, validateProgramSelection } from '@/lib/programsData';
import { Op } from 'sequelize';

// GET /api/admin/users
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const programCategory = searchParams.get('programCategory') || 'all';
    const program = searchParams.get('program') || 'all';
    const specialization = searchParams.get('specialization') || 'all';
    const year = searchParams.get('year') || 'all';
    const admissionYear = searchParams.get('admissionYear') || 'all';
    const offset = (page - 1) * limit;

    const { User } = await initDB();
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { programCategory: { [Op.like]: `%${search}%` } },
        { program: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role !== 'all') whereClause.role = role;
    if (programCategory !== 'all') whereClause.programCategory = programCategory;
    if (program !== 'all') whereClause.program = program;
    if (specialization !== 'all') whereClause.specialization = specialization;
    if (year !== 'all') whereClause.year = parseInt(year);
    if (admissionYear !== 'all') whereClause.admissionYear = parseInt(admissionYear);

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password'] },
    });

    return NextResponse.json({
      users,
      pagination: { total: count, pages: Math.ceil(count / limit), currentPage: page, limit },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { name, email, password, role, department, programCategory, program, specialization, year, admissionYear, studentId } = body;

    if (!name || !email || !password || !role || !programCategory) {
      return NextResponse.json({ error: 'Name, email, password, role, and program category are required' }, { status: 400 });
    }

    const programCategoryValue = getCategoryValue(programCategory);
    if (!programCategoryValue) return NextResponse.json({ error: 'Invalid program category' }, { status: 400 });

    if (role === 'student') {
      if (!program) return NextResponse.json({ error: 'Program is required for students' }, { status: 400 });
      if (!admissionYear) return NextResponse.json({ error: 'Admission year is mandatory for students' }, { status: 400 });

      const pv = validateProgramSelection(programCategory, program, specialization);
      if (!pv.valid) return NextResponse.json({ error: 'Invalid program selection', details: pv.message }, { status: 400 });
    }

    const { User } = await initDB();

    const existing = await User.findOne({ where: { email } });
    if (existing) return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });

    const studentDepartment = role === 'student'
      ? (program || null)
      : (department || null);

    const user = await User.create({
      name, email, password, role,
      department: studentDepartment,
      programCategory: programCategoryValue,
      program: role === 'student' ? program : null,
      specialization: role === 'student' ? specialization : null,
      year: role === 'student' ? year : null,
      admissionYear: role === 'student' ? admissionYear : null,
      studentId: role === 'student' ? studentId : null,
      isActive: true,
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return NextResponse.json({ success: true, message: 'User created successfully', user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
