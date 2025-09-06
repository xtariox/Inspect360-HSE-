import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, TextInput } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import {
  Plus,
  Trash2,
  Save,
  Calendar,
  Clock,
  Type,
  Hash,
  ToggleLeft,
  List,
  Camera,
  FileText,
  X
} from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { useUser } from '../../contexts/UserContext';
import { InspectionTemplate, InspectionField, FieldType, FieldTypeOption } from '../../types/inspection';
import ImagePickerComponent from '../ui/ImagePicker';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const fieldTypeOptions: FieldTypeOption[] = [
  { value: 'text', label: 'Text Input', icon: 'Type', description: 'Single line text' },
  { value: 'textarea', label: 'Text Area', icon: 'FileText', description: 'Multi-line text' },
  { value: 'date', label: 'Date', icon: 'Calendar', description: 'Date picker' },
  { value: 'time', label: 'Time', icon: 'Clock', description: 'Time picker' },
  { value: 'number', label: 'Number', icon: 'Hash', description: 'Numeric input' },
  { value: 'boolean', label: 'Yes/No', icon: 'ToggleLeft', description: 'Boolean choice' },
  { value: 'select', label: 'Multiple Choice', icon: 'List', description: 'Select from options' },
  { value: 'image', label: 'Photo', icon: 'Camera', description: 'Image capture' },
];

interface FormBuilderProps {
  onSave: (template: InspectionTemplate) => void;
  onCancel: () => void;
  existingTemplate?: InspectionTemplate;
}

