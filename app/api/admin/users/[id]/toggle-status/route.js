export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = params;
    const { User } = await initDB();
    const user = await User.findByPk(id);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (auth.user.id === parseInt(id) && user.isActive) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }
    if (user.role === 'admin' && user.isActive) {
      return NextResponse.json({ error: 'Cannot deactivate admin accounts' }, { status: 400 });
    }

    await user.update({ isActive: !user.isActive });

    return NextResponse.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return NextResponse.json({ error: 'Failed to toggle user status' }, { status: 500 });
  }
}
