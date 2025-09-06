import { supabase } from '../config/supabase';
import { InspectionTemplate, Inspection } from '../types/inspection';

export interface DatabaseTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  sections: any; // JSON field
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_prebuilt: boolean;
}

export interface DatabaseInspection {
  id: string;
  template_id?: string;
  title: string;
  location: string;
  inspector: string;
  date: string;
  time: string;
  status: string;
  priority: string;
  responses: any; // JSON field
  sections?: any; // JSON field for dynamic forms
  photos: string[];
  score?: number;
  issues: number;
  categories: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class InspectionService {
  // Template operations
  static async saveTemplate(template: InspectionTemplate): Promise<InspectionTemplate> {
    try {
      const templateData: Partial<DatabaseTemplate> = {
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        tags: template.tags,
        sections: template.sections,
        created_by: template.createdBy,
        is_active: template.isActive,
        is_prebuilt: template.isPrebuilt,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('inspection_templates')
        .upsert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Error saving template:', error);
        throw new Error(`Failed to save template: ${error.message}`);
      }

      return this.mapDatabaseTemplateToTemplate(data);
    } catch (error) {
      console.error('Error in saveTemplate:', error);
      throw error;
    }
  }

  static async getTemplates(filters?: {
    category?: string;
    isPrebuilt?: boolean;
    isActive?: boolean;
  }): Promise<InspectionTemplate[]> {
    try {
      let query = supabase
        .from('inspection_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isPrebuilt !== undefined) {
        query = query.eq('is_prebuilt', filters.isPrebuilt);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return data.map(this.mapDatabaseTemplateToTemplate);
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  }

  static async getTemplate(id: string): Promise<InspectionTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Template not found
        }
        console.error('Error fetching template:', error);
        throw new Error(`Failed to fetch template: ${error.message}`);
      }

      return this.mapDatabaseTemplateToTemplate(data);
    } catch (error) {
      console.error('Error in getTemplate:', error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspection_templates')
        .delete()
        .eq('id', id)
        .eq('is_prebuilt', false); // Only allow deletion of custom templates

      if (error) {
        console.error('Error deleting template:', error);
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }

  // Inspection operations
  static async saveInspection(inspection: Partial<Inspection>): Promise<Inspection> {
    try {
      const inspectionData: Partial<DatabaseInspection> = {
        id: inspection.id,
        template_id: inspection.templateId,
        title: inspection.title,
        location: inspection.location,
        inspector: inspection.inspector,
        date: inspection.date,
        time: inspection.time,
        status: inspection.status,
        priority: inspection.priority,
        responses: inspection.responses,
        sections: inspection.sections,
        photos: inspection.photos || [],
        score: inspection.score,
        issues: inspection.issues || 0,
        categories: inspection.categories || [],
        description: inspection.description,
        updated_at: new Date().toISOString(),
        completed_at: inspection.completedAt
      };

      const { data, error } = await supabase
        .from('inspections')
        .upsert(inspectionData)
        .select()
        .single();

      if (error) {
        console.error('Error saving inspection:', error);
        throw new Error(`Failed to save inspection: ${error.message}`);
      }

      return this.mapDatabaseInspectionToInspection(data);
    } catch (error) {
      console.error('Error in saveInspection:', error);
      throw error;
    }
  }

  static async getInspections(filters?: {
    status?: string;
    inspector?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Inspection[]> {
    try {
      let query = supabase
        .from('inspections')
        .select(`
          *,
          inspection_templates (
            id,
            title,
            description,
            category,
            tags,
            sections
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.inspector) {
        query = query.eq('inspector', filters.inspector);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inspections:', error);
        throw new Error(`Failed to fetch inspections: ${error.message}`);
      }

      return data.map(this.mapDatabaseInspectionToInspection);
    } catch (error) {
      console.error('Error in getInspections:', error);
      throw error;
    }
  }

  static async getInspection(id: string): Promise<Inspection | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          inspection_templates (
            id,
            title,
            description,
            category,
            tags,
            sections
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Inspection not found
        }
        console.error('Error fetching inspection:', error);
        throw new Error(`Failed to fetch inspection: ${error.message}`);
      }

      return this.mapDatabaseInspectionToInspection(data);
    } catch (error) {
      console.error('Error in getInspection:', error);
      throw error;
    }
  }

  // Helper methods for mapping between database and application models
  private static mapDatabaseTemplateToTemplate(dbTemplate: DatabaseTemplate): InspectionTemplate {
    return {
      id: dbTemplate.id,
      title: dbTemplate.title,
      description: dbTemplate.description,
      category: dbTemplate.category,
      tags: dbTemplate.tags,
      sections: dbTemplate.sections,
      createdBy: dbTemplate.created_by,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at,
      isActive: dbTemplate.is_active,
      isPrebuilt: dbTemplate.is_prebuilt
    };
  }

  private static mapDatabaseInspectionToInspection(dbInspection: any): Inspection {
    return {
      id: dbInspection.id,
      templateId: dbInspection.template_id,
      template: dbInspection.inspection_templates ? 
        this.mapDatabaseTemplateToTemplate(dbInspection.inspection_templates) : undefined,
      title: dbInspection.title,
      location: dbInspection.location,
      inspector: dbInspection.inspector,
      date: dbInspection.date,
      time: dbInspection.time,
      status: dbInspection.status,
      priority: dbInspection.priority,
      responses: dbInspection.responses || [],
      sections: dbInspection.sections,
      photos: dbInspection.photos || [],
      score: dbInspection.score,
      issues: dbInspection.issues || 0,
      categories: dbInspection.categories || [],
      description: dbInspection.description,
      createdAt: dbInspection.created_at,
      updatedAt: dbInspection.updated_at,
      completedAt: dbInspection.completed_at
    };
  }
}

// Initialize database tables (run this once)
export const initializeDatabase = async () => {
  try {
    // Create templates table
    const { error: templatesError } = await supabase.rpc('create_inspection_templates_table');
    if (templatesError && !templatesError.message.includes('already exists')) {
      console.error('Error creating templates table:', templatesError);
    }

    // Create inspections table
    const { error: inspectionsError } = await supabase.rpc('create_inspections_table');
    if (inspectionsError && !inspectionsError.message.includes('already exists')) {
      console.error('Error creating inspections table:', inspectionsError);
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
