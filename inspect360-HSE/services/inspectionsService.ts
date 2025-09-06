import { supabase } from '../config/supabase';
import { Inspection, InspectionResponse } from '../types/inspection';

type UserProfile = {
  full_name: string | null;
  email: string;
};

type AssignmentWithInspector = {
  id: string;
  inspection_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string;
  status: string;
  inspections: Inspection | null;
  inspector_profiles: UserProfile | null;
};

const safeParse = <T = any>(val: any, fallback: T): T => {
  if (val == null) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  if (typeof val === 'object') return (val as T) ?? fallback;
  return fallback;
};

const normalizeInspection = (raw: any) => {
  const template = safeParse(raw.template, null as any);
  const responses = safeParse(raw.responses, [] as Array<{ fieldId: string; value: any; timestamp?: string }>);
  return { ...raw, template, responses };
};


export class InspectionsService {
  // Save inspection (d  }

  // Get a specific inspection by ID
  static async getInspectionById(inspectionId: string): Promise<Inspection | null> {
    try {
      console.log('🔍 Getting inspection by ID:', inspectionId);
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('📭 No inspection found with ID:', inspectionId);
          return null;
        }
        throw error;
      }

      const inspection = this.mapSupabaseToInspection(data);
      console.log('✅ Found inspection:', inspection.title);
      if (!data) return null;
      return normalizeInspection(data);
    } catch (error) {
      console.error('❌ Error getting inspection by ID:', error);
      throw error;
    }
  }

  // Get all inspections by status
  static async getInspectionsByStatus(status: string): Promise<Inspection[]> {
    try {
      console.log('📋 Getting inspections by status:', status);
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => this.mapSupabaseToInspection(item));
    } catch (error) {
      console.error('❌ Error getting inspections by status:', error);
      throw error;
    }
  }

  // Save inspection (draft or completed)
  static async saveInspection(inspection: Inspection): Promise<Inspection> {
    try {
      console.log('🔄 InspectionsService - Saving inspection:', {
        id: inspection.id,
        idType: typeof inspection.id,
        title: inspection.title,
        inspector: inspection.inspector,
        status: inspection.status,
        templateId: inspection.templateId,
        responsesCount: inspection.responses?.length || 0,
        fullData: inspection
      });
      
      const supabaseInspection = this.mapInspectionToSupabase(inspection);
      
      console.log('🔄 InspectionsService - Mapped inspection for Supabase:', {
        id: supabaseInspection.id,
        title: supabaseInspection.title,
        inspector: supabaseInspection.inspector,
        template_id: supabaseInspection.template_id,
        status: supabaseInspection.status,
        fullMappedData: supabaseInspection
      });
      
      console.log('📡 InspectionsService - About to call Supabase upsert...');
      
      const { data, error } = await (supabase as any)
        .from('inspections')
        .upsert([supabaseInspection])
        .select()
        .single();

      console.log('💾 Supabase upsert result:', { 
        success: !error,
        hasData: !!data,
        dataId: data?.id || null,
        error: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint
      });

      if (error) {
        console.error('❌ InspectionsService - Database error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.error('❌ InspectionsService - No data returned from upsert');
        throw new Error('No data returned from inspection save');
      }

      console.log('✅ InspectionsService - Inspection saved successfully:', {
        savedId: data.id,
        savedStatus: data.status,
        savedTitle: data.title
      });
      
      const mappedResult = this.mapSupabaseToInspection(data);
      console.log('🔄 InspectionsService - Mapped result back to Inspection:', {
        resultId: mappedResult.id,
        resultStatus: mappedResult.status,
        resultTitle: mappedResult.title
      });
      
      return mappedResult;
    } catch (error) {
      console.error('❌ InspectionsService - Error saving inspection:', error);
      throw error;
    }
  }

  // Save as draft
  static async saveDraft(inspection: Partial<Inspection>): Promise<Inspection> {
    console.log('🔄 InspectionsService - Saving as draft:', {
      id: inspection.id,
      title: inspection.title,
      templateId: inspection.templateId
    });
    
    // Generate a proper UUID for the inspection
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Generate meaningful title if not provided
    const generateDraftTitle = () => {
      const date = new Date().toLocaleDateString();
      const templateName = inspection.template?.title || 'Inspection';
      const location = inspection.location?.trim();
      
      if (location) {
        return `${templateName} - ${location} (${date})`;
      } else {
        return `${templateName} - Draft (${date})`;
      }
    };
    
    const draftInspection: Inspection = {
      id: inspection.id || generateUUID(),
      templateId: inspection.templateId,
      template: inspection.template,
      title: inspection.title || generateDraftTitle(),
      location: inspection.location || '',
      inspector: inspection.inspector || '',
      date: inspection.date || new Date().toISOString().split('T')[0],
      time: inspection.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'pending',
      priority: inspection.priority || 'medium',
      responses: inspection.responses || [],
      sections: inspection.sections,
      photos: inspection.photos || [],
      score: inspection.score,
      issues: inspection.issues || 0,
      categories: inspection.categories || [],
      description: inspection.description,
      createdAt: inspection.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: undefined
    };

    return this.saveInspection(draftInspection);
  }

  // Submit inspection (mark as completed)
  static async submitInspection(inspection: Inspection): Promise<Inspection> {
    console.log('� InspectionsService - Starting submitInspection:', {
      id: inspection.id,
      title: inspection.title,
      status: inspection.status,
      inspector: inspection.inspector,
      templateId: inspection.templateId,
      responsesCount: inspection.responses?.length || 0,
      fullInspectionData: inspection
    });
    
    const submittedInspection: Inspection = {
      ...inspection,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('� InspectionsService - Prepared submission data:', {
      id: submittedInspection.id,
      status: submittedInspection.status,
      completedAt: submittedInspection.completedAt,
      fullSubmittedData: submittedInspection
    });

    console.log('📤 InspectionsService - About to call saveInspection with status "completed"');
    
    try {
      const result = await this.saveInspection(submittedInspection);
      console.log('✅ InspectionsService - submitInspection successful:', {
        savedId: result.id,
        savedStatus: result.status,
        savedCompletedAt: result.completedAt
      });
      return result;
    } catch (error) {
      console.error('❌ InspectionsService - submitInspection failed:', error);
      throw error;
    }
  }

  // Get all inspections
  // Get all inspections including assignments
  static async getAllInspections(): Promise<Inspection[]> {
    try {
      // Get direct inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .order('updated_at', { ascending: false });

      if (inspectionsError) throw inspectionsError;

      // Get inspections from assignments with their related inspection data (left join to handle assignments without inspections)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('inspection_assignments')
        .select(`
          id,
          inspection_id,
          assigned_to,
          assigned_by,
          assigned_at,
          due_date,
          priority,
          status,
          notes,
          inspections!left(id, title, template_id, location, status, created_at, updated_at),
          inspector_profile:user_profiles!inspection_assignments_assigned_to_fkey(full_name, email),
          assigner_profile:user_profiles!inspection_assignments_assigned_by_fkey(full_name, email)
        `)
        .order('assigned_at', { ascending: false }) as {
          data: any[] | null;
          error: any;
        };

      if (assignmentsError) throw assignmentsError;

      console.log('📋 Raw assignments data:', assignments?.length || 0);
      console.log('📋 Assignments details:', assignments?.map(a => ({
        id: a.id,
        inspection_id: a.inspection_id,
        hasInspectionData: !!a.inspections,
        inspector: a.inspector_profile?.full_name || a.inspector_profile?.email,
        status: a.status
      })));

      // Convert direct inspections
      const directInspections = inspections.map(this.mapSupabaseToInspection);
      console.log('📋 Direct inspections:', directInspections.length);

      // Convert assignment-based inspections
      const assignmentInspections: Inspection[] = (assignments || []).map(assignment => {
        const inspection = assignment.inspections;
        console.log(`📋 Processing assignment ${assignment.id}:`, {
          hasInspectionData: !!inspection,
          inspectionTitle: inspection?.title,
          assignmentStatus: assignment.status
        });
        
        return {
          id: assignment.inspection_id || assignment.id, // Use inspection_id if available, fallback to assignment id
          templateId: inspection?.template_id || '',
          template: undefined, // Will be loaded separately if needed
          title: inspection?.title || 'Assigned Inspection',
          location: inspection?.location || 'To be determined',
          inspector: assignment.inspector_profile?.full_name || assignment.inspector_profile?.email || 'Assigned Inspector',
          date: assignment.due_date ? assignment.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
          time: '09:00', // Default time for assignments
          status: inspection?.status || this.mapAssignmentStatusToInspectionStatus(assignment.status) as 'pending' | 'in-progress' | 'completed',
          priority: (assignment.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          responses: [],
          sections: [],
          photos: [],
          score: undefined,
          issues: 0,
          categories: [],
          description: assignment.notes || '',
          createdAt: assignment.assigned_at,
          updatedAt: inspection?.updated_at || assignment.assigned_at,
          completedAt: undefined,
          // Add assignment metadata
          assignmentId: assignment.id,
          assignedBy: assignment.assigner_profile?.full_name || 'Admin',
          assignedAt: assignment.assigned_at,
          dueDate: assignment.due_date
        };
      });

      console.log('📋 Assignment-based inspections:', assignmentInspections.length);

      // Combine and deduplicate (prioritize direct inspections over assignments)
      const inspectionMap = new Map();
      
      // Add assignment inspections first
      assignmentInspections.forEach(inspection => {
        inspectionMap.set(inspection.id, inspection);
      });
      
      // Add direct inspections (will overwrite assignments if same ID)
      directInspections.forEach(inspection => {
        inspectionMap.set(inspection.id, inspection);
      });

      const finalInspections = Array.from(inspectionMap.values());
      console.log('📋 Final combined inspections:', finalInspections.length);
      console.log('📋 Final inspection titles:', finalInspections.map(i => i.title));

    return finalInspections.map(normalizeInspection);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
  }

  // Helper method to map assignment status to inspection status
  private static mapAssignmentStatusToInspectionStatus(assignmentStatus: string): string {
    switch (assignmentStatus) {
      case 'assigned': return 'pending';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      case 'overdue': return 'pending';
      default: return 'pending';
    }
  }

  // Get drafts
  static async getDrafts(): Promise<Inspection[]> {
    return this.getInspectionsByStatus('pending');
  }

  // Delete inspection
  static async deleteInspection(inspectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inspection:', error);
      throw error;
    }
  }

  // Search inspections
  static async searchInspections(query: string): Promise<Inspection[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .or(`title.ilike.%${query}%,location.ilike.%${query}%,inspector.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapSupabaseToInspection);
    } catch (error) {
      console.error('Error searching inspections:', error);
      return [];
    }
  }

  // Map Supabase data to Inspection
  private static mapSupabaseToInspection(data: any): Inspection {
    // Get status from either column, with backward compatibility
    let status = data.inspection_status || data.status;
    
    // Convert "draft" status to "pending" for assignments
    if (status === 'draft') {
      status = 'pending';
    }
    
    return {
      id: data.id,
      templateId: data.template_id,
      template: data.template,
      title: data.title,
      location: data.location,
      inspector: data.inspector,
      date: data.date,
      time: data.time,
      status: status,
      priority: data.priority,
      responses: data.responses || [],
      sections: data.sections,
      photos: data.photos || [],
      score: data.score,
      issues: data.issues || 0,
      categories: data.categories || [],
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    };
  }

  // Map Inspection to Supabase format
  private static mapInspectionToSupabase(inspection: Inspection): any {
    return {
      id: inspection.id,
      template_id: inspection.templateId,
      template: inspection.template,
      title: inspection.title,
      location: inspection.location,
      inspector: inspection.inspector,
      date: inspection.date,
      time: inspection.time,
      status: inspection.status, // Use standard status field for now
      priority: inspection.priority,
      responses: inspection.responses,
      sections: inspection.sections,
      photos: inspection.photos,
      score: inspection.score,
      issues: inspection.issues,
      categories: inspection.categories,
      description: inspection.description,
      created_at: inspection.createdAt,
      updated_at: inspection.updatedAt,
      completed_at: inspection.completedAt
    };
  }

  // Create a new inspection from a template (for assignments)
  static async createInspectionFromTemplate(
    templateId: string, 
    assignedTo: string, 
    assignedBy: string,
    title?: string,
    location?: string,
    dueDate?: string
  ): Promise<Inspection> {
    try {
      console.log('🏗️ Creating inspection from template:', { templateId, assignedTo, assignedBy });
      
      // Generate a new UUID for the inspection
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Get the assignee's profile for inspector name
      const { data: assigneeProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', assignedTo)
        .single() as { data: UserProfile | null; error: any };

      const inspectorName = assigneeProfile 
        ? (assigneeProfile.full_name || assigneeProfile.email || 'Unknown Inspector')
        : 'Unknown Inspector';

      const newInspection: Inspection = {
        id: generateUUID(),
        templateId: templateId,
        title: title || 'New Inspection Assignment',
        location: location || 'To be determined',
        inspector: inspectorName,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'pending',
        priority: 'medium',
        responses: [],
        photos: [],
        score: 0,
        issues: 0,
        categories: [],
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Saving new inspection from template:', newInspection);
      
      const savedInspection = await this.saveInspection(newInspection);
      
      console.log('✅ Successfully created inspection from template:', savedInspection.id);
      return savedInspection;
    } catch (error) {
      console.error('❌ Error creating inspection from template:', error);
      throw error;
    }
  }
}