function FormBuilder({ onSave, onCancel, existingTemplate }: FormBuilderProps) {
  console.log('FormBuilder - Component mounting');

  // Hooks must be called at the top level - cannot be in try-catch
  const { theme } = useAppTheme();
  const { user } = useUser();
  
  const [template, setTemplate] = useState<Partial<InspectionTemplate>>(
    existingTemplate || {
      title: '',
      description: '',
      sections: [
        {
          id: 'main',
          title: 'Main Section',
          description: 'Primary inspection fields',
          fields: []
        }
      ]
    }
  );

  console.log('FormBuilder - Template state initialized:', template);

  const [currentSection, setCurrentSection] = useState(0);
  const [showFieldTypeModal, setShowFieldTypeModal] = useState(false);

  const saveTemplate = () => {
    if (!template.title?.trim()) {
      Alert.alert('Error', 'Please enter a template title');
      return;
    }

    if (!template.sections || template.sections.length === 0) {
      Alert.alert('Error', 'Template must have at least one section');
      return;
    }

    // Generate a proper UUID for the template
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const finalTemplate: InspectionTemplate = {
      id: existingTemplate?.id || generateUUID(),
      title: template.title,
      description: template.description || '',
      category: existingTemplate?.category || 'custom',
      tags: existingTemplate?.tags || [],
      sections: template.sections,
      createdBy: existingTemplate?.createdBy || user?.id || 'unknown',
      createdAt: existingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: existingTemplate?.isActive ?? true,
      isPrebuilt: existingTemplate?.isPrebuilt ?? false
    };

    onSave(finalTemplate);
  };

  const addField = (fieldType: FieldType) => {
    if (!template.sections || template.sections.length === 0) return;

    const newField: InspectionField = {
      id: `field_${Date.now()}`,
      label: `New ${fieldType} Field`,
      type: fieldType,
      required: false,
      placeholder: fieldType === 'text' || fieldType === 'textarea' ? 'Enter value...' : undefined,
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSections = [...template.sections];
    updatedSections[currentSection] = {
      ...updatedSections[currentSection],
      fields: [...(updatedSections[currentSection].fields || []), newField]
    };

    setTemplate(prev => ({
      ...prev,
      sections: updatedSections
    }));

    setShowFieldTypeModal(false);
  };

  const removeField = (fieldId: string) => {
    if (!template.sections || template.sections.length === 0) return;

    const updatedSections = [...template.sections];
    updatedSections[currentSection] = {
      ...updatedSections[currentSection],
      fields: updatedSections[currentSection].fields?.filter(field => field.id !== fieldId) || []
    };

    setTemplate(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const renderFieldTypeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Type': return <Type size={20} color={theme.colors.primary} />;
      case 'FileText': return <FileText size={20} color={theme.colors.primary} />;
      case 'Calendar': return <Calendar size={20} color={theme.colors.primary} />;
      case 'Clock': return <Clock size={20} color={theme.colors.primary} />;
      case 'Hash': return <Hash size={20} color={theme.colors.primary} />;
      case 'ToggleLeft': return <ToggleLeft size={20} color={theme.colors.primary} />;
      case 'List': return <List size={20} color={theme.colors.primary} />;
      case 'Camera': return <Camera size={20} color={theme.colors.primary} />;
      default: return <Type size={20} color={theme.colors.primary} />;
    }
  };

  console.log('FormBuilder - About to render, template:', template);

  return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            {existingTemplate ? 'Edit Template' : 'Create New Template'}
          </Text>
          <TouchableOpacity 
            onPress={onCancel}
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
          {/* Template Basic Info */}
          <Card backgroundColor={theme.colors.surface} padding="$4">
            <YStack gap="$3">
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                Template Information
              </Text>
              <YStack gap="$2">
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                  Template Title *
                </Text>
                <TextInput
                  placeholder="Enter template title"
                  value={template.title || ''}
                  onChangeText={(text) => setTemplate(prev => ({ ...prev, title: text }))}
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: theme.colors.text,
                  }}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                  Description
                </Text>
                <TextInput
                  placeholder="Enter template description"
                  value={template.description || ''}
                  onChangeText={(text) => setTemplate(prev => ({ ...prev, description: text }))}
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: theme.colors.text,
                    minHeight: 80,
                  }}
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </YStack>
            </YStack>
          </Card>

          {/* Current Section Content */}
          {template.sections && template.sections[currentSection] && (
            <YStack gap="$4">
              {/* Section Header */}
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <YStack gap="$3">
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                      Section Settings
                    </Text>
                  </XStack>
                  
                  <YStack gap="$2">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                      Section Title *
                    </Text>
                    <TextInput
                      placeholder="Enter section title"
                      value={template.sections[currentSection].title || ''}
                      onChangeText={(text) => {
                        const updatedSections = [...(template.sections || [])];
                        updatedSections[currentSection] = {
                          ...updatedSections[currentSection],
                          title: text
                        };
                        setTemplate(prev => ({ ...prev, sections: updatedSections }));
                      }}
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        color: theme.colors.text,
                      }}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </YStack>
                </YStack>
              </Card>

              {/* Fields */}
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <YStack gap="$3">
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                      Fields ({template.sections[currentSection].fields?.length || 0})
                    </Text>
                    <Button
                      backgroundColor={theme.colors.primary}
                      color="white"
                      icon={<Plus size={16} />}
                      onPress={() => setShowFieldTypeModal(true)}
                      size="$3"
                    >
                      Add Field
                    </Button>
                  </XStack>

                  {template.sections[currentSection].fields && template.sections[currentSection].fields!.length > 0 ? (
                    <YStack gap="$2">
                      {template.sections[currentSection].fields!.map((field, index) => (
                        <Card key={field.id} backgroundColor={theme.colors.background} padding="$3">
                          <XStack alignItems="center" justifyContent="space-between">
                            <XStack alignItems="center" gap="$3" flex={1}>
                              {renderFieldTypeIcon(fieldTypeOptions.find(opt => opt.value === field.type)?.icon || 'Type')}
                              <YStack flex={1}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                                  {field.label}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                  {field.type.charAt(0).toUpperCase() + field.type.slice(1)} 
                                  {field.required && ' • Required'}
                                </Text>
                              </YStack>
                            </XStack>
                            <TouchableOpacity
                              onPress={() => removeField(field.id)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 15,
                                padding: 6,
                              }}
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </XStack>
                        </Card>
                      ))}
                    </YStack>
                  ) : (
                    <Card backgroundColor={theme.colors.background} padding="$4">
                      <YStack alignItems="center" gap="$3">
                        <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
                          No fields added yet.{'\n'}Click "Add Field" to create your first field.
                        </Text>
                        <Button
                          backgroundColor={theme.colors.primary}
                          color="white"
                          icon={<Plus size={16} />}
                          onPress={() => setShowFieldTypeModal(true)}
                          size="$3"
                        >
                          Add Your First Field
                        </Button>
                      </YStack>
                    </Card>
                  )}
                </YStack>
              </Card>
            </YStack>
          )}
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
          onPress={onCancel}
          size="$3"
        >
          Cancel
        </Button>

        <Button
          backgroundColor={theme.colors.primary}
          color="white"
          icon={<Save size={16} />}
          onPress={saveTemplate}
          size="$3"
        >
          Save Template
        </Button>
      </XStack>

      {/* Field Type Modal */}
      {showFieldTypeModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Card backgroundColor={theme.colors.surface} padding="$4" borderRadius="$4" width="100%" maxWidth={400}>
            <YStack gap="$4">
              <XStack alignItems="center" justifyContent="space-between">
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                  Choose Field Type
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFieldTypeModal(false)}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 15,
                    padding: 6,
                  }}
                >
                  <X size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </XStack>

              <ScrollView style={{ maxHeight: 300 }}>
                <YStack gap="$2">
                  {fieldTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => addField(option.value)}
                    >
                      <Card backgroundColor={theme.colors.background} padding="$3">
                        <XStack alignItems="center" gap="$3">
                          {renderFieldTypeIcon(option.icon)}
                          <YStack flex={1}>
                            <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                              {option.label}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                              {option.description}
                            </Text>
                          </YStack>
                        </XStack>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </YStack>
              </ScrollView>
            </YStack>
          </Card>
        </View>
      )}
    </View>
  );
}

export { FormBuilder };
export default FormBuilder;

