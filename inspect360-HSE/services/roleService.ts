import { UserProfile } from '../types/auth';

export type UserRole = 'inspector' | 'manager' | 'admin';

export interface RolePermissions {
  canCreateTemplates: boolean;
  canEditTemplates: boolean;
  canDeleteTemplates: boolean;
  canCreateInspections: boolean;
  canAssignInspections: boolean;
  canViewAllInspections: boolean;
  canViewOwnInspections: boolean;
  canEditOwnInspections: boolean;
  canManageUsers: boolean;
}

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateTemplates: true,
    canEditTemplates: true,
    canDeleteTemplates: true,
    canCreateInspections: true,
    canAssignInspections: true,
    canViewAllInspections: true,
    canViewOwnInspections: true,
    canEditOwnInspections: true,
    canManageUsers: true,
  },
  manager: {
    canCreateTemplates: true,
    canEditTemplates: true,
    canDeleteTemplates: false,
    canCreateInspections: true,
    canAssignInspections: true,
    canViewAllInspections: true,
    canViewOwnInspections: true,
    canEditOwnInspections: true,
    canManageUsers: true,
  },
  inspector: {
    canCreateTemplates: false,
    canEditTemplates: false,
    canDeleteTemplates: false,
    canCreateInspections: false,
    canAssignInspections: false,
    canViewAllInspections: false,
    canViewOwnInspections: true,
    canEditOwnInspections: true,
    canManageUsers: false,
  },
};

export const roleService = {
  // Get permissions for a user
  getPermissions(user: UserProfile | null): RolePermissions {
    if (!user) {
      // Default permissions for non-authenticated users
      return {
        canCreateTemplates: false,
        canEditTemplates: false,
        canDeleteTemplates: false,
        canCreateInspections: false,
        canAssignInspections: false,
        canViewAllInspections: false,
        canViewOwnInspections: false,
        canEditOwnInspections: false,
        canManageUsers: false,
      };
    }
    
    return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.inspector;
  },

  // Check if user has specific permission
  hasPermission(user: UserProfile | null, permission: keyof RolePermissions): boolean {
    const permissions = this.getPermissions(user);
    return permissions[permission];
  },

  // Check if user can access admin features
  isAdmin(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  },

  // Check if user can manage others (admin or manager)
  canManageOthers(user: UserProfile | null): boolean {
    const result = user?.role === 'admin' || user?.role === 'manager';
    console.log('RoleService - canManageOthers check:', {
      user: user,
      role: user?.role,
      status: user?.status,
      result: result
    });
    return result;
  },

  // Check if user is inspector only
  isInspectorOnly(user: UserProfile | null): boolean {
    console.log('RoleService - isInspectorOnly check:', {
      user: user,
      role: user?.role,
      result: user?.role === 'inspector'
    });
    return user?.role === 'inspector';
  },

  // Get role display name
  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager/Responsible';
      case 'inspector': return 'Inspector';
      default: return 'Unknown';
    }
  },

  // Get available roles for assignment (based on current user's role)
  getAssignableRoles(currentUser: UserProfile | null): UserRole[] {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'admin':
        return ['admin', 'manager', 'inspector'];
      case 'manager':
        return ['inspector'];
      case 'inspector':
        return [];
      default:
        return [];
    }
  }
};

export default roleService;
