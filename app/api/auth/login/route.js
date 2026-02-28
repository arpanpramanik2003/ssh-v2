export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const { User } = await initDB();

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Account is deactivated' }, { status: 401 });
    }

    const token = generateToken(user.id, user.role);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        department: user.department, programCategory: user.programCategory,
        program: user.program, specialization: user.specialization,
        year: user.year, studentId: user.studentId, profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
