import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Eye,
  FileText,
  Shield,
  Wrench,
  Leaf,
  Clock,
  User,
  MapPin,
  X,
  Search,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Camera
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InspectionTemplate } from '../types/inspection';
import { TemplateStackParamList } from '../types/navigation';
import { TemplatesService } from '../services/templatesService';
import { assignmentService } from '../services/assignmentService';
import { InspectionsService } from '../services/inspectionsService';
import { CrossPlatformAlert } from '../utils/CrossPlatformAlert';
import TemplatePreview from '../components/checklists/TemplatePreview';
import ChecklistBuilder from '../components/checklists/ChecklistBuilder';
import { useUser } from '../contexts/UserContext';
import roleService from '../services/roleService';
import { UserProfile } from '../types/auth';

type NavigationProp = StackNavigationProp<TemplateStackParamList>;

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'safety': return <Shield size={20} />;
    case 'maintenance': return <Wrench size={20} />;
    case 'environmental': return <Leaf size={20} />;
    default: return <FileText size={20} />;
  }
};

const getCategoryColor = (category: string, theme: any) => {
  switch (category.toLowerCase()) {
    case 'safety': return theme.colors.error;
    case 'maintenance': return theme.colors.warning;
    case 'environmental': return theme.colors.success;
    default: return theme.colors.primary;
  }
};

