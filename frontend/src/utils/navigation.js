export const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'PARENT':
      return '/parent/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
};
