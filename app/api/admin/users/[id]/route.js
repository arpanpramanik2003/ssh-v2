export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { getCategoryValue, validateProgramSelection } from '@/lib/programsData';

// PUT /api/admin/users/[id]
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = params;
    const body = await request.json();
    const { name, email, role, department, programCategory, program, specialization, year, admissionYear, studentId, isActive } = body;

    const { User } = await initDB();
    const user = await User.findByPk(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (auth.user.id === parseInt(id) && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    let programCategoryValue = programCategory;
    if (programCategory) {
      const converted = getCategoryValue(programCategory);
      if (!converted) return NextResponse.json({ error: 'Invalid program category' }, { status: 400 });
      programCategoryValue = converted;
    }

    if (role === 'student') {
      if (!program) return NextResponse.json({ error: 'Program is required for students' }, { status: 400 });
      if (!specialization?.trim()) return NextResponse.json({ error: 'Specialization is mandatory for students' }, { status: 400 });
      if (!admissionYear) return NextResponse.json({ error: 'Admission year is mandatory for students' }, { status: 400 });

      if (programCategory && program) {
        const pv = validateProgramSelection(programCategory, program, specialization);
        if (!pv.valid) return NextResponse.json({ error: 'Invalid program selection', details: pv.message }, { status: 400 });
      }
    }

    await user.update({
      name, email, role,
      department: department !== undefined ? department : user.department,
      programCategory: programCategoryValue || user.programCategory,
      program: role === 'student' ? (program !== undefined ? program : user.program) : null,
      specialization: role === 'student' ? (specialization !== undefined ? specialization : user.specialization) : null,
      year: role === 'student' ? (year !== undefined ? year : user.year) : null,
      admissionYear: role === 'student' ? (admissionYear !== undefined ? admissionYear : user.admissionYear) : null,
      studentId: role === 'student' ? (studentId !== undefined ? studentId : user.studentId) : null,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return NextResponse.json({ success: true, message: 'User updated successfully', user: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = params;
    const { User, Activity } = await initDB();

    const user = await User.findByPk(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (auth.user.id === parseInt(id)) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    if (user.role === 'admin') return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 400 });

    await Activity.destroy({ where: { studentId: id } });
    await Activity.update(
      { approvedBy: null, remarks: `Previously approved by ${user.name} (deleted account)` },
      { where: { approvedBy: id } }
    );
    await user.destroy();

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
