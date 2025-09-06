import { supabase } from '../config/supabase';
import { UserProfile } from '../types/auth';

export interface InspectionAssignment {
  id: string;
  inspection_id: string;
  assigned_to: string; // User ID of inspector
  assigned_by: string; // User ID of admin/manager who assigned
  assigned_at: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  inspector_profile?: UserProfile;
  assigner_profile?: UserProfile;
  // Additional fields for display
  inspection_title?: string;
  inspection_location?: string;
  template_title?: string;
  template_creator_name?: string;
}

export interface CreateAssignmentData {
  inspection_id: string;
  assigned_to: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export const assignmentService = {
  // Create a new inspection assignment
  async createAssignment(assignmentData: CreateAssignmentData, assignedBy: string): Promise<InspectionAssignment> {
    const { data, error } = await supabase
      .from('inspection_assignments')
      .insert({
        ...assignmentData,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      } as any)
      .select(`
        *,
        inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(*),
        assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(*)
      `)
      .single();
      // alert in browser
      if (error) {
        alert('Error creating assignment: ' + error.message);
      }

    if (error) throw error;
    return data;
  },

  // Get assignments for a specific inspector
  async getInspectorAssignments(inspectorId: string): Promise<InspectionAssignment[]> {
    const { data, error } = await supabase
      .from('inspection_assignments')
      .select(`
        *,
        inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(*),
        assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(*)
      `)
      .eq('assigned_to', inspectorId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all assignments (for admins/managers)
  async getAllAssignments(): Promise<InspectionAssignment[]> {
    const { data, error } = await supabase
      .from('inspection_assignments')
      .select(`
        *,
        inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(*),
        assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(*)
      `)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get assignments created by a specific manager
  async getAssignmentsByManager(managerId: string): Promise<InspectionAssignment[]> {
    const { data, error } = await supabase
      .from('inspection_assignments')
      .select(`
        *,
        inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(*),
        assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(*)
      `)
      .eq('assigned_by', managerId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update assignment status
  async updateAssignmentStatus(assignmentId: string, status: InspectionAssignment['status']): Promise<void> {
    const { error } = await supabase
      .from('inspection_assignments')
      .update({ status } as any)
      .eq('id', assignmentId);

    if (error) throw error;
  },

  // Delete assignment and associated inspection
  async deleteAssignment(assignmentId: string): Promise<void> {
    console.log('🗑️ AssignmentService - Starting assignment deletion:', assignmentId);
    
    try {
      // First, get the assignment to find the inspection_id
      const { data: assignment, error: fetchError } = await supabase
        .from('inspection_assignments')
        .select('inspection_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching assignment for deletion:', fetchError);
        throw fetchError;
      }

      if (!assignment) {
        console.error('❌ Assignment not found:', assignmentId);
        throw new Error('Assignment not found');
      }

      console.log('📋 Found inspection to delete:', (assignment as any).inspection_id);

      // Delete the assignment first
      const { error: assignmentError } = await supabase
        .from('inspection_assignments')
        .delete()
        .eq('id', assignmentId);

      if (assignmentError) {
        console.error('❌ Error deleting assignment:', assignmentError);
        throw assignmentError;
      }

      console.log('✅ Assignment deleted successfully');

      // Then delete the associated inspection
      const { error: inspectionError } = await supabase
        .from('inspections')
        .delete()
        .eq('id', assignment.inspection_id);

      if (inspectionError) {
        console.error('❌ Error deleting inspection:', inspectionError);
        throw inspectionError;
      }

      console.log('✅ Associated inspection deleted successfully');
      console.log('🎉 Assignment and inspection deletion completed');
    } catch (error) {
      console.error('❌ Error in deleteAssignment:', error);
      throw error;
    }
  },

  // Get available inspectors for assignment
  async getAvailableInspectors(): Promise<UserProfile[]> {
    console.log('🔍 AssignmentService - Fetching available inspectors...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'inspector')
      .eq('status', 'approved')
      .order('full_name');

    if (error) {
      console.error('❌ Error fetching inspectors:', error);
      throw error;
    }
    
    console.log('✅ AssignmentService - Inspectors fetched:', data?.length || 0);
    return data || [];
  },

  // Get all assignable users (inspectors, managers, admins)
  async getAssignableUsers(): Promise<UserProfile[]> {
    console.log('🔍 AssignmentService - Fetching assignable users...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['inspector', 'manager', 'admin'])
      .eq('status', 'approved')
      .order('role', { ascending: false }) // Admins first, then managers, then inspectors
      .order('full_name');

    if (error) {
      console.error('❌ Error fetching assignable users:', error);
      throw error;
    }
    
    console.log('✅ AssignmentService - Assignable users fetched:', data?.length || 0);
    return data || [];
  },

  // Get assignment by inspection ID
  async getAssignmentByInspection(inspectionId: string): Promise<InspectionAssignment | null> {
    const { data, error } = await supabase
      .from('inspection_assignments')
      .select(`
        *,
        inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(*),
        assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(*)
      `)
      .eq('inspection_id', inspectionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};

export default assignmentService;
