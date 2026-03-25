export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { getCategoryValue, validateProgramSelection } from '@/lib/programsData';

// PUT /api/admin/users/[id]
export async function PUT(request, { params }) {
  try {
    const requestId = request.headers.get('x-vercel-id') || request.headers.get('x-request-id') || `local-${Date.now()}`;
    const enableDebugLogs = process.env.ADMIN_USER_UPDATE_DEBUG === 'true';

    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = params;
    const body = await request.json();
    const { name, email, role, department, programCategory, program, specialization, year, admissionYear, studentId, isActive } = body;

    if (enableDebugLogs) {
      console.info('[ADMIN_USER_UPDATE][START]', {
        requestId,
        adminUserId: auth.user.id,
        targetUserId: Number(id),
        role,
        hasProgramCategory: Boolean(programCategory),
        programCategory,
        program,
        specialization,
        year,
        admissionYear,
        hasStudentId: Boolean(studentId),
        isActive,
      });
    }

    const { User } = await initDB();
    const user = await User.findByPk(id);
    if (!user) {
      console.warn('[ADMIN_USER_UPDATE][NOT_FOUND]', { requestId, targetUserId: Number(id) });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (auth.user.id === parseInt(id) && isActive === false) {
      console.warn('[ADMIN_USER_UPDATE][BLOCK_SELF_DEACTIVATE]', { requestId, adminUserId: auth.user.id, targetUserId: Number(id) });
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    let programCategoryValue = programCategory;
    if (programCategory) {
      const converted = getCategoryValue(programCategory);
      if (!converted) {
        console.warn('[ADMIN_USER_UPDATE][INVALID_PROGRAM_CATEGORY]', { requestId, inputProgramCategory: programCategory });
        return NextResponse.json({ error: 'Invalid program category' }, { status: 400 });
      }
      programCategoryValue = converted;
    }

    if (role === 'student') {
      if (!program) {
        console.warn('[ADMIN_USER_UPDATE][MISSING_PROGRAM]', { requestId, targetUserId: Number(id), role });
        return NextResponse.json({ error: 'Program is required for students' }, { status: 400 });
      }
      if (!admissionYear) {
        console.warn('[ADMIN_USER_UPDATE][MISSING_ADMISSION_YEAR]', { requestId, targetUserId: Number(id), role });
        return NextResponse.json({ error: 'Admission year is mandatory for students' }, { status: 400 });
      }

      const categoryForValidation = programCategory || user.programCategory;
      const programForValidation = program !== undefined ? program : user.program;
      const specializationForValidation = specialization !== undefined ? specialization : user.specialization;

      if (categoryForValidation && programForValidation) {
        const pv = validateProgramSelection(categoryForValidation, programForValidation, specializationForValidation);
        if (!pv.valid) {
          console.warn('[ADMIN_USER_UPDATE][INVALID_PROGRAM_SELECTION]', {
            requestId,
            targetUserId: Number(id),
            categoryForValidation,
            programForValidation,
            specializationForValidation,
            validationMessage: pv.message,
          });
          return NextResponse.json({ error: 'Invalid program selection', details: pv.message }, { status: 400 });
        }
      }
    }

    const resolvedDepartment = role === 'student'
      ? (department !== undefined ? department : (program !== undefined ? program : user.program || user.department))
      : (department !== undefined ? department : user.department);

    await user.update({
      name, email, role,
      department: resolvedDepartment,
      programCategory: programCategoryValue || user.programCategory,
      program: role === 'student' ? (program !== undefined ? program : user.program) : null,
      specialization: role === 'student' ? (specialization !== undefined ? specialization : user.specialization) : null,
      year: role === 'student' ? (year !== undefined ? year : user.year) : null,
      admissionYear: role === 'student' ? (admissionYear !== undefined ? admissionYear : user.admissionYear) : null,
      studentId: role === 'student' ? (studentId !== undefined ? studentId : user.studentId) : null,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    if (enableDebugLogs) {
      console.info('[ADMIN_USER_UPDATE][SUCCESS]', {
        requestId,
        targetUserId: Number(id),
        role: user.role,
        programCategory: user.programCategory,
        program: user.program,
        specialization: user.specialization,
        year: user.year,
        admissionYear: user.admissionYear,
        hasStudentId: Boolean(user.studentId),
        isActive: user.isActive,
      });
    }

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
