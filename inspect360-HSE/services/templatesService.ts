import { supabase } from '../config/supabase';
import { InspectionTemplate } from '../types/inspection';

export class TemplatesService {
  // Get all templates with creator names
  static async getAllTemplates(): Promise<InspectionTemplate[]> {
    try {
      console.log('🔍 Fetching all templates from database...');
      
      const { data, error } = await supabase
        .from('templates')
        .select(`
          id,
          title,
          description,
          category,
          tags,
          sections,
          status,
          is_active,
          is_prebuilt,
          created_at,
          updated_at,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching templates:', error);
        throw error;
      }

      console.log('✅ Raw templates data from Supabase:', data);
      console.log('📊 Total templates found:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('⚠️ No templates found in database');
        return [];
      }

      const mappedTemplates = data.map(template => this.mapSupabaseToTemplate(template));
      console.log('✅ Mapped templates:', mappedTemplates);
      
      return mappedTemplates;
    } catch (error) {
      console.error('❌ Error in getAllTemplates:', error);
      throw error;
    }
  }

  // Get template by ID
  static async getTemplateById(templateId: string): Promise<InspectionTemplate | null> {
    try {
      console.log('🔍 Fetching template by ID:', templateId);
      
      const { data, error } = await supabase
        .from('templates')
        .select(`
          id,
          title,
          description,
          category,
          tags,
          sections,
          status,
          is_active,
          is_prebuilt,
          created_at,
          updated_at,
          created_by
        `)
        .eq('id', templateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ Template not found:', templateId);
          return null;
        }
        console.error('❌ Error fetching template by ID:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ No template data returned for ID:', templateId);
        return null;
      }

      console.log('✅ Template fetched successfully:', (data as any).title);
      return this.mapSupabaseToTemplate(data);
    } catch (error) {
      console.error('❌ Error in getTemplateById:', error);
      return null;
    }
  }

  // Save template (create or update)
  static async saveTemplate(template: InspectionTemplate): Promise<InspectionTemplate> {
    try {
      console.log('💾 Attempting to save template to database...', template.title);
      console.log('💾 Template data being saved:', template);
      
      const templateData: any = {
        title: template.title,
        description: template.description || '',
        category: template.category,
        tags: template.tags || [],
        sections: template.sections || [],
        created_by: template.createdBy,
        is_prebuilt: template.isPrebuilt || false,
        is_active: template.isActive !== undefined ? template.isActive : true,
        status: template.status || 'active'
      };

      console.log('💾 Final template data for database:', templateData);

      let data, error;

      if (template.id) {
        // Update existing template
        templateData.id = template.id;
        console.log('💾 Updating existing template with ID:', template.id);
        
        const result = await supabase
          .from('templates')
          .upsert(templateData)
          .select('*')
          .single();
          
        data = result.data;
        error = result.error;
      } else {
        // Create new template
        console.log('💾 Creating new template');
        
        const result = await supabase
          .from('templates')
          .insert(templateData)
          .select('*')
          .single();
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Supabase error saving template:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from template save operation');
        throw new Error('No data returned from save operation');
      }

      console.log('✅ Template saved successfully to database:', data);
      return this.mapSupabaseToTemplate(data);
    } catch (error) {
      console.error('❌ Error in saveTemplate:', error);
      throw error;
    }
  }

  // Save template as draft
  static async saveDraft(template: Partial<InspectionTemplate>): Promise<InspectionTemplate> {
    try {
      console.log('💾 Saving template as draft...');
      
      const templateData: any = {
        id: template.id || this.generateUUID(),
        title: template.title || 'Untitled Draft',
        description: template.description || '',
        category: template.category || 'custom',
        tags: template.tags || ['draft'],
        sections: template.sections || [],
        created_by: template.createdBy || 'unknown',
        is_prebuilt: false,
        is_active: false,
        status: 'draft'
      };

      console.log('💾 Draft template data:', templateData);

      const { data, error } = await supabase
        .from('templates')
        .upsert(templateData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error saving template draft:', error);
        throw error;
      }

      console.log('✅ Template draft saved successfully:', data);
      return this.mapSupabaseToTemplate(data);
    } catch (error) {
      console.error('❌ Error in saveDraft:', error);
      throw error;
    }
  }

  public static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Delete template
  static async deleteTemplate(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting template:', id);
      
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting template:', error);
        throw error;
      }

      console.log('✅ Template deleted successfully');
    } catch (error) {
      console.error('❌ Error in deleteTemplate:', error);
      throw error;
    }
  }

  // Map Supabase data to template interface
  private static mapSupabaseToTemplate(data: any): InspectionTemplate {
    console.log('🔄 Mapping Supabase data to template:', data);
    
    const mapped = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      category: data.category,
      tags: data.tags || [],
      sections: data.sections || [],
      status: data.status || 'draft',
      isActive: data.is_active || false,
      isPrebuilt: data.is_prebuilt || false,
      createdBy: data.created_by || 'unknown',
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at
    };

    console.log('🔄 Mapped template:', mapped);
    return mapped;
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing database connection...');
      
      const { data, error } = await supabase
        .from('templates')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test error:', error);
      return false;
    }
  }

  // Cleanup corrupted templates (placeholder for compatibility)
  static async cleanupCorruptedTemplates(): Promise<void> {
    try {
      console.log('🧹 Cleaning up corrupted templates...');
      // This is a placeholder - in a real implementation you might want to
      // delete templates with invalid data structures
      console.log('✅ Template cleanup completed');
    } catch (error) {
      console.error('❌ Error during template cleanup:', error);
    }
  }

  // Map InspectionTemplate to Supabase format
  private static mapTemplateToSupabase(template: InspectionTemplate): any {
    console.log('🔄 TemplatesService - Mapping template to Supabase format:', {
      originalId: template.id,
      title: template.title,
      createdBy: template.createdBy
    });
    
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      tags: template.tags,
      sections: template.sections,
      created_by: template.createdBy,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
      is_active: template.isActive,
      is_prebuilt: template.isPrebuilt,
      status: template.status || 'active' // Include status field
    };
  }

  // Initialize prebuilt templates in database
  static async initializePrebuiltTemplates(): Promise<void> {
    try {
      console.log('🏗️ Initializing prebuilt templates...');
      
      // First, clean up any corrupted templates
      await this.cleanupCorruptedTemplates();
      
      const defaultTemplates = this.getDefaultTemplates();
      console.log(`📋 Found ${defaultTemplates.length} default templates to initialize`);
      
      for (const template of defaultTemplates) {
        const supabaseTemplate = this.mapTemplateToSupabase(template);
        
        // Check if template already exists by title (more reliable than ID)
        const { data: existing, error: checkError } = await supabase
          .from('templates')
          .select('id, title')
          .eq('title', template.title)
          .eq('is_prebuilt', true)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing template:', checkError);
          continue;
        }

        if (!existing) {
          console.log(`➕ Inserting new prebuilt template: "${template.title}"`);
          // Only insert if template doesn't exist
          const { error: insertError } = await supabase
            .from('templates')
            .insert([supabaseTemplate] as any);

          if (insertError) {
            console.error('❌ Error initializing template:', template.title, insertError);
          } else {
            console.log(`✅ Successfully inserted template: "${template.title}"`);
          }
        } else {
          console.log(`⏭️ Template already exists, skipping: "${template.title}"`);
        }
      }
      
      console.log('🏁 Prebuilt template initialization complete');
    } catch (error) {
      console.error('❌ Error initializing prebuilt templates:', error);
    }
  }

  // Generate a simple UUID-like string for templates
  private static generateTemplateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Default templates as fallback
  private static getDefaultTemplates(): InspectionTemplate[] {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001', // Fixed UUID for safety template
        title: 'Safety Inspection Checklist',
        description: 'Comprehensive safety inspection for workplace environments',
        category: 'safety',
        tags: ['safety', 'workplace', 'checklist'],
        sections: [
          {
            id: 1,
            title: 'General Information',
            description: 'Basic inspection details',
            fields: [
              { 
                id: 'inspector', 
                label: 'Inspector Name', 
                type: 'text', 
                required: true,
                placeholder: 'Enter inspector full name'
              },
              { 
                id: 'date', 
                label: 'Inspection Date', 
                type: 'date', 
                required: true 
              },
              { 
                id: 'location', 
                label: 'Location', 
                type: 'text', 
                required: true,
                placeholder: 'Enter location or area being inspected'
              },
              { 
                id: 'time', 
                label: 'Inspection Time', 
                type: 'time', 
                required: true 
              }
            ]
          },
          {
            id: 2,
            title: 'Safety Equipment',
            description: 'Assessment of safety equipment availability and condition',
            fields: [
              { 
                id: 'fire_extinguishers', 
                label: 'Fire Extinguishers Present and Functional', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'emergency_exits', 
                label: 'Emergency Exits Clear and Marked', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'first_aid_kit', 
                label: 'First Aid Kit Available and Stocked', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'safety_signs', 
                label: 'Safety Signs Visible and Legible', 
                type: 'boolean', 
                required: true 
              }
            ]
          },
          {
            id: 3,
            title: 'Workplace Conditions',
            description: 'General workplace safety conditions',
            fields: [
              { 
                id: 'lighting_adequate', 
                label: 'Adequate Lighting Throughout Area', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'floors_clean', 
                label: 'Floors Clean and Free of Hazards', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'ventilation', 
                label: 'Ventilation System Working Properly', 
                type: 'boolean', 
                required: true 
              },
              { 
                id: 'temperature', 
                label: 'Temperature Comfortable for Work', 
                type: 'boolean', 
                required: true 
              }
            ]
          }
        ],
        status: 'active',
        isActive: true,
        isPrebuilt: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002', // Fixed UUID for incident report template
        title: 'Incident Report Form',
        description: 'Standard incident reporting form for workplace incidents',
        category: 'incident',
        tags: ['incident', 'report', 'safety'],
        sections: [
          {
            id: 1,
            title: 'Incident Details',
            description: 'Basic information about the incident',
            fields: [
              { 
                id: 'incident_date', 
                label: 'Date of Incident', 
                type: 'date', 
                required: true 
              },
              { 
                id: 'incident_time', 
                label: 'Time of Incident', 
                type: 'time', 
                required: true 
              },
              { 
                id: 'location', 
                label: 'Location of Incident', 
                type: 'text', 
                required: true,
                placeholder: 'Describe the exact location'
              },
              { 
                id: 'reporter_name', 
                label: 'Reporter Name', 
                type: 'text', 
                required: true,
                placeholder: 'Person reporting the incident'
              }
            ]
          },
          {
            id: 2,
            title: 'Incident Description',
            description: 'Detailed description of what happened',
            fields: [
              { 
                id: 'incident_type', 
                label: 'Type of Incident', 
                type: 'select', 
                required: true,
                options: ['Near Miss', 'Minor Injury', 'Major Injury', 'Property Damage', 'Environmental']
              },
              { 
                id: 'description', 
                label: 'Detailed Description', 
                type: 'textarea', 
                required: true,
                placeholder: 'Provide a detailed description of what happened'
              },
              { 
                id: 'immediate_cause', 
                label: 'Immediate Cause', 
                type: 'textarea', 
                required: true,
                placeholder: 'What directly caused the incident?'
              }
            ]
          }
        ],
        status: 'active',
        isActive: true,
        isPrebuilt: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];
  }
}
