export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User } = await initDB();
    const user = await User.findByPk(auth.user.id, {
      attributes: [
        'id', 'name', 'email', 'role', 'department', 'programCategory',
        'program', 'specialization', 'year', 'studentId', 'profilePicture', 'isActive',
      ],
    });

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
