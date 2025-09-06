import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  FileText,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Database
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { dashboardService, DashboardStats, RecentInspection, UpcomingTask } from '../services/dashboardService';
import { useUser } from '../contexts/UserContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useUser();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalInspections: 0,
    pendingInspections: 0,
    completedToday: 0,
    criticalIssues: 0,
    safetyScore: 0,
    lastInspection: null,
    totalTemplates: 0,
    activeInspectors: 0,
    completedThisMonth: 0,
    avgCompletionTime: 0
  });
  const [recentInspections, setRecentInspections] = useState<RecentInspection[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Home screen focused, refreshing dashboard data...');
      loadDashboardData();
    }, [])
  );

  // Auto-refresh every 60 seconds (dashboard data doesn't need to be as frequent)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      loadDashboardData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, recent, upcoming] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentInspections(),
        dashboardService.getUpcomingTasks()
      ]);
      
      setDashboardStats(stats);
      setRecentInspections(recent);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$4" paddingBottom="$8">
          {/* Header */}
          <YStack gap="$2" marginBottom="$4">
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: theme.colors.text 
            }}>
              HSE Dashboard
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: theme.colors.textSecondary 
            }}>
              Welcome back{user ? `, ${user.full_name}` : ''}! Here's your safety overview
            </Text>
            {dashboardStats.lastInspection && (
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.textSecondary 
              }}>
                Last inspection: {dashboardStats.lastInspection}
              </Text>
            )}
          </YStack>

          {loading ? (
            <Card backgroundColor={theme.colors.surface} padding="$4">
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                Loading dashboard data...
              </Text>
            </Card>
          ) : (
            <YStack gap="$4">
              {/* Quick Stats Grid */}
              <YStack gap="$3">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: theme.colors.text 
                }}>
                  Overview
                </Text>
                
                <XStack gap="$3" flexWrap="wrap">
                  {/* Total Inspections */}
                  <Card 
                    flex={1} 
                    minWidth="45%" 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$2" alignItems="center">
                      <Shield size={32} color={theme.colors.primary} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
                        {dashboardStats.totalInspections}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Total Inspections
                      </Text>
                    </YStack>
                  </Card>

                  {/* Pending Inspections */}
                  <Card 
                    flex={1} 
                    minWidth="45%" 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$2" alignItems="center">
                      <AlertTriangle size={32} color={theme.colors.warning} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
                        {dashboardStats.pendingInspections}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Pending
                      </Text>
                    </YStack>
                  </Card>

                  {/* Completed Today */}
                  <Card 
                    flex={1} 
                    minWidth="45%" 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$2" alignItems="center">
                      <CheckCircle size={32} color={theme.colors.success} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
                        {dashboardStats.completedToday}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Completed Today
                      </Text>
                    </YStack>
                  </Card>

                  {/* Safety Score */}
                  <Card 
                    flex={1} 
                    minWidth="45%" 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$2" alignItems="center">
                      <TrendingUp size={32} color={theme.colors.success} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
                        {dashboardStats.safetyScore}%
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Safety Score
                      </Text>
                    </YStack>
                  </Card>
                </XStack>
              </YStack>

              {/* Quick Actions */}
              <YStack gap="$3">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: theme.colors.text 
                }}>
                  Quick Actions
                </Text>
                
                <XStack gap="$3" flexWrap="wrap">
                  <Button 
                    flex={1}
                    backgroundColor={theme.colors.primary}
                    color="white"
                    icon={<FileText size={20} />}
                    minWidth="45%"
                    onPress={() => {
                      (navigation as any).navigate('Templates');
                    }}
                  >
                    New Inspection
                  </Button>
                  
                  <Button 
                    flex={1}
                    backgroundColor={theme.colors.secondary}
                    color="white"
                    icon={<Calendar size={20} />}
                    minWidth="45%"
                    onPress={() => {
                      (navigation as any).navigate('Assignments');
                    }}
                  >
                    View Assignments
                  </Button>
                </XStack>
              </YStack>

              {/* Recent Inspections */}
              <YStack gap="$3">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: theme.colors.text 
                }}>
                  Recent Inspections
                </Text>
                
                {recentInspections.length === 0 ? (
                  <Card 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <Text style={{ 
                      color: theme.colors.textSecondary,
                      textAlign: 'center'
                    }}>
                      No recent inspections found
                    </Text>
                  </Card>
                ) : (
                  recentInspections.map((inspection) => (
                    <TouchableOpacity key={inspection.id}>
                      <Card 
                        backgroundColor={theme.colors.surface}
                        borderColor={theme.colors.border}
                        padding="$4"
                      >
                        <XStack alignItems="center" justifyContent="space-between">
                          <YStack gap="$1" flex={1}>
                            <XStack alignItems="center" gap="$2">
                              <MapPin size={16} color={theme.colors.textSecondary} />
                              <Text style={{ 
                                fontSize: 16, 
                                fontWeight: '500', 
                                color: theme.colors.text 
                              }}>
                                {inspection.location}
                              </Text>
                            </XStack>
                            <Text style={{ 
                              fontSize: 14, 
                              color: theme.colors.text,
                              fontWeight: '500'
                            }}>
                              {inspection.title}
                            </Text>
                            <XStack alignItems="center" gap="$2">
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.textSecondary 
                              }}>
                                {inspection.date}
                              </Text>
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.textSecondary 
                              }}>
                                • {inspection.inspector}
                              </Text>
                            </XStack>
                          </YStack>
                          
                          <XStack gap="$2">
                            <View style={{
                              backgroundColor: 
                                inspection.status === 'completed' ? theme.colors.success + '20' :
                                inspection.status === 'pending' ? theme.colors.warning + '20' :
                                inspection.status === 'in-progress' ? theme.colors.info + '20' :
                                theme.colors.textSecondary + '20',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 8
                            }}>
                              <Text style={{ 
                                color: 
                                  inspection.status === 'completed' ? theme.colors.success :
                                  inspection.status === 'pending' ? theme.colors.warning :
                                  inspection.status === 'in-progress' ? theme.colors.info :
                                  theme.colors.textSecondary,
                                fontSize: 10, 
                                fontWeight: '500' 
                              }}>
                                {inspection.status.replace('-', ' ').toUpperCase()}
                              </Text>
                            </View>
                          </XStack>
                        </XStack>
                      </Card>
                    </TouchableOpacity>
                  ))
                )}
              </YStack>

              {/* Upcoming Tasks */}
              <YStack gap="$3">
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: theme.colors.text 
                }}>
                  Upcoming Tasks
                </Text>
                
                {upcomingTasks.length === 0 ? (
                  <Card 
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <Text style={{ 
                      color: theme.colors.textSecondary,
                      textAlign: 'center'
                    }}>
                      No upcoming tasks
                    </Text>
                  </Card>
                ) : (
                  upcomingTasks.map((task) => (
                    <Card 
                      key={task.id}
                      backgroundColor={theme.colors.surface}
                      borderColor={theme.colors.border}
                      padding="$4"
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack gap="$1" flex={1}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '500', 
                            color: theme.colors.text 
                          }}>
                            {task.title}
                          </Text>
                          <XStack alignItems="center" gap="$2">
                            <Clock size={12} color={theme.colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 14, 
                              color: theme.colors.textSecondary 
                            }}>
                              Due: {task.due}
                            </Text>
                            {task.assignedTo && (
                              <Text style={{ 
                                fontSize: 12, 
                                color: theme.colors.textSecondary 
                              }}>
                                • {task.assignedTo}
                              </Text>
                            )}
                          </XStack>
                        </YStack>
                        
                        <View style={{
                          backgroundColor: theme.colors.primaryLight,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8
                        }}>
                          <Text style={{ 
                            color: theme.colors.primary, 
                            fontSize: 10, 
                            fontWeight: '500' 
                          }}>
                            {task.type.toUpperCase()}
                          </Text>
                        </View>
                      </XStack>
                    </Card>
                  ))
                )}
              </YStack>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </ScreenContainer>
  );
}
