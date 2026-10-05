import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const userRole = user?.role?.toUpperCase() || '';
  const isAllowed = allowedRoles.some((role) => {
    const r = role.toUpperCase();
    return userRole === r || userRole === `ROLE_${r}` || `ROLE_${userRole}` === r;
  });

  if (!isAllowed) {
    // Redirect to legitimate role home
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isTeacher) return <Navigate to="/teacher" replace />;
    if (isStudent) return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
