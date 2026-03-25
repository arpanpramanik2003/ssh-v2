export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { getCategoryValue, validateProgramSelection } from '@/lib/programsData';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'student', programCategory, program, specialization,
      department, year, admissionYear, studentId } = body;

    // Basic validation
    if (!name || !email || !password || !programCategory) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      }, { status: 400 });
    }

    const programCategoryValue = getCategoryValue(programCategory);
    if (!programCategoryValue) {
      return NextResponse.json({ message: 'Invalid program category' }, { status: 400 });
    }

    if (role === 'student') {
      if (!program) {
        return NextResponse.json({ message: 'Program is required for students' }, { status: 400 });
      }
      if (!admissionYear) {
        return NextResponse.json({ message: 'Admission year is mandatory for students' }, { status: 400 });
      }
      const pv = validateProgramSelection(programCategory, program, specialization);
      if (!pv.valid) {
        return NextResponse.json({ message: 'Invalid program selection', details: pv.message }, { status: 400 });
      }
    }

    const { User } = await initDB();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ where: { studentId } });
      if (existingStudent) {
        return NextResponse.json({ message: 'Student ID already exists' }, { status: 409 });
      }
    }

    const user = await User.create({
      name, email, password, role,
      department: department || programCategoryValue,
      programCategory: programCategoryValue,
      program: role === 'student' ? program : null,
      specialization: role === 'student' ? specialization : null,
      year: role === 'student' ? year : null,
      admissionYear: role === 'student' ? admissionYear : null,
      studentId: role === 'student' ? studentId : null,
    });

    const token = generateToken(user.id, user.role);

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        department: user.department, programCategory: user.programCategory,
        program: user.program, specialization: user.specialization,
        year: user.year, admissionYear: user.admissionYear,
        studentId: user.studentId, profilePicture: user.profilePicture,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Registration failed. Please try again' }, { status: 500 });
  }
}
