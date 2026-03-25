export const getStudentProgramDisplay = (user) => {
  if (!user) return 'Not specified';

  const programParts = [user.program, user.specialization].filter(Boolean);
  if (programParts.length > 0) return programParts.join(' - ');

  return user.department || user.programCategory || 'Not specified';
};

export const getUserDepartmentLikeDisplay = (user) => {
  if (!user) return 'Not specified';

  if (user.role === 'student') {
    return getStudentProgramDisplay(user);
  }

  return user.department || user.programCategory || 'Not specified';
};
