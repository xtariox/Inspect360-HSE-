import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Button } from '@tamagui/button';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { X, Plus, Type, Calendar, Hash, ToggleLeft, List, Camera, Trash2, Edit3, Check } from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { InspectionTemplate, InspectionField, FieldType } from '../../types/inspection';
import { TemplatesService } from '../../services/templatesService';

interface SimpleFormBuilderProps {
  onSave: (template: InspectionTemplate) => void;
  onCancel: () => void;
  editingTemplate?: InspectionTemplate | null;
}

const fieldTypes = [
  { value: 'text' as FieldType, label: 'Text Input', icon: Type },
  { value: 'date' as FieldType, label: 'Date', icon: Calendar },
  { value: 'number' as FieldType, label: 'Number', icon: Hash },
  { value: 'boolean' as FieldType, label: 'Yes/No', icon: ToggleLeft },
  { value: 'select' as FieldType, label: 'Multiple Choice', icon: List },
  { value: 'image' as FieldType, label: 'Photo', icon: Camera },
];

function SimpleFormBuilder({ onSave, onCancel, editingTemplate }: SimpleFormBuilderProps) {
  const { theme } = useAppTheme();

  const [template, setTemplate] = useState<Partial<InspectionTemplate>>(() => {
    if (editingTemplate) {
      return {
        ...editingTemplate,
        sections: editingTemplate.sections.map(section => ({ ...section }))
      };
    } else {
      return {
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
      };
    }
  });

  const [showFieldTypeModal, setShowFieldTypeModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleSave = () => {
    if (!template.title?.trim()) {
      Alert.alert('Error', 'Please enter a template title');
      return;
    }

    const finalTemplate: InspectionTemplate = {
      ...template,
      id: editingTemplate?.id || TemplatesService.generateUUID(),
      title: template.title!,
      description: template.description || '',
      category: 'custom',
      tags: [],
      sections: template.sections || [],
      createdBy: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isPrebuilt: false
    } as InspectionTemplate;

    onSave(finalTemplate);
  };

  const updateFieldLabel = (fieldId: string, newLabel: string) => {
    const updatedSections = [...(template.sections || [])];
    if (updatedSections[0]) {
      updatedSections[0] = {
        ...updatedSections[0],
        fields: updatedSections[0].fields?.map(field =>
          field.id === fieldId ? { ...field, label: newLabel } : field
        ) || []
      };
      setTemplate(prev => ({ ...prev, sections: updatedSections }));
    }
    setEditingField(null);
    setEditingLabel('');
  };

  const startEditingField = (fieldId: string, currentLabel: string) => {
    setEditingField(fieldId);
    setEditingLabel(currentLabel);
  };

  const addField = (fieldType: FieldType) => {
    const fieldTypeLabels = {
      text: 'Text Input Field',
      date: 'Date of Inspection',
      number: 'Numeric Value',
      boolean: 'Yes/No Question',
      select: 'Multiple Choice',
      image: 'Photo Upload'
    };

    const newField: InspectionField = {
      id: `field_${Date.now()}`,
      label: fieldTypeLabels[fieldType] || `New ${fieldType} Field`,
      type: fieldType,
      required: false,
      placeholder: fieldType === 'text' ? 'Enter value...' : undefined,
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSections = [...(template.sections || [])];
    if (updatedSections[0]) {
      updatedSections[0] = {
        ...updatedSections[0],
        fields: [...(updatedSections[0].fields || []), newField]
      };
      setTemplate(prev => ({ ...prev, sections: updatedSections }));
    }
    setShowFieldTypeModal(false);
    setTimeout(() => startEditingField(newField.id, newField.label), 100);
  };

  const removeField = (fieldId: string) => {
    const updatedSections = [...(template.sections || [])];
    if (updatedSections[0]) {
      updatedSections[0] = {
        ...updatedSections[0],
        fields: updatedSections[0].fields?.filter(field => field.id !== fieldId) || []
      };
      setTemplate(prev => ({ ...prev, sections: updatedSections }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: theme.colors.primary, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Template Editor</Text>
        <TouchableOpacity onPress={onCancel} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 8 }}>
          <X size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Title */}
        <TextInput
          placeholder="Template Title"
          value={template.title || ''}
          onChangeText={(text) => setTemplate(prev => ({ ...prev, title: text }))}
          style={{ fontSize: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 8, marginBottom: 12, color: theme.colors.text }}
        />

        {/* Description */}
        <TextInput
          placeholder="Template Description"
          value={template.description || ''}
          onChangeText={(text) => setTemplate(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          style={{ fontSize: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 8, marginBottom: 16, color: theme.colors.text, textAlignVertical: 'top' }}
        />

        {/* Fields */}
        <View>
          <XStack alignItems="center" justifyContent="space-between" marginBottom={12}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Fields</Text>
            <Button icon={<Plus />} onPress={() => setShowFieldTypeModal(true)}>Add Field</Button>
          </XStack>

          {template.sections?.[0]?.fields?.length ? template.sections[0].fields.map(field => (
            <Card key={field.id} padding="$3" marginBottom="$2" backgroundColor={theme.colors.surface}>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>{field.label}</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{field.type}</Text>
                </YStack>
                <XStack gap="$2">
                  <Button size="$2" variant="outlined" onPress={() => startEditingField(field.id, field.label)}>Modify</Button>
                  <Button size="$2" theme="red" variant="outlined" onPress={() => removeField(field.id)}>Delete</Button>
                </XStack>
              </XStack>
            </Card>
          )) : (
            <Text style={{ color: theme.colors.textSecondary }}>No fields yet. Click "Add Field".</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: theme.colors.border }}>
        <Button onPress={handleSave}>Save Template</Button>
      </View>

      {/* Field Type Selector */}
      {showFieldTypeModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <Card padding="$4" backgroundColor={theme.colors.surface}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Choose Field Type</Text>
            {fieldTypes.map(fieldType => (
              <TouchableOpacity key={fieldType.value} onPress={() => addField(fieldType.value)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <fieldType.icon size={20} color={theme.colors.primary} />
                <Text style={{ marginLeft: 10, color: theme.colors.text }}>{fieldType.label}</Text>
              </TouchableOpacity>
            ))}
            <Button marginTop={16} variant="outlined" onPress={() => setShowFieldTypeModal(false)}>Cancel</Button>
          </Card>
        </View>
      )}
      {/* Inline Field Editor */}
{editingField && (
  <View
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}
  >
    <Card padding="$4" backgroundColor={theme.colors.surface} width="100%" maxWidth={400}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: theme.colors.text }}>
        Edit Field
      </Text>

      <Text style={{ marginBottom: 6, color: theme.colors.text }}>Label</Text>
      <TextInput
        placeholder="Field label"
        value={editingLabel}
        onChangeText={setEditingLabel}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          color: theme.colors.text,
        }}
        placeholderTextColor={theme.colors.textSecondary}
      />

      {/* Toggle required */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}
        onPress={() => {
          const updatedSections = [...(template.sections || [])];
          const section = updatedSections[0];
          const fieldIndex = section.fields?.findIndex(f => f.id === editingField);
          if (fieldIndex !== -1 && section.fields) {
            section.fields[fieldIndex].required = !section.fields[fieldIndex].required;
            setTemplate(prev => ({ ...prev, sections: updatedSections }));
          }
        }}
      >
        <Check size={20} color={theme.colors.primary} />
        <Text style={{ marginLeft: 8, color: theme.colors.text }}>
          {template.sections?.[0]?.fields?.find(f => f.id === editingField)?.required ? 'Required' : 'Optional'}
        </Text>
      </TouchableOpacity>

      {/* Save / Cancel Buttons */}
      <XStack justifyContent="flex-end" gap="$3">
        <Button variant="outlined" onPress={() => {
          setEditingField(null);
          setEditingLabel('');
        }}>
          Cancel
        </Button>
        <Button
          theme="active"
          onPress={() => updateFieldLabel(editingField, editingLabel)}
        >
          Save
        </Button>
      </XStack>
    </Card>
  </View>
)}

    </View>
  );
}

export default SimpleFormBuilder;
