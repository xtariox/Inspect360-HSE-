import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { useAppTheme } from '../../themes';
import { useFocusEffect } from '@react-navigation/native';
import assignmentService, { InspectionAssignment } from '../../services/assignmentService';
import { InspectionsService } from '../../services/inspectionsService';
import { TemplatesService } from '../../services/templatesService';
import { CrossPlatformAlert } from '../../utils/CrossPlatformAlert';
import { 
  Calendar, 
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  Play,
  AlertCircle
} from '@tamagui/lucide-icons';

interface InspectorAssignmentsProps {
  inspectorId: string;
  onStartInspection?: (inspectionId: string) => void;
}

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626'
};

const statusColors = {
  assigned: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981',
  overdue: '#DC2626'
};

export default function InspectorAssignments({ 
  inspectorId, 
  onStartInspection 
}: InspectorAssignmentsProps) {
  const { theme } = useAppTheme();
  const [assignments, setAssignments] = useState<InspectionAssignment[]>([]);
  const [enrichedAssignments, setEnrichedAssignments] = useState<InspectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [inspectorId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Inspector assignments focused, refreshing data...');
      loadAssignments();
    }, [])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing assignment data...');
      loadAssignments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAssignments = async () => {
    try {
      console.log('📋 Loading assignments for inspector:', inspectorId);
      const data = await assignmentService.getInspectorAssignments(inspectorId);
      setAssignments(data);
      
      // Enrich assignments with inspection and template details
      await enrichAssignmentsWithDetails(data);
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      CrossPlatformAlert.alert('Error', 'Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enrichAssignmentsWithDetails = async (assignments: InspectionAssignment[]) => {
    try {
      const enriched = await Promise.all(
        assignments.map(async (assignment) => {
          let inspectionTitle = `Inspection #${assignment.inspection_id}`;
          let inspectionLocation = 'Unknown';
          let templateTitle = '';
          let templateCreatorName = '';

          // Try to get inspection details
          try {
            const inspection = await InspectionsService.getInspectionById(assignment.inspection_id);
            if (inspection) {
              inspectionTitle = inspection.title;
              inspectionLocation = inspection.location || 'Unknown';
              
              // Try to get template details if inspection has template
              if (inspection.templateId) {
                try {
                  const template = await TemplatesService.getTemplateById(inspection.templateId);
                  if (template) {
                    templateTitle = template.title;
                    templateCreatorName = template.createdBy || 'Unknown';
                  }
                } catch (templateError) {
                  console.warn('Could not fetch template details:', templateError);
                }
              }
            }
          } catch (inspectionError) {
            console.warn('Could not fetch inspection details:', inspectionError);
          }

          return {
            ...assignment,
            inspection_title: inspectionTitle,
            inspection_location: inspectionLocation,
            template_title: templateTitle,
            template_creator_name: templateCreatorName
          };
        })
      );
      
      setEnrichedAssignments(enriched);
    } catch (error) {
      console.error('Error enriching assignments:', error);
      setEnrichedAssignments(assignments);
    }
  };

  const handleStartInspection = async (assignment: InspectionAssignment) => {
    try {
      // Update assignment status to in_progress
      await assignmentService.updateAssignmentStatus(assignment.id, 'in_progress');
      
      // Refresh assignments
      loadAssignments();
      
      // Navigate to inspection if callback provided
      if (onStartInspection && assignment.inspection_id) {
        onStartInspection(assignment.inspection_id);
      }
    } catch (error) {
      console.error('❌ Error starting inspection:', error);
      CrossPlatformAlert.alert('Error', 'Failed to start inspection. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading assignments...</Text>
      </View>
    );
  }

  if (enrichedAssignments.length === 0 && !loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <FileText size={48} color={theme.colors.textSecondary} />
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text,
          marginTop: 12
        }}>
          No Assignments
        </Text>
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: 8
        }}>
          You don't have any inspection assignments at the moment.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <YStack gap="$3" padding="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text
          }}>
            My Assignments ({enrichedAssignments.length})
          </Text>
        </XStack>

        {/* Assignments List */}
        {enrichedAssignments.map((assignment) => {
          const isDue = isOverdue(assignment.due_date);
          
          return (
            <Card
              key={assignment.id}
              backgroundColor={theme.colors.surface}
              borderColor={isDue ? statusColors.overdue : theme.colors.border}
              borderWidth={isDue ? 2 : 1}
              borderRadius={12}
              padding="$4"
            >
              <YStack gap="$3">
                {/* Header */}
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <YStack flex={1} gap="$1">
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: theme.colors.text
                    }}>
                      {assignment.inspection_title || `Inspection #${assignment.inspection_id}`}
                    </Text>
                    {assignment.inspection_location && assignment.inspection_location !== 'Unknown' && (
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary
                      }}>
                        📍 {assignment.inspection_location}
                      </Text>
                    )}
                    {assignment.template_title && (
                      <Text style={{
                        fontSize: 12,
                        color: theme.colors.info,
                        fontStyle: 'italic'
                      }}>
                        Template: {assignment.template_title}
                      </Text>
                    )}
                  </YStack>

                  {/* Status Badge */}
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: statusColors[assignment.status]
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: 'white',
                      textTransform: 'capitalize'
                    }}>
                      {assignment.status.replace('_', ' ')}
                    </Text>
                  </View>
                </XStack>

                {/* Assignment Info */}
                <YStack gap="$2">
                  {/* Due Date */}
                  {assignment.due_date && (
                    <XStack alignItems="center" gap="$2">
                      <Calendar size={16} color={theme.colors.textSecondary} />
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary
                      }}>
                        Due: {formatDate(assignment.due_date)}
                        {isDue && ' (Overdue)'}
                      </Text>
                    </XStack>
                  )}

                  {/* Priority */}
                  <XStack alignItems="center" gap="$2">
                    <AlertTriangle size={16} color={priorityColors[assignment.priority]} />
                    <Text style={{
                      fontSize: 14,
                      color: priorityColors[assignment.priority],
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {assignment.priority} Priority
                    </Text>
                  </XStack>

                  {/* Assigned By */}
                  {assignment.assigner_profile && (
                    <XStack alignItems="center" gap="$2">
                      <User size={16} color={theme.colors.textSecondary} />
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary
                      }}>
                        Assigned by {assignment.assigner_profile.full_name}
                      </Text>
                    </XStack>
                  )}

                  {/* Notes */}
                  {assignment.notes && (
                    <XStack alignItems="flex-start" gap="$2">
                      <FileText size={16} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        flex: 1
                      }}>
                        {assignment.notes}
                      </Text>
                    </XStack>
                  )}
                </YStack>

                {/* Action Button */}
                {assignment.status === 'assigned' && (
                  <Button
                    backgroundColor={theme.colors.primary}
                    onPress={() => handleStartInspection(assignment)}
                    marginTop="$2"
                  >
                    <XStack alignItems="center" gap="$2">
                      <Play size={16} color="white" />
                      <Text style={{ color: 'white', fontWeight: '600' }}>
                        Start Inspection
                      </Text>
                    </XStack>
                  </Button>
                )}

                {assignment.status === 'in_progress' && onStartInspection && (
                  <Button
                    variant="outlined"
                    borderColor={theme.colors.primary}
                    onPress={() => onStartInspection!(assignment.inspection_id)}
                    marginTop="$2"
                  >
                    <XStack alignItems="center" gap="$2">
                      <FileText size={16} color={theme.colors.primary} />
                      <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                        Continue Inspection
                      </Text>
                    </XStack>
                  </Button>
                )}

                {assignment.status === 'completed' && (
                  <XStack alignItems="center" gap="$2" marginTop="$2">
                    <CheckCircle size={16} color={statusColors.completed} />
                    <Text style={{
                      color: statusColors.completed,
                      fontWeight: '600'
                    }}>
                      Inspection Completed
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
