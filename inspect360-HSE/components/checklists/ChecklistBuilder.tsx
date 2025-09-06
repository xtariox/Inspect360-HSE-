import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import {
  Plus,
  X,
  Type,
  Calendar,
  Clock,
  Hash,
  ToggleLeft,
  List,
  Camera,
  FileText,
  ChevronRight,
  Eye
} from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { InspectionTemplate, InspectionSection, InspectionField } from '../../types/inspection';
import { useNavigation } from '@react-navigation/native';
import SimpleFormBuilder from '../forms/SimpleFormBuilder';
import { useUser } from '../../contexts/UserContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface ChecklistBuilderProps {
  visible: boolean;
  onClose: () => void;
  onSaveTemplate: (template: InspectionTemplate) => void;
  onSaveDraft?: (template: Partial<InspectionTemplate>) => void;
  editingTemplate?: InspectionTemplate | null;
}

const prebuiltComponents = [
  {
    id: 'basic_info',
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
  {
    id: 'safety_check',
    title: 'Safety Equipment Check',
    description: 'Standard safety equipment verification',
    fields: [
      { id: 'ppe_available', label: 'PPE Available and Accessible', type: 'boolean' as const, required: true },
      { id: 'safety_signs', label: 'Safety Signs Visible and Clear', type: 'boolean' as const, required: true },
      { id: 'emergency_exits', label: 'Emergency Exits Clear', type: 'boolean' as const, required: true },
      { id: 'first_aid_kit', label: 'First Aid Kit Available', type: 'boolean' as const, required: true },
      { id: 'safety_equipment_condition', label: 'Safety Equipment Condition', type: 'select' as const, options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
      { id: 'safety_notes', label: 'Safety Notes', type: 'textarea' as const, required: false }
    ]
  },
  {
    id: 'environmental',
    title: 'Environmental Check',
    description: 'Environmental conditions and compliance',
    fields: [
      { id: 'lighting_adequate', label: 'Adequate Lighting', type: 'boolean' as const, required: true },
      { id: 'ventilation_working', label: 'Ventilation System Working', type: 'boolean' as const, required: true },
      { id: 'noise_levels', label: 'Noise Levels Acceptable', type: 'boolean' as const, required: true },
      { id: 'temperature', label: 'Temperature (°C)', type: 'number' as const, required: false },
      { id: 'humidity', label: 'Humidity (%)', type: 'number' as const, required: false },
      { id: 'environmental_hazards', label: 'Environmental Hazards Present', type: 'boolean' as const, required: true },
      { id: 'environmental_notes', label: 'Environmental Notes', type: 'textarea' as const, required: false }
    ]
  },
  {
    id: 'machinery_equipment',
    title: 'Machinery & Equipment',
    description: 'Equipment safety and maintenance check',
    fields: [
      { id: 'equipment_condition', label: 'Overall Equipment Condition', type: 'select' as const, options: ['Excellent', 'Good', 'Needs Attention', 'Unsafe'], required: true },
      { id: 'guards_in_place', label: 'Safety Guards in Place', type: 'boolean' as const, required: true },
      { id: 'lockout_tagout', label: 'Lockout/Tagout Procedures Followed', type: 'boolean' as const, required: true },
      { id: 'maintenance_current', label: 'Maintenance Up to Date', type: 'boolean' as const, required: true },
      { id: 'equipment_photo', label: 'Equipment Photo', type: 'image' as const, required: false },
      { id: 'equipment_notes', label: 'Equipment Notes', type: 'textarea' as const, required: false }
    ]
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping',
    description: 'Cleanliness and organization check',
    fields: [
      { id: 'area_clean', label: 'Work Area Clean', type: 'boolean' as const, required: true },
      { id: 'tools_organized', label: 'Tools Properly Organized', type: 'boolean' as const, required: true },
      { id: 'waste_disposal', label: 'Waste Properly Disposed', type: 'boolean' as const, required: true },
      { id: 'spills_cleaned', label: 'No Spills or Leaks', type: 'boolean' as const, required: true },
      { id: 'housekeeping_score', label: 'Housekeeping Score (1-10)', type: 'number' as const, required: true },
      { id: 'housekeeping_photo', label: 'Area Photo', type: 'image' as const, required: false }
    ]
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    description: 'Compliance with regulations and standards',
    fields: [
      { id: 'permits_current', label: 'All Permits Current', type: 'boolean' as const, required: true },
      { id: 'training_records', label: 'Training Records Updated', type: 'boolean' as const, required: true },
      { id: 'procedures_followed', label: 'Procedures Being Followed', type: 'boolean' as const, required: true },
      { id: 'documentation_complete', label: 'Documentation Complete', type: 'boolean' as const, required: true },
      { id: 'compliance_issues', label: 'Compliance Issues Found', type: 'boolean' as const, required: true },
      { id: 'compliance_notes', label: 'Compliance Notes', type: 'textarea' as const, required: false }
    ]
  }
];

const ChecklistBuilder: React.FC<ChecklistBuilderProps> = ({
  visible,
  onClose,
  onSaveTemplate,
  onSaveDraft,
  editingTemplate
}) => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useUser();
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Handle editing template
  useEffect(() => {
    if (editingTemplate) {
      setTemplateName(editingTemplate.title);
      setTemplateDescription(editingTemplate.description || '');
      
      // Map existing sections to selected components
      const componentIds: string[] = [];
      editingTemplate.sections.forEach(section => {
        const matchingComponent = prebuiltComponents.find(comp => 
          comp.title === section.title || 
          comp.fields.every(field => section.fields.some(sField => sField.id === field.id))
        );
        if (matchingComponent) {
          componentIds.push(matchingComponent.id);
        }
      });
      setSelectedComponents(componentIds);
    } else {
      // Reset when not editing
      setTemplateName('');
      setTemplateDescription('');
      setSelectedComponents([]);
    }
  }, [editingTemplate]);

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleCreateFromScratch = () => {
    // For "Create from Scratch", we'll still show the prebuilt components
    // but also allow access to the custom form builder
    setShowFormBuilder(true);
  };

  const handleCreateFromComponents = () => {
    if (selectedComponents.length === 0) {
      Alert.alert('No Components Selected', 'Please select at least one component to create a template.');
      return;
    }

    if (!templateName.trim()) {
      Alert.alert('Template Name Required', 'Please enter a name for your template.');
      return;
    }

    // Create template from selected components
    const sections: InspectionSection[] = selectedComponents.map((componentId, index) => {
      const component = prebuiltComponents.find(c => c.id === componentId);
      if (!component) return null;

      return {
        id: componentId,
        title: component.title,
        description: component.description,
        fields: component.fields.map((field, fieldIndex) => ({
          ...field,
          id: `${componentId}_${field.id}`,
        })),
        order: index
      };
    }).filter(Boolean) as InspectionSection[];

    let templateToSave: InspectionTemplate;

    if (editingTemplate) {
      // Update existing template
      templateToSave = {
        ...editingTemplate,
        title: templateName,
        description: templateDescription || editingTemplate.description,
        sections,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Generate a proper UUID for new template
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Create new template
      templateToSave = {
        id: generateUUID(),
        title: templateName,
        description: templateDescription || 'Custom template created from components',
        category: 'custom',
        tags: ['custom', 'components'],
        sections,
        status: 'active',
        isActive: true,
        isPrebuilt: false,
        createdBy: user?.id || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    console.log('💾 ChecklistBuilder: About to save template:', templateToSave);
    onSaveTemplate(templateToSave);
    
    // Reset form
    setTemplateName('');
    setTemplateDescription('');
    setSelectedComponents([]);
    
    onClose();
  };

  const handleSaveDraft = () => {
    if (!onSaveDraft) return;
    
    if (!templateName.trim()) {
      Alert.alert('Validation Error', 'Please enter a template name');
      return;
    }

    // Build sections from selected components
    const sections: InspectionSection[] = selectedComponents.map(componentId => {
      const component = prebuiltComponents.find(comp => comp.id === componentId);
      if (component) {
        return {
          id: component.id,
          title: component.title,
          description: component.description,
          fields: component.fields,
          order: selectedComponents.indexOf(componentId)
        };
      }
      return null;
    }).filter(Boolean) as InspectionSection[];

    if (sections.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one component');
      return;
    }

    const draftTemplate: Partial<InspectionTemplate> = {
      title: templateName,
      description: templateDescription || 'Draft template created from components',
      category: 'custom',
      tags: ['draft', 'custom', 'components'],
      sections,
      isActive: false,
      isPrebuilt: false,
      createdBy: user?.id || 'unknown'
    };

    console.log('💾 ChecklistBuilder: About to save draft template:', draftTemplate);
    console.log('💾 ChecklistBuilder: Draft sections:', draftTemplate.sections);
    
    onSaveDraft(draftTemplate);
    
    Alert.alert('Success', 'Template saved as draft');
  };

  // Handle closing and reset state
  const handleClose = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedComponents([]);
    setShowFormBuilder(false);
    onClose();
  };

  const renderComponentIcon = (componentId: string) => {
    switch (componentId) {
      case 'basic_info': return <FileText size={20} color={theme.colors.primary} />;
      case 'safety_check': return <ToggleLeft size={20} color={theme.colors.error} />;
      case 'environmental': return <Hash size={20} color={theme.colors.success} />;
      case 'machinery_equipment': return <Camera size={20} color={theme.colors.warning} />;
      case 'housekeeping': return <Type size={20} color={theme.colors.info} />;
      case 'compliance': return <List size={20} color={theme.colors.primary} />;
      default: return <FileText size={20} color={theme.colors.primary} />;
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent={true}>
      {/* Semi-transparent background overlay */}
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent grey background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        {/* Main modal content */}
        <View style={{
          width: '100%',
          maxWidth: isTablet ? 600 : '100%',
          height: '90%',
          backgroundColor: theme.colors.background,
          borderRadius: 12,
          overflow: 'hidden',
          elevation: 8,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        }}>
          {/* Header */}
          <XStack
            backgroundColor={theme.colors.primary}
            padding="$4"
            justifyContent="space-between"
            alignItems="center"
            borderBottomColor={theme.colors.border}
            borderBottomWidth={1}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
              Create New Template
            </Text>
            <TouchableOpacity 
              onPress={handleClose}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: 8,
              }}
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </XStack>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <YStack gap="$4">
              {/* Template Info */}
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <YStack gap="$3">
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                    Template Information
                  </Text>
                  <YStack gap="$2">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                      Template Name *
                    </Text>
                    <TextInput
                      placeholder="Enter a descriptive name for your template"
                      value={templateName}
                      onChangeText={setTemplateName}
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        color: theme.colors.text,
                        elevation: 1,
                        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.05)',
                      }}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </YStack>
                  <YStack gap="$2">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                      Description
                    </Text>
                    <TextInput
                      placeholder="Describe what this template is used for..."
                      value={templateDescription}
                      onChangeText={setTemplateDescription}
                      multiline
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        color: theme.colors.text,
                        minHeight: 80,
                        textAlignVertical: 'top',
                        elevation: 1,
                        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.05)',
                      }}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </YStack>
                </YStack>
              </Card>

              {/* Create Options */}
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <YStack gap="$3">
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                    Choose Creation Method
                  </Text>
                  
                  <TouchableOpacity
                    onPress={handleCreateFromScratch}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <YStack>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                        Create from Scratch
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Build a completely custom template
                      </Text>
                    </YStack>
                    <ChevronRight size={20} color={theme.colors.primary} />
                  </TouchableOpacity>

                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                    Or select prebuilt components:
                  </Text>
                </YStack>
              </Card>

              {/* Prebuilt Components */}
              <YStack gap="$3">
                {prebuiltComponents.map((component) => (
                  <TouchableOpacity
                    key={component.id}
                    onPress={() => handleComponentToggle(component.id)}
                  >
                    <Card
                      backgroundColor={selectedComponents.includes(component.id) 
                        ? theme.colors.primary + '20' 
                        : theme.colors.surface
                      }
                      borderColor={selectedComponents.includes(component.id) 
                        ? theme.colors.primary 
                        : theme.colors.border
                      }
                      borderWidth={1}
                      padding="$4"
                    >
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.background,
                          padding: 8,
                          borderRadius: 8
                        }}>
                          {renderComponentIcon(component.id)}
                        </View>
                        <YStack flex={1}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: selectedComponents.includes(component.id) 
                              ? theme.colors.primary 
                              : theme.colors.text
                          }}>
                            {component.title}
                          </Text>
                          <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary
                          }}>
                            {component.description} • {component.fields.length} fields
                          </Text>
                        </YStack>
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: selectedComponents.includes(component.id) 
                            ? theme.colors.primary 
                            : 'transparent',
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {selectedComponents.includes(component.id) && (
                            <View style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: 'white'
                            }} />
                          )}
                        </View>
                      </XStack>
                    </Card>
                  </TouchableOpacity>
                ))}
              </YStack>
            </YStack>
          </ScrollView>

          {/* Footer */}
          <XStack
            backgroundColor={theme.colors.surface}
            padding="$4"
            justifyContent="space-between"
            alignItems="center"
            borderTopColor={theme.colors.border}
            borderTopWidth={1}
          >
            <Button
              backgroundColor="transparent"
              borderColor={theme.colors.border}
              borderWidth={1}
              color={theme.colors.text}
              onPress={onClose}
              size="$3"
            >
              Cancel
            </Button>

            <XStack space="$2">
              {onSaveDraft && (
                <Button
                  backgroundColor="transparent"
                  borderColor={theme.colors.primary}
                  borderWidth={1}
                  color={theme.colors.primary}
                  onPress={handleSaveDraft}
                  disabled={selectedComponents.length === 0 || !templateName.trim()}
                  opacity={selectedComponents.length === 0 || !templateName.trim() ? 0.5 : 1}
                  size="$3"
                >
                  Save Draft
                </Button>
              )}

              <Button
                backgroundColor={theme.colors.primary}
                color="white"
                onPress={handleCreateFromComponents}
                disabled={selectedComponents.length === 0 || !templateName.trim()}
                opacity={selectedComponents.length === 0 || !templateName.trim() ? 0.5 : 1}
                size="$3"
              >
                Create Template ({selectedComponents.length})
              </Button>
            </XStack>
          </XStack>
        </View>
      </View>

      {/* Form Builder Modal - rendered outside the main modal for proper layering */}
      {showFormBuilder && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for nested modal
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            {/* Modal container with same styling as ChecklistBuilder */}
            <View style={{
              width: '100%',
              maxWidth: isTablet ? 600 : '100%',
              height: '90%',
              backgroundColor: theme.colors.background,
              borderRadius: 12,
              overflow: 'hidden',
              elevation: 8,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}>
              <SimpleFormBuilder
                onSave={(template) => {
                  console.log('🔄 ChecklistBuilder: Received template from SimpleFormBuilder:', template);
                  console.log('💾 Calling onSaveTemplate...');
                  onSaveTemplate(template);
                  setShowFormBuilder(false);
                }}
                onCancel={() => setShowFormBuilder(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

export default ChecklistBuilder;
