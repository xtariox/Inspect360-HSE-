import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { Input } from '@tamagui/input';
import { Select } from '@tamagui/select';
import { TextArea } from '@tamagui/input';
import { DateTimeInput } from '../forms/DateTimeInput';
import { useAppTheme } from '../../themes';
import assignmentService, { CreateAssignmentData } from '../../services/assignmentService';
import { UserProfile } from '../../types/auth';
import { InspectionTemplate } from '../../types/inspection';
import { InspectionsService } from '../../services/inspectionsService';
import { 
  User, 
  Calendar, 
  AlertTriangle, 
  FileText,
  Check,
  X
} from '@tamagui/lucide-icons';

interface InspectionAssignmentFormProps {
  inspectionId: string;
  inspectionTitle: string;
  currentAssignedTo?: string;
  onAssignmentComplete: () => void;
  onCancel: () => void;
  assignedBy: string; // Current user ID (admin/manager)
  isTemplate?: boolean;
  templateData?: InspectionTemplate;
}

export default function InspectionAssignmentForm({
  inspectionId,
  inspectionTitle,
  currentAssignedTo,
  onAssignmentComplete,
  onCancel,
  assignedBy,
  isTemplate = false,
  templateData
}: InspectionAssignmentFormProps) {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [inspectors, setInspectors] = useState<UserProfile[]>([]);
  const [selectedInspector, setSelectedInspector] = useState(currentAssignedTo || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    try {
      console.log('📋 Loading inspectors for assignment...');
      const inspectorsList = await assignmentService.getAssignableUsers();
      setInspectors(inspectorsList);
    } catch (error) {
      console.error('❌ Error loading inspectors:', error);
      Alert.alert('Error', 'Failed to load inspectors. Please try again.');
    }
  };

  const handleAssign = async () => {
    if (!selectedInspector) {
      Alert.alert('Error', 'Please select an inspector to assign this inspection to.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Creating inspection assignment...');
      
      if (isTemplate && templateData) {
        // For template assignments, create a real inspection first, then assign it
        console.log('📋 Creating new inspection from template:', templateData.title);
        
        try {
          // Create the inspection from template
          const newInspection = await InspectionsService.createInspectionFromTemplate(
            templateData.id,
            selectedInspector,
            assignedBy,
            `${templateData.title} - Assignment`,
            'Location TBD',
            dueDate
          );
          
          console.log('✅ Created inspection from template:', newInspection.id);
          
          // Now create the assignment with the real inspection ID
          const assignmentData: CreateAssignmentData = {
            inspection_id: newInspection.id,
            assigned_to: selectedInspector,
            due_date: dueDate || undefined,
            priority,
            notes: `Template-based assignment: ${templateData.title}
Category: ${templateData.category}
Description: ${templateData.description}

Instructions: Please complete this inspection based on the "${templateData.title}" template.

Additional Notes: ${notes || 'None'}`
          };

          await assignmentService.createAssignment(assignmentData, assignedBy);
          
          Alert.alert(
            'Assignment Created Successfully', 
            `A new inspection has been created from template "${templateData.title}" and assigned to the selected inspector. The inspector can now view and complete this inspection.`,
            [{ text: 'OK', onPress: onAssignmentComplete }]
          );
        } catch (error) {
          console.error('❌ Error creating template assignment:', error);
          Alert.alert('Error', 'Failed to create assignment from template. Please try again.');
        }
      } else {
        // Regular inspection assignment
        const assignmentData: CreateAssignmentData = {
          inspection_id: inspectionId,
          assigned_to: selectedInspector,
          due_date: dueDate || undefined,
          priority,
          notes: notes || undefined
        };

        await assignmentService.createAssignment(assignmentData, assignedBy);
        
        Alert.alert('Success', 'Inspection has been assigned successfully!', [
          { text: 'OK', onPress: onAssignmentComplete }
        ]);
      }
    } catch (error) {
      console.error('❌ Error assigning inspection:', error);
      Alert.alert('Error', 'Failed to assign inspection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedInspectorProfile = inspectors.find(i => i.id === selectedInspector);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Card
        backgroundColor={theme.colors.surface}
        borderColor={theme.colors.border}
        borderWidth={1}
        borderRadius={12}
        padding="$4"
        margin="$3"
      >
        <YStack gap="$4">
          {/* Header */}
          <YStack gap="$2">
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.colors.text
            }}>
              {isTemplate ? 'Assign Template' : 'Assign Inspection'}
            </Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.primary
            }}>
              {inspectionTitle}
            </Text>
            {isTemplate && templateData && (
              <Text style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                fontStyle: 'italic'
              }}>
                Inspector will create new inspection from this template
              </Text>
            )}
          </YStack>

          {/* Inspector Selection */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <User size={20} color={theme.colors.primary} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Select Inspector *
              </Text>
            </XStack>
            
            <Select
              value={selectedInspector}
              onValueChange={setSelectedInspector}
              native
            >
              <Select.Trigger>
                <Select.Value 
                  placeholder="Choose an inspector..."
                  style={{ color: theme.colors.text }}
                />
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {inspectors.map((inspector, index) => (
                    <Select.Item 
                      key={inspector.id} 
                      value={inspector.id}
                      index={index}
                      textValue={`${inspector.full_name} (${inspector.role})`}
                    >
                      <Select.ItemText>
                        {inspector.full_name} ({inspector.role})
                      </Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select>

            {selectedInspectorProfile && (
              <Card
                backgroundColor={theme.colors.background}
                borderColor={theme.colors.border}
                borderWidth={1}
                borderRadius={8}
                padding="$3"
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
                      {selectedInspectorProfile.full_name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: theme.colors.textSecondary
                    }}>
                      {selectedInspectorProfile.email} • {selectedInspectorProfile.role}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            )}
          </YStack>

          {/* Due Date */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Due Date
              </Text>
            </XStack>
            <DateTimeInput
              field={{
                id: 'dueDate',
                label: 'Due Date',
                type: 'date',
                required: false
              }}
              value={dueDate}
              onChange={setDueDate}
              theme={theme}
            />
          </YStack>

          {/* Priority */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <AlertTriangle size={20} color={theme.colors.primary} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Priority
              </Text>
            </XStack>
            
            <XStack gap="$2" flexWrap="wrap">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <Button
                  key={p}
                  size="$3"
                  variant="outlined"
                  backgroundColor={priority === p ? theme.colors.primary : 'transparent'}
                  borderColor={priority === p ? theme.colors.primary : theme.colors.border}
                  onPress={() => setPriority(p)}
                  style={{ minWidth: 80 }}
                >
                  <Text style={{
                    color: priority === p ? 'white' : theme.colors.text,
                    textTransform: 'capitalize'
                  }}>
                    {p}
                  </Text>
                </Button>
              ))}
            </XStack>
          </YStack>

          {/* Notes */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <FileText size={20} color={theme.colors.primary} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Notes
              </Text>
            </XStack>
            <TextArea
              placeholder="Add any special instructions or notes for the inspector..."
              value={notes}
              onChange={(e) => setNotes(e.target?.value || e.nativeEvent?.text || '')}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
                minHeight: 80
              }}
            />
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$3" marginTop="$3">
            <Button
              flex={1}
              variant="outlined"
              borderColor={theme.colors.border}
              onPress={onCancel}
              disabled={loading}
            >
              <XStack alignItems="center" gap="$2">
                <X size={16} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary }}>
                  Cancel
                </Text>
              </XStack>
            </Button>
            
            <Button
              flex={1}
              backgroundColor={theme.colors.primary}
              onPress={handleAssign}
              disabled={loading || !selectedInspector}
            >
              <XStack alignItems="center" gap="$2">
                <Check size={16} color="white" />
                <Text style={{ color: 'white' }}>
                  {loading ? 'Assigning...' : 'Assign Inspector'}
                </Text>
              </XStack>
            </Button>
          </XStack>
        </YStack>
      </Card>
    </ScrollView>
  );
}