export default function TemplatesScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useUser();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [previewTemplate, setPreviewTemplate] = useState<InspectionTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showChecklistBuilder, setShowChecklistBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [availableInspectors, setAvailableInspectors] = useState<UserProfile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<InspectionTemplate | null>(null);
  const [editingTemplateCopy, setEditingTemplateCopy] = useState<InspectionTemplate | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showComponentPreview, setShowComponentPreview] = useState(false);
  const [previewingComponent, setPreviewingComponent] = useState<any>(null);
  const [showFieldCustomizer, setShowFieldCustomizer] = useState(false);
  const [customizingField, setCustomizingField] = useState<any>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>(['']);

  useEffect(() => {
    loadTemplates();
    // Check if we should open the checklist builder immediately
    const params = route.params as any;
    if (params?.createFromScratch && roleService.hasPermission(user, 'canCreateTemplates')) {
      setShowChecklistBuilder(true);
    }
  }, [route.params, user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Templates screen focused, refreshing data...');
      loadTemplates();
    }, [])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing templates data...');
      loadTemplates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 TemplatesScreen - Loading templates...');
      
      // Run cleanup to remove any corrupted templates
      console.log('🧹 TemplatesScreen - Running template cleanup...');
      await TemplatesService.cleanupCorruptedTemplates();
      console.log('✅ TemplatesScreen - Template cleanup completed');
      
      const loadedTemplates = await TemplatesService.getAllTemplates();
      console.log('📋 TemplatesScreen - Loaded templates:', {
        count: loadedTemplates.length,
        templates: loadedTemplates.map(t => ({ id: t.id, title: t.title, isPrebuilt: t.isPrebuilt }))
      });
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('❌ TemplatesScreen - Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    if (!roleService.hasPermission(user, 'canCreateTemplates')) {
      Alert.alert('Access Denied', 'You do not have permission to create templates.');
      return;
    }
    setShowChecklistBuilder(true);
  };

  const handleSaveTemplate = async (template: InspectionTemplate) => {
    const isEditing = !!editingTemplate;
    console.log(`🔄 TemplatesScreen: ${isEditing ? 'Updating' : 'Creating'} template:`, template);
    try {
      console.log('💾 Calling TemplatesService.saveTemplate...');
      await TemplatesService.saveTemplate(template);
      console.log(`✅ Template ${isEditing ? 'updated' : 'created'} successfully`);
      
      await loadTemplates();
      console.log('✅ Templates reloaded, closing modal and showing success alert');
      setShowChecklistBuilder(false);
      setEditingTemplate(null);
      Alert.alert('Success', `Template ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`❌ Error ${isEditing ? 'updating' : 'saving'} template:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'save'} template. Please try again.`);
    }
  };

  const handleSaveDraft = async (draftTemplate: Partial<InspectionTemplate>) => {
    try {
      console.log('💾 Saving template as draft...');
      await TemplatesService.saveDraft(draftTemplate);
      console.log('✅ Template saved as draft successfully');
      
      await loadTemplates(); // Refresh the templates list
    } catch (error) {
      console.error('❌ Error saving template draft:', error);
      Alert.alert('Error', 'Failed to save template as draft. Please try again.');
    }
  };

  const handleSaveTemplateDraft = async (template: InspectionTemplate) => {
    try {
      console.log('💾 Creating draft copy of template:', template.title);
      
      // Create a draft copy of the template with modified properties
      const draftTemplate: Partial<InspectionTemplate> = {
        ...template,
        id: undefined, // Let the service generate a new ID
        title: `${template.title} (Draft Copy)`,
        status: 'draft',
        isActive: false,
        isPrebuilt: false,
        createdBy: user?.id || 'unknown',
        createdByName: user?.full_name || user?.email || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await TemplatesService.saveDraft(draftTemplate);
      console.log('✅ Template draft copy saved successfully');
      
      await loadTemplates(); // Refresh the templates list
      Alert.alert('Success', 'Template saved as draft successfully! You can now edit and assign it later.');
    } catch (error) {
      console.error('❌ Error saving template as draft:', error);
      Alert.alert('Error', 'Failed to save template as draft. Please try again.');
    }
  };

  // COMMENTED OUT - Modify draft functionality disabled
  // const handleModifyDraft = (template: InspectionTemplate) => {
  //   try {
  //     console.log('� Opening draft template for modification:', template.title);
  //     
  //     // Navigate to the TemplateBuilder with the draft template
  //     navigation.navigate('TemplateBuilder', {
  //       template: template
  //     });
  //   } catch (error) {
  //     console.error('❌ Error opening draft for modification:', error);
  //     Alert.alert('Error', 'Failed to open template for editing. Please try again.');
  //   }
  // };

  const handleAssignToInspector = async (template: InspectionTemplate) => {
    try {
      console.log('👤 TemplatesScreen - handleAssignToInspector clicked for template:', template.title);
      console.log('👤 TemplatesScreen - Template ID:', template.id);
      console.log('👤 TemplatesScreen - User role:', user?.role);
      
      // Set the selected template and load available inspectors
      setSelectedTemplate(template);
      setLoadingInspectors(true);
      setShowInspectorModal(true);
      
      // Fetch available inspectors
      const inspectors = await assignmentService.getAvailableInspectors();
      setAvailableInspectors(inspectors);
      setLoadingInspectors(false);
      
    } catch (error) {
      console.error('❌ Error loading inspectors:', error);
      setLoadingInspectors(false);
      Alert.alert('Error', 'Failed to load available inspectors. Please try again.');
    }
  };

  const handleSelectInspector = async (inspector: UserProfile) => {
    if (!selectedTemplate || !user) {
      Alert.alert('Error', 'Missing template or user information');
      return;
    }

    try {
      console.log('👤 TemplatesScreen - Creating assignment for inspector:', inspector.full_name);
      
      // First, create an inspection from the template
      const inspection = await InspectionsService.createInspectionFromTemplate(
        selectedTemplate.id,
        inspector.id,
        user.id,
        `${selectedTemplate.title} - ${inspector.full_name}`,
        'To be determined',
        undefined // due date will be set in assignment
      );

      // Then create the assignment
      const assignment = await assignmentService.createAssignment(
        {
          inspection_id: inspection.id,
          assigned_to: inspector.id,
          priority: 'medium',
          notes: `Assignment created from template: ${selectedTemplate.title}`
        },
        user.id
      );

      console.log('✅ Successfully created assignment:', assignment);
      
      setShowInspectorModal(false);
      Alert.alert(
        'Assignment Created', 
        `Successfully assigned "${selectedTemplate.title}" to ${inspector.full_name}`
      );
      
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      Alert.alert('Error', 'Failed to create assignment. Please try again.');
    }
  };

  const handleCloseInspectorModal = () => {
    setShowInspectorModal(false);
    setSelectedTemplate(null);
    setAvailableInspectors([]);
  };

  // Template editing functions
  const editTemplate = (template: InspectionTemplate) => {
    setTemplateToEdit(template);
    setEditingTemplateCopy({...template});
    setShowEditModal(true);
  };

  // Enhanced template editing functions
  const previewComponent = (componentType: string) => {
    const prebuiltComponents = {
      basic_info: {
        id: `section_preview`,
        title: 'Basic Information',
        description: 'Essential inspection details',
        fields: [
          { id: 'title', label: 'Inspection Title', type: 'text' as const, required: true },
          { id: 'location', label: 'Location/Area', type: 'text' as const, required: true },
          { id: 'inspector', label: 'Inspector Name', type: 'text' as const, required: true },
          { id: 'date', label: 'Inspection Date', type: 'date' as const, required: true },
          { id: 'time', label: 'Inspection Time', type: 'time' as const, required: true }
        ]
      },
      safety_checklist: {
        id: `section_preview`,
        title: 'Safety Checklist',
        description: 'Safety protocols and compliance checks',
        fields: [
          { id: 'ppe_check', label: 'PPE Equipment Check', type: 'boolean' as const, required: true },
          { id: 'hazard_id', label: 'Hazard Identification', type: 'textarea' as const, required: false },
          { id: 'safety_protocols', label: 'Safety Protocols Followed', type: 'boolean' as const, required: true },
          { id: 'safety_photo', label: 'Safety Documentation Photo', type: 'image' as const, required: false }
        ]
      },
      equipment_inspection: {
        id: `section_preview`,
        title: 'Equipment Inspection',
        description: 'Equipment condition and maintenance checks',
        fields: [
          { id: 'equipment_condition', label: 'Overall Equipment Condition', type: 'select' as const, options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
          { id: 'maintenance_status', label: 'Maintenance Status', type: 'select' as const, options: ['Up to Date', 'Due Soon', 'Overdue'], required: true },
          { id: 'equipment_photo', label: 'Equipment Photos', type: 'image' as const, required: false },
          { id: 'maintenance_notes', label: 'Maintenance Notes', type: 'textarea' as const, required: false }
        ]
      },
      environmental_checklist: {
        id: `section_preview`,
        title: 'Environmental Checklist',
        description: 'Environmental compliance and monitoring',
        fields: [
          { id: 'waste_management', label: 'Waste Management Compliance', type: 'boolean' as const, required: true },
          { id: 'air_quality', label: 'Air Quality Assessment', type: 'select' as const, options: ['Good', 'Moderate', 'Poor'], required: false },
          { id: 'environmental_photo', label: 'Environmental Documentation', type: 'image' as const, required: false },
          { id: 'compliance_notes', label: 'Compliance Notes', type: 'textarea' as const, required: false }
        ]
      }
    };

    const component = prebuiltComponents[componentType as keyof typeof prebuiltComponents];
    if (component) {
      setPreviewingComponent({ ...component, componentType });
      setShowComponentPreview(true);
    }
  };

  const customizeField = (fieldType: string) => {
    const fieldTypes = {
      text: { label: 'Text Field', type: 'text' as const, required: false },
      number: { label: 'Number Field', type: 'number' as const, required: false },
      date: { label: 'Date Field', type: 'date' as const, required: false },
      time: { label: 'Time Field', type: 'time' as const, required: false },
      boolean: { label: 'Yes/No Field', type: 'boolean' as const, required: false },
      select: { label: 'Multiple Choice', type: 'select' as const, options: ['Option 1', 'Option 2', 'Option 3'], required: false },
      photo: { label: 'Photo Field', type: 'image' as const, required: false }
    };

    const field = fieldTypes[fieldType as keyof typeof fieldTypes];
    if (field) {
      setCustomizingField({ ...field, fieldType });
      setFieldLabel(field.label);
      setFieldRequired(field.required);
      setFieldOptions(field.type === 'select' ? (field.options || ['Option 1', 'Option 2']) : ['']);
      setShowFieldCustomizer(true);
    }
  };

  const addCustomizedField = () => {
    if (!editingTemplateCopy || !customizingField) return;

    const newField = {
      id: `field_${Date.now()}`,
      label: fieldLabel || customizingField.label,
      type: customizingField.type,
      required: fieldRequired,
      ...(customizingField.type === 'select' && { options: fieldOptions.filter(opt => opt.trim()) })
    };

    // Check if there's a "Custom Fields" section, if not create one
    let customSection = editingTemplateCopy.sections?.find(section => section.title === 'Custom Fields');
    
    if (!customSection) {
      customSection = {
        id: `section_custom_${Date.now()}`,
        title: 'Custom Fields',
        description: 'Additional custom inspection fields',
        fields: []
      };
    }

    const updatedCustomSection = {
      ...customSection,
      fields: [...(customSection.fields || []), newField]
    };

    let updatedSections;
    if (editingTemplateCopy.sections?.find(section => section.title === 'Custom Fields')) {
      updatedSections = editingTemplateCopy.sections.map(section => 
        section.title === 'Custom Fields' ? updatedCustomSection : section
      );
    } else {
      updatedSections = [...(editingTemplateCopy.sections || []), updatedCustomSection];
    }

    const updatedTemplate = {
      ...editingTemplateCopy,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setEditingTemplateCopy(updatedTemplate);
    setHasUnsavedChanges(true);
    setShowFieldCustomizer(false);
    setCustomizingField(null);
    setFieldLabel('');
    setFieldRequired(false);
    setFieldOptions(['']);
    CrossPlatformAlert.alert('Success', `${fieldLabel || customizingField.label} added successfully!`);
  };

  const deleteSection = (sectionId: string | number) => {
    if (!editingTemplateCopy) return;

    CrossPlatformAlert.destructiveConfirm(
      'Delete Section',
      'Are you sure you want to delete this section? This action cannot be undone.',
      () => {
        const updatedSections = editingTemplateCopy.sections?.filter(section => section.id !== sectionId);
        const updatedTemplate = {
          ...editingTemplateCopy,
          sections: updatedSections || [],
          updatedAt: new Date().toISOString()
        };
        setEditingTemplateCopy(updatedTemplate);
        setHasUnsavedChanges(true);
        CrossPlatformAlert.alert('Success', 'Section deleted successfully!');
      }
    );
  };

  const deleteField = (sectionId: string | number, fieldId: string) => {
    if (!editingTemplateCopy) return;

    CrossPlatformAlert.destructiveConfirm(
      'Delete Field',
      'Are you sure you want to delete this field?',
      () => {
        const updatedSections = editingTemplateCopy.sections?.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              fields: section.fields.filter(field => field.id !== fieldId)
            };
          }
          return section;
        });

        const updatedTemplate = {
          ...editingTemplateCopy,
          sections: updatedSections || [],
          updatedAt: new Date().toISOString()
        };
        setEditingTemplateCopy(updatedTemplate);
        setHasUnsavedChanges(true);
        CrossPlatformAlert.alert('Success', 'Field deleted successfully!');
      }
    );
  };

  const addPrebuiltComponent = (componentType: string) => {
    if (!editingTemplateCopy) return;

    const prebuiltComponents = {
      basic_info: {
        id: `section_${Date.now()}`,
        title: 'Basic Information',
        description: 'Essential inspection details',
        fields: [
          { id: 'title', label: 'Inspection Title', type: 'text' as const, required: true },
          { id: 'location', label: 'Location/Area', type: 'text' as const, required: true },
          { id: 'inspector', label: 'Inspector Name', type: 'text' as const, required: true },
          { id: 'date', label: 'Inspection Date', type: 'date' as const, required: true },
          { id: 'time', label: 'Inspection Time', type: 'time' as const, required: true }
        ]
      },
      safety_checklist: {
        id: `section_${Date.now()}`,
        title: 'Safety Checklist',
        description: 'Safety protocols and compliance checks',
        fields: [
          { id: 'ppe_check', label: 'PPE Equipment Check', type: 'boolean' as const, required: true },
          { id: 'hazard_id', label: 'Hazard Identification', type: 'textarea' as const, required: false },
          { id: 'safety_protocols', label: 'Safety Protocols Followed', type: 'boolean' as const, required: true },
          { id: 'safety_photo', label: 'Safety Documentation Photo', type: 'image' as const, required: false }
        ]
      },
      equipment_inspection: {
        id: `section_${Date.now()}`,
        title: 'Equipment Inspection',
        description: 'Equipment condition and maintenance checks',
        fields: [
          { id: 'equipment_condition', label: 'Overall Equipment Condition', type: 'select' as const, options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
          { id: 'maintenance_status', label: 'Maintenance Status', type: 'select' as const, options: ['Up to Date', 'Due Soon', 'Overdue'], required: true },
          { id: 'equipment_photo', label: 'Equipment Photos', type: 'image' as const, required: false },
          { id: 'maintenance_notes', label: 'Maintenance Notes', type: 'textarea' as const, required: false }
        ]
      },
      environmental_checklist: {
        id: `section_${Date.now()}`,
        title: 'Environmental Checklist',
        description: 'Environmental compliance and monitoring',
        fields: [
          { id: 'waste_management', label: 'Waste Management Compliance', type: 'boolean' as const, required: true },
          { id: 'air_quality', label: 'Air Quality Assessment', type: 'select' as const, options: ['Good', 'Moderate', 'Poor'], required: false },
          { id: 'environmental_photo', label: 'Environmental Documentation', type: 'image' as const, required: false },
          { id: 'compliance_notes', label: 'Compliance Notes', type: 'textarea' as const, required: false }
        ]
      }
    };

    const componentToAdd = prebuiltComponents[componentType as keyof typeof prebuiltComponents];
    if (componentToAdd) {
      const updatedTemplate = {
        ...editingTemplateCopy,
        sections: [...(editingTemplateCopy.sections || []), componentToAdd],
        updatedAt: new Date().toISOString()
      };
      setEditingTemplateCopy(updatedTemplate);
      setHasUnsavedChanges(true);
      CrossPlatformAlert.alert('Success', `${componentToAdd.title} component added successfully!`);
    }
  };

  const addIndividualField = (fieldType: string) => {
    if (!editingTemplateCopy) return;

    const fieldTypes = {
      text: { label: 'Text Field', type: 'text' as const, required: false },
      number: { label: 'Number Field', type: 'number' as const, required: false },
      date: { label: 'Date Field', type: 'date' as const, required: false },
      time: { label: 'Time Field', type: 'time' as const, required: false },
      boolean: { label: 'Yes/No Field', type: 'boolean' as const, required: false },
      select: { label: 'Multiple Choice', type: 'select' as const, options: ['Option 1', 'Option 2', 'Option 3'], required: false },
      photo: { label: 'Photo Field', type: 'image' as const, required: false }
    };

    const fieldToAdd = fieldTypes[fieldType as keyof typeof fieldTypes];
    if (fieldToAdd) {
      // Check if there's a "Custom Fields" section, if not create one
      let customSection = editingTemplateCopy.sections?.find(section => section.title === 'Custom Fields');
      
      if (!customSection) {
        customSection = {
          id: `section_custom_${Date.now()}`,
          title: 'Custom Fields',
          description: 'Additional custom inspection fields',
          fields: []
        };
      }

      const newField = {
        id: `field_${Date.now()}`,
        ...fieldToAdd
      };

      // Update the custom section with the new field
      const updatedCustomSection = {
        ...customSection,
        fields: [...(customSection.fields || []), newField]
      };

      // Update the template
      let updatedSections;
      if (editingTemplateCopy.sections?.find(section => section.title === 'Custom Fields')) {
        // Replace existing custom section
        updatedSections = editingTemplateCopy.sections.map(section => 
          section.title === 'Custom Fields' ? updatedCustomSection : section
        );
      } else {
        // Add new custom section
        updatedSections = [...(editingTemplateCopy.sections || []), updatedCustomSection];
      }

      const updatedTemplate = {
        ...editingTemplateCopy,
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      };

      setEditingTemplateCopy(updatedTemplate);
      setHasUnsavedChanges(true);
      CrossPlatformAlert.alert('Success', `${fieldToAdd.label} added successfully!`);
    }
  };

  const saveTemplateChanges = async () => {
    if (!editingTemplateCopy || !hasUnsavedChanges) return;

    try {
      setLoading(true);
      await TemplatesService.saveTemplate(editingTemplateCopy);
      await loadTemplates();
      setShowEditModal(false);
      setTemplateToEdit(null);
      setEditingTemplateCopy(null);
      setHasUnsavedChanges(false);
      CrossPlatformAlert.alert('Success', 'Template updated successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      CrossPlatformAlert.alert('Error', 'Failed to save template changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelTemplateEdit = () => {
    if (hasUnsavedChanges) {
      CrossPlatformAlert.destructiveConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        () => {
          setShowEditModal(false);
          setTemplateToEdit(null);
          setEditingTemplateCopy(null);
          setHasUnsavedChanges(false);
        }
      );
    } else {
      setShowEditModal(false);
      setTemplateToEdit(null);
      setEditingTemplateCopy(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleEditTemplate = (template: InspectionTemplate) => {
    if (template.isPrebuilt) {
      Alert.alert('Cannot Edit', 'Prebuilt templates cannot be edited. You can create a copy of this template instead.');
      return;
    }
    
    if (!roleService.hasPermission(user, 'canEditTemplates')) {
      Alert.alert('Access Denied', 'You do not have permission to edit templates.');
      return;
    }
    
    // Set the template to edit and create a working copy
    setTemplateToEdit(template);
    setEditingTemplateCopy({ ...template }); // Create a deep copy
    setHasUnsavedChanges(false);
    setShowEditModal(true);
  };

  const handleDeleteTemplate = async (template: InspectionTemplate) => {
    console.log('🗑️ TemplatesScreen - Delete button clicked for template:', template.title);
    console.log('🗑️ TemplatesScreen - Template ID:', template.id);
    console.log('🗑️ TemplatesScreen - Is prebuilt:', template.isPrebuilt);
    
    if (template.isPrebuilt) {
      console.log('🗑️ TemplatesScreen - Showing prebuilt template alert');
      CrossPlatformAlert.alert('Cannot Delete', 'Prebuilt templates cannot be deleted.');
      return;
    }

    console.log('🗑️ TemplatesScreen - Showing delete confirmation alert');
    
    CrossPlatformAlert.destructiveConfirm(
      'Delete Template',
      `Are you sure you want to delete "${template.title}"? This action cannot be undone.`,
      async () => {
        try {
          console.log('🗑️ TemplatesScreen - User confirmed delete, calling service...');
          await TemplatesService.deleteTemplate(template.id);
          console.log('🗑️ TemplatesScreen - Template deleted, reloading templates...');
          await loadTemplates();
          console.log('🗑️ TemplatesScreen - Templates reloaded, showing success alert');
          CrossPlatformAlert.alert('Success', 'Template deleted successfully.');
        } catch (error) {
          console.error('🗑️ TemplatesScreen - Error deleting template:', error);
          CrossPlatformAlert.alert('Error', 'Failed to delete template. Please try again.');
        }
      },
      () => {
        console.log('🗑️ TemplatesScreen - Delete cancelled');
      }
    );
  };

  const handlePreviewTemplate = (template: InspectionTemplate) => {
    console.log('👁️ TemplatesScreen - Preview clicked for template:', template.title);
    setPreviewTemplate(template);
    setShowPreview(true);
  };


  const handleUseTemplate = (template: InspectionTemplate) => {
    console.log('🚀 TemplatesScreen - handleUseTemplate clicked for template:', template.title);
    console.log('🚀 TemplatesScreen - Template ID:', template.id);
    console.log('🚀 TemplatesScreen - Template status:', template.status);
    console.log('🚀 TemplatesScreen - User role:', user?.role);
    
    setShowPreview(false);
    
    // Check user role to determine action
    if (user?.role === 'admin' || user?.role === 'manager') {
      console.log('🚀 TemplatesScreen - Admin/Manager detected, showing inspector selection modal');
      // Show inspector selection for assignment
      handleAssignToInspector(template);
    } else {
      console.log('🚀 TemplatesScreen - Inspector detected, navigating to form');
      // Inspectors can fill the inspection forms
      navigation.navigate('InspectionForm', { template });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    // Improved status filtering
    let matchesStatus = false;
    if (selectedStatus === 'all') {
      matchesStatus = true;
    } else if (selectedStatus === 'active') {
      matchesStatus = template.status !== 'draft' && template.isActive !== false;
    } else if (selectedStatus === 'draft') {
      matchesStatus = template.status === 'draft' || template.isActive === false;
    } else {
      matchesStatus = template.status === selectedStatus;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <ScreenContainer>
        <ScrollView>
      <YStack gap="$4" paddingBottom="$8">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <YStack>
              <Text style={{ 
                fontSize: isTablet ? 28 : 24, 
                fontWeight: 'bold', 
                color: theme.colors.text 
              }}>
                Inspection Templates
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.textSecondary 
              }}>
                {filteredTemplates.length} templates available
              </Text>
            </YStack>
          </XStack>
          
          {roleService.hasPermission(user, 'canCreateTemplates') && (
            <Button
              backgroundColor={theme.colors.primary}
              color="white"
              icon={<Plus size={20} color="white" />}
              onPress={handleCreateTemplate}
              size={isTablet ? "$4" : "$3"}
            >
              {isTablet ? 'Create Template' : 'Create'}
            </Button>
          )}
        </XStack>

        {/* Search Input */}
        <XStack alignItems="center" gap="$2" backgroundColor={theme.colors.surface} borderRadius={12} padding="$3" borderWidth={1} borderColor={theme.colors.border}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Search templates..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 16,
              color: theme.colors.text,
              padding: 0
            }}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </XStack>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingHorizontal="$1">
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={{
                  backgroundColor: selectedCategory === category 
                    ? theme.colors.primary 
                    : theme.colors.surface,
                  borderColor: selectedCategory === category 
                    ? theme.colors.primary 
                    : theme.colors.border,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {category !== 'all' && getCategoryIcon(category)}
                  <Text style={{
                    color: selectedCategory === category 
                      ? 'white' 
                      : theme.colors.text,
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {category}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingHorizontal="$1">
            {['all', 'active', 'draft'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={{
                  backgroundColor: selectedStatus === status 
                    ? theme.colors.info 
                    : theme.colors.surface,
                  borderColor: selectedStatus === status 
                    ? theme.colors.info 
                    : theme.colors.border,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20
                }}>
                  <Text style={{
                    color: selectedStatus === status 
                      ? 'white' 
                      : theme.colors.text,
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>

        {/* Templates List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$3">
            {loading ? (
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                  Loading templates...
                </Text>
              </Card>
            ) : filteredTemplates.length === 0 ? (
              <Card backgroundColor={theme.colors.surface} padding="$6">
                <YStack alignItems="center" gap="$3">
                  <FileText size={48} color={theme.colors.textSecondary} />
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    color: theme.colors.text,
                    textAlign: 'center'
                  }}>
                    No Templates Found
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20
                  }}>
                    {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'active'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by creating your first inspection template'
                    }
                  </Text>
                  {roleService.hasPermission(user, 'canCreateTemplates') && (
                    <Button
                      backgroundColor={theme.colors.primary}
                      color="white"
                      icon={<Plus size={20} color="white" />}
                      onPress={handleCreateTemplate}
                      marginTop="$2"
                    >
                      Create Template
                    </Button>
                  )}
                </YStack>
              </Card>
            ) : (
              filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  padding={isTablet ? "$6" : "$4"}
                  maxWidth={isDesktop ? 800 : undefined}
                  alignSelf={isDesktop ? "center" : undefined}
                  width="100%"
                >
                  <YStack gap="$4">
                    <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
                      <XStack alignItems="center" gap="$3" flex={1}>
                        <View style={{
                          backgroundColor: getCategoryColor(template.category, theme) + '20',
                          padding: isTablet ? 12 : 10,
                          borderRadius: 8
                        }}>
                          {getCategoryIcon(template.category)}
                        </View>
                        
                        <YStack flex={1} gap="$1">
                          <Text style={{ 
                            fontSize: isTablet ? 20 : 18, 
                            fontWeight: 'bold', 
                            color: theme.colors.text 
                          }}>
                            {template.title}
                          </Text>
                          <Text style={{ 
                            fontSize: 14, 
                            color: theme.colors.textSecondary 
                          }}>
                            {template.category} • {template.sections.length} sections
                          </Text>
                          {template.isPrebuilt && (
                            <View style={{
                              backgroundColor: theme.colors.info + '20',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              alignSelf: 'flex-start'
                            }}>
                              <Text style={{
                                fontSize: 11,
                                color: theme.colors.info,
                                fontWeight: '500'
                              }}>
                                PREBUILT
                              </Text>
                            </View>
                          )}
                          {template.status === 'draft' && (
                            <View style={{
                              backgroundColor: theme.colors.warning + '20',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              alignSelf: 'flex-start'
                            }}>
                              <Text style={{
                                fontSize: 11,
                                color: theme.colors.warning,
                                fontWeight: '500'
                              }}>
                                DRAFT
                              </Text>
                            </View>
                          )}
                        </YStack>
                      </XStack>
                      
                      <XStack gap="$2">
                        <TouchableOpacity onPress={() => handlePreviewTemplate(template)}>
                          <View style={{
                            backgroundColor: theme.colors.backgroundSecondary,
                            padding: 8,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                          }}>
                            <Eye size={18} color={theme.colors.text} />
                          </View>
                        </TouchableOpacity>
                        
                        {!template.isPrebuilt && (
                          <>
                            <TouchableOpacity onPress={() => handleEditTemplate(template)}>
                              <View style={{
                                backgroundColor: theme.colors.backgroundSecondary,
                                padding: 8,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                              }}>
                                <Edit3 size={18} color={theme.colors.text} />
                              </View>
                            </TouchableOpacity>
                            
                            <TouchableOpacity onPress={() => {
                              console.log('🗑️ TemplatesScreen - Trash button TouchableOpacity clicked for:', template.title);
                              handleDeleteTemplate(template);
                            }}>
                              <View style={{
                                backgroundColor: theme.colors.error + '20',
                                padding: 8,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: theme.colors.error
                              }}>
                                <Trash2 size={18} color={theme.colors.error} />
                              </View>
                            </TouchableOpacity>
                          </>
                        )}
                      </XStack>
                    </XStack>

                    <Text style={{ 
                      fontSize: 14, 
                      color: theme.colors.text,
                      lineHeight: 20
                    }}>
                      {template.description}
                    </Text>

                    {template.tags.length > 0 && (
                      <XStack gap="$2" flexWrap="wrap">
                        {template.tags.map((tag, index) => (
                          <View
                            key={index}
                            style={{
                              backgroundColor: theme.colors.primary + '20',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12
                            }}
                          >
                            <Text style={{
                              fontSize: 12,
                              color: theme.colors.primary,
                              fontWeight: '500'
                            }}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </XStack>
                    )}

                    <XStack gap="$3" alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$4">
                        <XStack alignItems="center" gap="$1">
                          <Clock size={14} color={theme.colors.textSecondary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <User size={14} color={theme.colors.textSecondary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            {template.createdByName || template.createdBy}
                          </Text>
                        </XStack>
                      </XStack>
                      
                      <XStack gap="$2">
                        {(() => {
                          console.log(`🔍 TemplatesScreen - Rendering buttons for template "${template.title}":`, {
                            status: template.status,
                            isDraft: template.status === 'draft',
                            userRole: user?.role,
                            isAdminOrManager: user?.role === 'admin' || user?.role === 'manager'
                          });
                          return null;
                        })()}
                        {template.status === 'draft' ? (
                          <>
                            {/* COMMENTED OUT - Modify draft button disabled */}
                            {/* <Button
                              backgroundColor={theme.colors.info}
                              color="white"
                              size="$3"
                              onPress={() => handleModifyDraft(template)}
                            >
                              Modify Draft
                            </Button> */}
                            <Button
                              backgroundColor={theme.colors.primary}
                              color="white"
                              size="$3"
                              onPress={() => handleAssignToInspector(template)}
                            >
                              Assign to Inspector
                            </Button>
                          </>
                        ) : (
                          <Button
                            backgroundColor={theme.colors.primary}
                            color="white"
                            size="$3"
                            onPress={() => handleUseTemplate(template)}
                          >
                            {user?.role === 'admin' || user?.role === 'manager' ? 'Assign to Inspector' : 'Start Inspection'}
                          </Button>
                        )}
                        
                        {(user?.role === 'admin' || user?.role === 'manager') && template.status !== 'draft' && (
                          <Button
                            backgroundColor={theme.colors.surface}
                            borderColor={theme.colors.border}
                            borderWidth={1}
                            color={theme.colors.text}
                            size="$3"
                            onPress={() => handleSaveTemplateDraft(template)}
                            icon={<FileText size={16} />}
                          >
                            Save as Draft
                          </Button>
                        )}
                      </XStack>
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>

      <TemplatePreview
        template={previewTemplate}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onUseTemplate={handleUseTemplate}
      />

      <ChecklistBuilder
        visible={showChecklistBuilder}
        onClose={() => {
          setShowChecklistBuilder(false);
          setEditingTemplate(null);
        }}
        onSaveTemplate={handleSaveTemplate}
        onSaveDraft={handleSaveDraft}
        editingTemplate={editingTemplate}
      />

      {/* Template Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelTemplateEdit}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <Card 
            backgroundColor={theme.colors.surface}
            padding="$4"
            width="100%"
            maxWidth={isTablet ? 600 : undefined}
            maxHeight="90%"
            borderRadius={12}
          >
            <YStack gap="$4">
              {/* Header */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  color: theme.colors.text 
                }}>
                  Edit Template
                </Text>
                <TouchableOpacity onPress={cancelTemplateEdit}>
                  <X size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </XStack>

              {/* Template Info */}
              {templateToEdit && editingTemplateCopy && (
                <Card backgroundColor={theme.colors.primaryLight + '20'} padding="$3">
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: theme.colors.text 
                      }}>
                        {editingTemplateCopy.title}
                      </Text>
                      {hasUnsavedChanges && (
                        <View style={{
                          backgroundColor: theme.colors.warning + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8
                        }}>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.warning,
                            fontWeight: '500'
                          }}>
                            Unsaved
                          </Text>
                        </View>
                      )}
                    </XStack>
                    <Text style={{ 
                      fontSize: 14, 
                      color: theme.colors.textSecondary 
                    }}>
                      {editingTemplateCopy.description}
                    </Text>
                    <XStack gap="$2">
                      <View style={{
                        backgroundColor: getCategoryColor(editingTemplateCopy.category, theme) + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {getCategoryIcon(editingTemplateCopy.category)}
                        <Text style={{ 
                          color: getCategoryColor(editingTemplateCopy.category, theme), 
                          fontSize: 12, 
                          fontWeight: '500' 
                        }}>
                          {editingTemplateCopy.category}
                        </Text>
                      </View>
                      <Text style={{ 
                        fontSize: 12, 
                        color: theme.colors.textSecondary 
                      }}>
                        {editingTemplateCopy.sections?.length || 0} sections
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              )}

              {/* Edit Options */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <YStack gap="$3">
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors.text 
                  }}>
                    Available Components
                  </Text>

                  {/* Prebuilt Components */}
                  <Card backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                    <YStack gap="$3">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.primary + '20',
                          padding: 8,
                          borderRadius: 8
                        }}>
                          <FileText size={20} color={theme.colors.primary} />
                        </View>
                        <YStack flex={1}>
                          <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '500', 
                            color: theme.colors.text 
                          }}>
                            Basic Information
                          </Text>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            Add title, location, inspector, date & time fields
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$2">
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => previewComponent('basic_info')}
                        >
                          <Card backgroundColor={theme.colors.info + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Eye size={16} color={theme.colors.info} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.info,
                                fontWeight: '500'
                              }}>
                                Preview
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => addPrebuiltComponent('basic_info')}
                        >
                          <Card backgroundColor={theme.colors.primary + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Plus size={16} color={theme.colors.primary} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                Add
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                      </XStack>
                    </YStack>
                  </Card>

                  <Card backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                    <YStack gap="$3">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.error + '20',
                          padding: 8,
                          borderRadius: 8
                        }}>
                          <Shield size={20} color={theme.colors.error} />
                        </View>
                        <YStack flex={1}>
                          <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '500', 
                            color: theme.colors.text 
                          }}>
                            Safety Checklist
                          </Text>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            PPE, hazard identification, safety protocols
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$2">
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => previewComponent('safety_checklist')}
                        >
                          <Card backgroundColor={theme.colors.info + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Eye size={16} color={theme.colors.info} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.info,
                                fontWeight: '500'
                              }}>
                                Preview
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => addPrebuiltComponent('safety_checklist')}
                        >
                          <Card backgroundColor={theme.colors.primary + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Plus size={16} color={theme.colors.primary} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                Add
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                      </XStack>
                    </YStack>
                  </Card>

                  <Card backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                    <YStack gap="$3">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.warning + '20',
                          padding: 8,
                          borderRadius: 8
                        }}>
                          <Wrench size={20} color={theme.colors.warning} />
                        </View>
                        <YStack flex={1}>
                          <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '500', 
                            color: theme.colors.text 
                          }}>
                            Equipment Inspection
                          </Text>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            Condition checks, maintenance status, photos
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$2">
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => previewComponent('equipment_inspection')}
                        >
                          <Card backgroundColor={theme.colors.info + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Eye size={16} color={theme.colors.info} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.info,
                                fontWeight: '500'
                              }}>
                                Preview
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => addPrebuiltComponent('equipment_inspection')}
                        >
                          <Card backgroundColor={theme.colors.primary + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Plus size={16} color={theme.colors.primary} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                Add
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                      </XStack>
                    </YStack>
                  </Card>

                  <Card backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                    <YStack gap="$3">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.success + '20',
                          padding: 8,
                          borderRadius: 8
                        }}>
                          <Leaf size={20} color={theme.colors.success} />
                        </View>
                        <YStack flex={1}>
                          <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '500', 
                            color: theme.colors.text 
                          }}>
                            Environmental Checklist
                          </Text>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            Waste management, air quality, compliance
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$2">
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => previewComponent('environmental_checklist')}
                        >
                          <Card backgroundColor={theme.colors.info + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Eye size={16} color={theme.colors.info} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.info,
                                fontWeight: '500'
                              }}>
                                Preview
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1 }}
                          onPress={() => addPrebuiltComponent('environmental_checklist')}
                        >
                          <Card backgroundColor={theme.colors.primary + '20'} padding="$2">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Plus size={16} color={theme.colors.primary} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                Add
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                      </XStack>
                    </YStack>
                  </Card>

                  {/* Individual Field Types */}
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors.text,
                    marginTop: 16
                  }}>
                    Individual Fields
                  </Text>

                  <XStack gap="$2" flexWrap="wrap">
                    {[
                      { icon: Type, label: 'Text Field', color: theme.colors.primary, type: 'text' },
                      { icon: Hash, label: 'Number', color: theme.colors.info, type: 'number' },
                      { icon: Calendar, label: 'Date', color: theme.colors.success, type: 'date' },
                      { icon: Clock, label: 'Time', color: theme.colors.warning, type: 'time' },
                      { icon: ToggleLeft, label: 'Yes/No', color: theme.colors.error, type: 'boolean' },
                      { icon: List, label: 'Multiple Choice', color: theme.colors.primary, type: 'select' },
                      { icon: Camera, label: 'Photo', color: theme.colors.primary, type: 'photo' }
                    ].map((field, index) => (
                      <YStack key={index} style={{ flex: 1, minWidth: 120 }} gap="$1">
                        <TouchableOpacity
                          onPress={() => customizeField(field.type)}
                        >
                          <Card backgroundColor={field.color + '20'} padding="$2">
                            <YStack alignItems="center" gap="$1">
                              <field.icon size={20} color={field.color} />
                              <Text style={{ 
                                fontSize: 12, 
                                fontWeight: '500', 
                                color: field.color,
                                textAlign: 'center'
                              }}>
                                {field.label}
                              </Text>
                            </YStack>
                          </Card>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => addIndividualField(field.type)}
                        >
                          <Card backgroundColor={theme.colors.primary + '10'} padding="$1">
                            <XStack alignItems="center" justifyContent="center" gap="$1">
                              <Plus size={12} color={theme.colors.primary} />
                              <Text style={{ 
                                fontSize: 10, 
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                Quick Add
                              </Text>
                            </XStack>
                          </Card>
                        </TouchableOpacity>
                      </YStack>
                    ))}
                  </XStack>

                  {/* Current Template Content Preview */}
                  {editingTemplateCopy && editingTemplateCopy.sections && editingTemplateCopy.sections.length > 0 && (
                    <>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: theme.colors.text,
                        marginTop: 16
                      }}>
                        Current Template Content
                      </Text>
                      
                      {editingTemplateCopy.sections.map((section, index) => (
                        <Card key={section.id} backgroundColor={theme.colors.surface} padding="$3">
                          <YStack gap="$2">
                            <XStack alignItems="center" justifyContent="space-between">
                              <YStack flex={1}>
                                <Text style={{ 
                                  fontSize: 14, 
                                  fontWeight: '600', 
                                  color: theme.colors.text 
                                }}>
                                  {section.title}
                                </Text>
                                <Text style={{ 
                                  fontSize: 12, 
                                  color: theme.colors.textSecondary 
                                }}>
                                  {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                                </Text>
                              </YStack>
                              <TouchableOpacity onPress={() => deleteSection(section.id)}>
                                <View style={{
                                  backgroundColor: theme.colors.error + '20',
                                  padding: 8,
                                  borderRadius: 8
                                }}>
                                  <Trash2 size={16} color={theme.colors.error} />
                                </View>
                              </TouchableOpacity>
                            </XStack>
                            
                            {section.fields.map((field, fieldIndex) => (
                              <XStack key={field.id} alignItems="center" justifyContent="space-between" paddingLeft="$3" gap="$2">
                                <YStack flex={1}>
                                  <Text style={{ 
                                    fontSize: 12, 
                                    color: theme.colors.text 
                                  }}>
                                    {field.label}
                                  </Text>
                                  <Text style={{ 
                                    fontSize: 10, 
                                    color: theme.colors.textSecondary 
                                  }}>
                                    {field.type} • {field.required ? 'Required' : 'Optional'}
                                  </Text>
                                </YStack>

                                {/* Modify button */}
                                <TouchableOpacity onPress={() => {
                                  setCustomizingField(field);              // set the field to edit
                                  setFieldLabel(field.label);              // prefill label
                                  setFieldRequired(field.required);        // prefill required
                                  setFieldOptions(field.options || ['']);  // prefill options if select
                                  setShowFieldCustomizer(true);            // show modal
                                }}>
                                  <View style={{
                                    backgroundColor: theme.colors.warning + '20',
                                    padding: 4,
                                    borderRadius: 6
                                  }}>
                                    <Edit3 size={12} color={theme.colors.warning} />
                                  </View>
                                </TouchableOpacity>

                                {/* Delete button */}
                                <TouchableOpacity onPress={() => deleteField(section.id, field.id)}>
                                  <View style={{
                                    backgroundColor: theme.colors.error + '20',
                                    padding: 4,
                                    borderRadius: 6
                                  }}>
                                    <X size={12} color={theme.colors.error} />
                                  </View>
                                </TouchableOpacity>
                              </XStack>
                            ))}

                          </YStack>
                        </Card>
                      ))}
                    </>
                  )}
                </YStack>
              </ScrollView>

              {/* Action Buttons */}
              <XStack gap="$3" marginTop="$2">
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  borderWidth={1}
                  color={theme.colors.text}
                  onPress={cancelTemplateEdit}
                >
                  Cancel
                </Button>
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.primary}
                  color="white"
                  onPress={saveTemplateChanges}
                  disabled={!hasUnsavedChanges}
                  opacity={!hasUnsavedChanges ? 0.6 : 1}
                >
                  {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                </Button>
              </XStack>
            </YStack>
          </Card>
        </View>
      </Modal>

      {/* Inspector Selection Modal */}
      <Modal
        visible={showInspectorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseInspectorModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <Card style={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '80%',
            backgroundColor: theme.colors.surface,
            borderRadius: 12
          }}>
            <YStack gap="$4" padding="$4">
              {/* Header */}
              <XStack justifyContent="space-between" alignItems="center">
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: theme.colors.text
                }}>
                  Select Inspector
                </Text>
                <TouchableOpacity onPress={handleCloseInspectorModal}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </XStack>

              {/* Template info */}
              {selectedTemplate && (
                <View style={{
                  padding: 12,
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 4
                  }}>
                    Template: {selectedTemplate.title}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary
                  }}>
                    {selectedTemplate.description}
                  </Text>
                </View>
              )}

              {/* Inspectors List */}
              <ScrollView style={{ maxHeight: 300 }}>
                {loadingInspectors ? (
                  <View style={{
                    padding: 40,
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      color: theme.colors.textSecondary,
                      fontSize: 14
                    }}>
                      Loading inspectors...
                    </Text>
                  </View>
                ) : availableInspectors.length === 0 ? (
                  <View style={{
                    padding: 40,
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      color: theme.colors.textSecondary,
                      fontSize: 14,
                      textAlign: 'center'
                    }}>
                      No available inspectors found.
                    </Text>
                  </View>
                ) : (
                  <YStack gap="$2">
                    {availableInspectors.map((inspector) => (
                      <TouchableOpacity
                        key={inspector.id}
                        onPress={() => handleSelectInspector(inspector)}
                        style={{
                          padding: 16,
                          backgroundColor: theme.colors.background,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border
                        }}
                      >
                        <XStack alignItems="center" gap="$3">
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <User size={20} color="white" />
                          </View>
                          <YStack flex={1}>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: theme.colors.text
                            }}>
                              {inspector.full_name || inspector.email}
                            </Text>
                            <Text style={{
                              fontSize: 12,
                              color: theme.colors.textSecondary
                            }}>
                              {inspector.email}
                            </Text>
                          </YStack>
                        </XStack>
                      </TouchableOpacity>
                    ))}
                  </YStack>
                )}
              </ScrollView>
            </YStack>
          </Card>
        </View>
      </Modal>

      {/* Component Preview Modal */}
      <Modal
        visible={showComponentPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComponentPreview(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <Card 
            backgroundColor={theme.colors.surface}
            padding="$4"
            width="100%"
            maxWidth={isTablet ? 600 : undefined}
            maxHeight="80%"
            borderRadius={12}
          >
            <YStack gap="$4">
              {/* Header */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: theme.colors.text 
                }}>
                  Component Preview
                </Text>
                <TouchableOpacity onPress={() => setShowComponentPreview(false)}>
                  <X size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </XStack>

              {/* Component Content */}
              {previewingComponent && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                  <YStack gap="$3">
                    <Card backgroundColor={theme.colors.primaryLight + '20'} padding="$3">
                      <YStack gap="$2">
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '600', 
                          color: theme.colors.text 
                        }}>
                          {previewingComponent.title}
                        </Text>
                        <Text style={{ 
                          fontSize: 14, 
                          color: theme.colors.textSecondary 
                        }}>
                          {previewingComponent.description}
                        </Text>
                      </YStack>
                    </Card>

                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: theme.colors.text 
                    }}>
                      Fields in this component:
                    </Text>

                    {previewingComponent.fields.map((field: any, index: number) => (
                      <Card key={index} backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                        <YStack gap="$1">
                          <XStack alignItems="center" gap="$2">
                            <Text style={{ 
                              fontSize: 14, 
                              fontWeight: '500', 
                              color: theme.colors.text 
                            }}>
                              {field.label}
                            </Text>
                            {field.required && (
                              <View style={{
                                backgroundColor: theme.colors.error + '20',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 8
                              }}>
                                <Text style={{ 
                                  fontSize: 10, 
                                  color: theme.colors.error,
                                  fontWeight: '500'
                                }}>
                                  Required
                                </Text>
                              </View>
                            )}
                          </XStack>
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.textSecondary 
                          }}>
                            Type: {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                            {field.options && ` • Options: ${field.options.join(', ')}`}
                          </Text>
                        </YStack>
                      </Card>
                    ))}
                  </YStack>
                </ScrollView>
              )}

              {/* Action Buttons */}
              <XStack gap="$3">
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  borderWidth={1}
                  color={theme.colors.text}
                  onPress={() => setShowComponentPreview(false)}
                >
                  Cancel
                </Button>
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.primary}
                  color="white"
                  onPress={() => {
                    if (previewingComponent?.componentType) {
                      addPrebuiltComponent(previewingComponent.componentType);
                      setShowComponentPreview(false);
                    }
                  }}
                >
                  Add Component
                </Button>
              </XStack>
            </YStack>
          </Card>
        </View>
      </Modal>

      {/* Field Customizer Modal */}
      <Modal
        visible={showFieldCustomizer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFieldCustomizer(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <Card 
            backgroundColor={theme.colors.surface}
            padding="$4"
            width="100%"
            maxWidth={isTablet ? 500 : undefined}
            borderRadius={12}
          >
            <YStack gap="$4">
              {/* Header */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: theme.colors.text 
                }}>
                  Customize Field
                </Text>
                <TouchableOpacity onPress={() => setShowFieldCustomizer(false)}>
                  <X size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </XStack>

              {/* Field Customization */}
              {customizingField && (
                <YStack gap="$3">
                  <Card backgroundColor={theme.colors.primaryLight + '20'} padding="$3">
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: theme.colors.text 
                    }}>
                      Field Type: {customizingField.type.charAt(0).toUpperCase() + customizingField.type.slice(1)}
                    </Text>
                  </Card>

                  {/* Field Label */}
                  <YStack gap="$2">
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '500', 
                      color: theme.colors.text 
                    }}>
                      Field Label
                    </Text>
                    <Card backgroundColor={theme.colors.backgroundSecondary} padding="$3">
                      <TextInput
                        style={{
                          fontSize: 14,
                          color: theme.colors.text,
                          padding: 0
                        }}
                        value={fieldLabel}
                        onChangeText={setFieldLabel}
                        placeholder="Enter field label..."
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                    </Card>
                  </YStack>

                  {/* Required Toggle */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '500', 
                      color: theme.colors.text 
                    }}>
                      Required Field
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setFieldRequired(!fieldRequired)}
                      style={{
                        backgroundColor: fieldRequired ? theme.colors.primary : theme.colors.surface,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                      }}
                    >
                      <Text style={{ 
                        fontSize: 12, 
                        color: fieldRequired ? 'white' : theme.colors.text,
                        fontWeight: '500'
                      }}>
                        {fieldRequired ? 'Required' : 'Optional'}
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  {/* Options for Select Fields */}
                  {customizingField.type === 'select' && (
                    <YStack gap="$2">
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '500', 
                        color: theme.colors.text 
                      }}>
                        Options
                      </Text>
                      {fieldOptions.map((option, index) => (
                        <XStack key={index} alignItems="center" gap="$2">
                          <Card backgroundColor={theme.colors.backgroundSecondary} padding="$2" flex={1}>
                            <TextInput
                              style={{
                                fontSize: 14,
                                color: theme.colors.text,
                                padding: 0
                              }}
                              value={option}
                              onChangeText={(text) => {
                                const newOptions = [...fieldOptions];
                                newOptions[index] = text;
                                setFieldOptions(newOptions);
                              }}
                              placeholder={`Option ${index + 1}`}
                              placeholderTextColor={theme.colors.textSecondary}
                            />
                          </Card>
                          {fieldOptions.length > 1 && (
                            <TouchableOpacity 
                              onPress={() => {
                                const newOptions = fieldOptions.filter((_, i) => i !== index);
                                setFieldOptions(newOptions);
                              }}
                            >
                              <X size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                          )}
                        </XStack>
                      ))}
                      <TouchableOpacity 
                        onPress={() => setFieldOptions([...fieldOptions, ''])}
                        style={{
                          backgroundColor: theme.colors.primary + '20',
                          padding: 8,
                          borderRadius: 8,
                          alignItems: 'center'
                        }}
                      >
                        <XStack alignItems="center" gap="$1">
                          <Plus size={16} color={theme.colors.primary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.primary,
                            fontWeight: '500'
                          }}>
                            Add Option
                          </Text>
                        </XStack>
                      </TouchableOpacity>
                    </YStack>
                  )}
                </YStack>
              )}

              {/* Action Buttons */}
              <XStack gap="$3">
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  borderWidth={1}
                  color={theme.colors.text}
                  onPress={() => setShowFieldCustomizer(false)}
                >
                  Cancel
                </Button>
                <Button 
                  flex={1}
                  backgroundColor={theme.colors.primary}
                  color="white"
                  onPress={addCustomizedField}
                  disabled={!fieldLabel.trim()}
                  opacity={!fieldLabel.trim() ? 0.6 : 1}
                >
                  Add Field
                </Button>
              </XStack>
            </YStack>
          </Card>
        </View>
      </Modal>

      </ScrollView>
    </ScreenContainer>
  );
}
