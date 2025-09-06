// Inspection Types
export interface InspectionField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'number' | 'boolean' | 'select' | 'image';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface InspectionSection {
  id: string | number;
  title: string;
  description?: string;
  fields: InspectionField[];
}

export interface InspectionTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  sections: InspectionSection[];
  createdBy?: string; // Optional for prebuilt templates
  createdByName?: string; // Display name for the creator
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isPrebuilt: boolean;
  status?: 'active' | 'draft' | 'archived'; // Template status
}

export interface InspectionResponse {
  fieldId: string;
  value: any;
  timestamp: string;
}

export interface Inspection {
  id: string;
  templateId?: string;
  template?: InspectionTemplate; // Embedded template for dynamic forms
  title: string;
  location: string;
  inspector: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  responses: InspectionResponse[];
  sections?: InspectionSection[]; // For dynamic forms without templates
  photos: string[];
  score?: number;
  issues: number;
  categories: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Form Field Component Types
export interface FormFieldProps {
  field: InspectionField;
  value: any;
  onChange: (value: any) => void;
  isRequired?: boolean;
  showValidation?: boolean;
  readOnly?: boolean;
  theme: any;
}

// Template Builder Types
export interface TemplateBuilderState {
  template: Partial<InspectionTemplate>;
  currentSection: number;
  isDirty: boolean;
}

export type FieldType = InspectionField['type'];

export interface FieldTypeOption {
  value: FieldType;
  label: string;
  icon: string;
  description: string;
}
