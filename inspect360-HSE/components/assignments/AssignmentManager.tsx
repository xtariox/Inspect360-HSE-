import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { useAppTheme } from '../../themes';
import { useFocusEffect } from '@react-navigation/native';
import { TemplatesService } from '../../services/templatesService';
import { InspectionsService } from '../../services/inspectionsService';
import assignmentService, { InspectionAssignment } from '../../services/assignmentService';
import InspectionAssignmentForm from './InspectionAssignmentForm';
import { InspectionTemplate } from '../../types/inspection';
import { CrossPlatformAlert } from '../../utils/CrossPlatformAlert';
import { 
  Calendar, 
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  Plus,
  Trash2,
} from '@tamagui/lucide-icons';

interface AssignmentManagerProps {
  currentUserId: string;
  currentUserRole: 'admin' | 'manager';
  onCreateInspection?: () => void;
  preselectedTemplate?: InspectionTemplate;
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

export default function AssignmentManager({ 
  currentUserId, 
  currentUserRole,
  onCreateInspection,
  preselectedTemplate 
}: AssignmentManagerProps) {
  const { theme } = useAppTheme();
  const [assignments, setAssignments] = useState<InspectionAssignment[]>([]);
  const [enrichedAssignments, setEnrichedAssignments] = useState<InspectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadAssignments();
    
    // If there's a preselected template, show the assignment form immediately
    if (preselectedTemplate) {
      console.log('🎯 Preselected template detected:', preselectedTemplate.title);
      setShowAssignForm(true);
    }
  }, [currentUserId, currentUserRole, preselectedTemplate]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Assignment manager focused, refreshing data...');
      loadAssignments();
    }, [])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing assignment manager data...');
      loadAssignments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAssignments = async () => {
    try {
      console.log('📋 Loading assignments for manager/admin:', currentUserId);
      
      let data: InspectionAssignment[];
      if (currentUserRole === 'admin') {
        data = await assignmentService.getAllAssignments();
      } else {
        data = await assignmentService.getAssignmentsByManager(currentUserId);
      }
      
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

  const handleDeleteAssignment = async (assignmentId: string, inspectionTitle: string) => {
    CrossPlatformAlert.destructiveConfirm(
      'Delete Assignment',
      `Are you sure you want to delete the assignment for "${inspectionTitle}"?`,
      async () => {
        try {
          await assignmentService.deleteAssignment(assignmentId);
          loadAssignments();
          CrossPlatformAlert.alert('Success', 'Assignment deleted successfully');
        } catch (error) {
          console.error('❌ Error deleting assignment:', error);
          CrossPlatformAlert.alert('Error', 'Failed to delete assignment');
        }
      },
      () => {
        console.log('Delete assignment cancelled');
      }
    );
  };

  const handleAssignInspection = (inspectionId: string, title: string) => {
    setSelectedInspection({ id: inspectionId, title });
    setShowAssignForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusCounts = () => {
    return {
      assigned: assignments.filter(a => a.status === 'assigned').length,
      in_progress: assignments.filter(a => a.status === 'in_progress').length,
      completed: assignments.filter(a => a.status === 'completed').length,
      overdue: assignments.filter(a => isOverdue(a.due_date) && a.status !== 'completed').length,
    };
  };

  if (showAssignForm) {
    // If we have a preselected template, handle template assignment
    if (preselectedTemplate) {
      return (
        <InspectionAssignmentForm
          inspectionId={`template-${preselectedTemplate.id}`}
          inspectionTitle={`${preselectedTemplate.title} (From Template)`}
          assignedBy={currentUserId}
          isTemplate={true}
          templateData={preselectedTemplate}
          onAssignmentComplete={() => {
            setShowAssignForm(false);
            loadAssignments();
          }}
          onCancel={() => {
            setShowAssignForm(false);
          }}
        />
      );
    }
    
    // Regular inspection assignment
    if (selectedInspection) {
      return (
        <InspectionAssignmentForm
          inspectionId={selectedInspection.id}
          inspectionTitle={selectedInspection.title}
          assignedBy={currentUserId}
          onAssignmentComplete={() => {
            setShowAssignForm(false);
            setSelectedInspection(null);
            loadAssignments();
          }}
          onCancel={() => {
            setShowAssignForm(false);
            setSelectedInspection(null);
          }}
        />
      );
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading assignments...</Text>
      </View>
    );
  }

  const statusCounts = getStatusCounts();

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
            Assignment Manager
          </Text>
          <XStack gap="$2">
            {onCreateInspection && (
              <Button
                size="$3"
                backgroundColor={theme.colors.primary}
                onPress={onCreateInspection}
              >
                <XStack alignItems="center" gap="$2">
                  <Plus size={16} color="white" />
                  <Text style={{ color: 'white' }}>New Inspection</Text>
                </XStack>
              </Button>
            )}
          </XStack>
        </XStack>

        {/* Status Overview */}
        <Card
          backgroundColor={theme.colors.surface}
          borderColor={theme.colors.border}
          borderWidth={1}
          borderRadius={12}
          padding="$3"
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 12
          }}>
            Assignment Overview
          </Text>
          <XStack gap="$3" flexWrap="wrap">
            <YStack alignItems="center" gap="$1">
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: statusColors.assigned
              }}>
                {statusCounts.assigned}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary
              }}>
                Assigned
              </Text>
            </YStack>
            <YStack alignItems="center" gap="$1">
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: statusColors.in_progress
              }}>
                {statusCounts.in_progress}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary
              }}>
                In Progress
              </Text>
            </YStack>
            <YStack alignItems="center" gap="$1">
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: statusColors.completed
              }}>
                {statusCounts.completed}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary
              }}>
                Completed
              </Text>
            </YStack>
            <YStack alignItems="center" gap="$1">
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: statusColors.overdue
              }}>
                {statusCounts.overdue}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary
              }}>
                Overdue
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Assignments List */}
        {enrichedAssignments.length === 0 ? (
          <Card
            backgroundColor={theme.colors.surface}
            borderColor={theme.colors.border}
            borderWidth={1}
            borderRadius={12}
            padding="$4"
          >
            <YStack alignItems="center" gap="$3">
              <FileText size={48} color={theme.colors.textSecondary} />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                No Assignments Yet
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                textAlign: 'center'
              }}>
                Start by creating inspections and assigning them to inspectors.
              </Text>
              {onCreateInspection && (
                <Button
                  backgroundColor={theme.colors.primary}
                  onPress={onCreateInspection}
                  marginTop="$2"
                >
                  <XStack alignItems="center" gap="$2">
                    <Plus size={16} color="white" />
                    <Text style={{ color: 'white' }}>Create First Inspection</Text>
                  </XStack>
                </Button>
              )}
            </YStack>
          </Card>
        ) : (
          enrichedAssignments.map((assignment) => {
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
                          {assignment.template_creator_name && assignment.template_creator_name !== 'Unknown' && (
                            <Text style={{ color: theme.colors.textSecondary }}>
                              {' '}(by {assignment.template_creator_name})
                            </Text>
                          )}
                        </Text>
                      )}
                    </YStack>

                    <XStack gap="$2" alignItems="center">
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

                      {/* Actions */}
                      <TouchableOpacity
                        onPress={() => handleDeleteAssignment(assignment.id, assignment.inspection_title || `Inspection ${assignment.inspection_id}`)}
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </XStack>
                  </XStack>

                  {/* Assignment Info */}
                  <YStack gap="$2">
                    {/* Inspector */}
                    {assignment.inspector_profile && (
                      <XStack alignItems="center" gap="$2">
                        <User size={16} color={theme.colors.primary} />
                        <Text style={{
                          fontSize: 14,
                          color: theme.colors.text,
                          fontWeight: '600'
                        }}>
                          {assignment.inspector_profile.full_name}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary
                        }}>
                          ({assignment.inspector_profile.role})
                        </Text>
                      </XStack>
                    )}

                    {/* Due Date */}
                    {assignment.due_date && (
                      <XStack alignItems="center" gap="$2">
                      <Calendar size={16} color={isDue ? statusColors.overdue : theme.colors.textSecondary} />
                      <Text style={{
                        fontSize: 14,
                        color: isDue ? statusColors.overdue : theme.colors.textSecondary,
                        fontWeight: isDue ? '600' : 'normal'
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
                </YStack>
              </Card>
            );
          })
        )}
      </YStack>
    </ScrollView>
  );
}
