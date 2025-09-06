import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Eye,
  Play
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { assignmentService, InspectionAssignment } from '../services/assignmentService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const getPriorityColor = (priority: string, theme: any) => {
  switch (priority) {
    case 'urgent': return theme.colors.error;
    case 'high': return theme.colors.warning;
    case 'medium': return theme.colors.info;
    case 'low': return theme.colors.success;
    default: return theme.colors.textSecondary;
  }
};

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'completed': return theme.colors.success;
    case 'in_progress': return theme.colors.info;
    case 'overdue': return theme.colors.error;
    case 'assigned': return theme.colors.warning;
    default: return theme.colors.textSecondary;
  }
};

export default function InspectorDashboard() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useUser();
  const [assignments, setAssignments] = useState<InspectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAssignments();
    }
  }, [user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('📱 Inspector dashboard focused, refreshing data...');
        loadAssignments();
      }
    }, [user])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      loadAssignments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const loadAssignments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userAssignments = await assignmentService.getInspectorAssignments(user.id);
      setAssignments(userAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load your assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async (assignment: InspectionAssignment) => {
    try {
      // Update status to in_progress
      await assignmentService.updateAssignmentStatus(assignment.id, 'in_progress');
      
      // Refresh assignments to show updated status
      loadAssignments();
      
      // Navigate to inspection form
      (navigation as any).navigate('InspectionForm', { 
        assignmentId: assignment.id,
        inspectionId: assignment.inspection_id 
      });
      
      // Refresh assignments
      loadAssignments();
    } catch (error) {
      console.error('Error starting inspection:', error);
      Alert.alert('Error', 'Failed to start inspection. Please try again.');
    }
  };

  const getAssignmentStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const inProgress = assignments.filter(a => a.status === 'in_progress').length;
    const overdue = assignments.filter(a => a.status === 'overdue').length;
    const pending = assignments.filter(a => a.status === 'assigned').length;

    return { total, completed, inProgress, overdue, pending };
  };

  const stats = getAssignmentStats();

  if (!user) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary }}>Please log in to view your assignments.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <YStack gap="$4" paddingBottom="$8">
        {/* Header */}
        <YStack gap="$2">
          <Text style={{ 
            fontSize: isTablet ? 28 : 24, 
            fontWeight: 'bold', 
            color: theme.colors.text 
          }}>
            Inspector Dashboard
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: theme.colors.textSecondary 
          }}>
            Welcome back, {user.full_name}
          </Text>
        </YStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4">
            {/* Stats Cards */}
            <YStack gap="$3">
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Assignment Overview
              </Text>

              <XStack gap="$3" flexWrap="wrap">
                <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
                  <YStack alignItems="center" gap="$2">
                    <ClipboardList size={24} color={theme.colors.primary} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                      {stats.total}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      Total Assignments
                    </Text>
                  </YStack>
                </Card>

                <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
                  <YStack alignItems="center" gap="$2">
                    <CheckCircle size={24} color={theme.colors.success} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                      {stats.completed}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      Completed
                    </Text>
                  </YStack>
                </Card>

                <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
                  <YStack alignItems="center" gap="$2">
                    <Clock size={24} color={theme.colors.info} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                      {stats.inProgress}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      In Progress
                    </Text>
                  </YStack>
                </Card>

                <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
                  <YStack alignItems="center" gap="$2">
                    <AlertCircle size={24} color={theme.colors.error} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                      {stats.overdue}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      Overdue
                    </Text>
                  </YStack>
                </Card>
              </XStack>
            </YStack>

            {/* Assignments List */}
            <YStack gap="$3">
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Your Assignments
              </Text>

              {loading ? (
                <Card backgroundColor={theme.colors.surface} padding="$4">
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    Loading assignments...
                  </Text>
                </Card>
              ) : assignments.length === 0 ? (
                <Card backgroundColor={theme.colors.surface} padding="$4">
                  <YStack alignItems="center" gap="$2">
                    <ClipboardList size={48} color={theme.colors.textSecondary} />
                    <Text style={{ 
                      color: theme.colors.textSecondary, 
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: '500'
                    }}>
                      No assignments yet
                    </Text>
                    <Text style={{ 
                      color: theme.colors.textSecondary, 
                      textAlign: 'center',
                      fontSize: 14
                    }}>
                      Your manager will assign inspections to you
                    </Text>
                  </YStack>
                </Card>
              ) : (
                assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$3">
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack flex={1}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: 'bold', 
                            color: theme.colors.text 
                          }}>
                            Inspection #{assignment.inspection_id.slice(0, 8)}
                          </Text>
                          <Text style={{ 
                            fontSize: 13, 
                            color: theme.colors.textSecondary 
                          }}>
                            Assigned by {assignment.assigner_profile?.full_name}
                          </Text>
                        </YStack>

                        <XStack gap="$2" alignItems="center">
                          <View style={{
                            backgroundColor: getPriorityColor(assignment.priority, theme) + '20',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12
                          }}>
                            <Text style={{
                              fontSize: 11,
                              color: getPriorityColor(assignment.priority, theme),
                              fontWeight: '500'
                            }}>
                              {assignment.priority.toUpperCase()}
                            </Text>
                          </View>

                          <View style={{
                            backgroundColor: getStatusColor(assignment.status, theme) + '20',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12
                          }}>
                            <Text style={{
                              fontSize: 11,
                              color: getStatusColor(assignment.status, theme),
                              fontWeight: '500'
                            }}>
                              {assignment.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                        </XStack>
                      </XStack>

                      {assignment.notes && (
                        <Text style={{ 
                          fontSize: 14, 
                          color: theme.colors.text,
                          fontStyle: 'italic'
                        }}>
                          "{assignment.notes}"
                        </Text>
                      )}

                      <XStack gap="$3" alignItems="center" justifyContent="space-between">
                        <XStack alignItems="center" gap="$3">
                          <XStack alignItems="center" gap="$1">
                            <Calendar size={12} color={theme.colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 11, 
                              color: theme.colors.textSecondary 
                            }}>
                              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                            </Text>
                          </XStack>
                          {assignment.due_date && (
                            <XStack alignItems="center" gap="$1">
                              <AlertCircle size={12} color={theme.colors.warning} />
                              <Text style={{ 
                                fontSize: 11, 
                                color: theme.colors.warning 
                              }}>
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </Text>
                            </XStack>
                          )}
                        </XStack>
                        
                        <XStack gap="$2">
                          {assignment.status === 'assigned' && (
                            <Button
                              backgroundColor={theme.colors.primary}
                              color="white"
                              size="$2"
                              icon={<Play size={16} />}
                              onPress={() => handleStartInspection(assignment)}
                            >
                              Start
                            </Button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <Button
                              backgroundColor={theme.colors.info}
                              color="white"
                              size="$2"
                              icon={<Eye size={16} />}
                              onPress={() => {
                                (navigation as any).navigate('InspectionForm', { 
                                  assignmentId: assignment.id,
                                  inspectionId: assignment.inspection_id 
                                });
                              }}
                            >
                              Continue
                            </Button>
                          )}
                          {assignment.status === 'completed' && (
                            <Button
                              backgroundColor={theme.colors.backgroundSecondary}
                              borderColor={theme.colors.border}
                              borderWidth={1}
                              color={theme.colors.text}
                              size="$2"
                              icon={<Eye size={16} />}
                            >
                              View
                            </Button>
                          )}
                        </XStack>
                      </XStack>
                    </YStack>
                  </Card>
                ))
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </ScreenContainer>
  );
}
