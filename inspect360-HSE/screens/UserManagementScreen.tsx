import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
  User,
  Settings
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types/auth';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const getRoleColor = (role: string, theme: any) => {
  switch (role) {
    case 'admin': return theme.colors.error;
    case 'manager': return theme.colors.warning;
    case 'inspector': return theme.colors.info;
    default: return theme.colors.textSecondary;
  }
};

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'approved': return theme.colors.success;
    case 'pending': return theme.colors.warning;
    case 'rejected': return theme.colors.error;
    default: return theme.colors.textSecondary;
  }
};

export default function UserManagementScreen() {
  const { theme } = useAppTheme();
  const { user, canManageOthers } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    if (canManageOthers()) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', userId);

      if (error) throw error;
      
      Alert.alert('Success', 'User approved successfully!');
      loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user. Please try again.');
    }
  };

  const handleRejectUser = async (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_profiles')
                .update({ status: 'rejected' })
                .eq('id', userId);

              if (error) throw error;
              
              Alert.alert('Success', 'User rejected.');
              loadUsers();
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleChangeUserRole = async (userId: string, newRole: 'inspector' | 'manager' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      Alert.alert('Success', `User role updated to ${newRole}!`);
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role. Please try again.');
    }
  };

  const filteredUsers = users.filter(u => {
    if (selectedTab === 'pending') return u.status === 'pending';
    if (selectedTab === 'approved') return u.status === 'approved';
    return true;
  });

  const userStats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length
  };

  if (!canManageOthers()) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary }}>
            You don't have permission to access user management.
          </Text>
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
            User Management
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: theme.colors.textSecondary 
          }}>
            Approve new users and manage roles
          </Text>
        </YStack>

        {/* Stats Cards */}
        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
            <YStack alignItems="center" gap="$2">
              <Users size={24} color={theme.colors.primary} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                {userStats.total}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Total Users
              </Text>
            </YStack>
          </Card>

          <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
            <YStack alignItems="center" gap="$2">
              <Clock size={24} color={theme.colors.warning} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                {userStats.pending}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Pending
              </Text>
            </YStack>
          </Card>

          <Card flex={1} backgroundColor={theme.colors.surface} padding="$3">
            <YStack alignItems="center" gap="$2">
              <CheckCircle size={24} color={theme.colors.success} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                {userStats.approved}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Approved
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Filter Tabs */}
        <XStack gap="$2">
          {(['pending', 'approved', 'all'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={{
                backgroundColor: selectedTab === tab ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: selectedTab === tab ? theme.colors.primary : theme.colors.border
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: selectedTab === tab ? 'white' : theme.colors.text,
                textTransform: 'capitalize'
              }}>
                {tab} ({tab === 'pending' ? userStats.pending : tab === 'approved' ? userStats.approved : userStats.total})
              </Text>
            </TouchableOpacity>
          ))}
        </XStack>

        {/* Users List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$3">
            {loading ? (
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                  Loading users...
                </Text>
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card backgroundColor={theme.colors.surface} padding="$4">
                <YStack alignItems="center" gap="$2">
                  <Users size={48} color={theme.colors.textSecondary} />
                  <Text style={{ 
                    color: theme.colors.textSecondary, 
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '500'
                  }}>
                    No {selectedTab} users
                  </Text>
                </YStack>
              </Card>
            ) : (
              filteredUsers.map((userProfile) => (
                <Card
                  key={userProfile.id}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  padding="$4"
                >
                  <YStack gap="$3">
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: theme.colors.primary + '20',
                          padding: 12,
                          borderRadius: 25,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <User size={24} color={theme.colors.primary} />
                        </View>
                        
                        <YStack flex={1} gap="$1">
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: 'bold', 
                            color: theme.colors.text 
                          }}>
                            {userProfile.full_name}
                          </Text>
                          <XStack alignItems="center" gap="$2">
                            <Mail size={12} color={theme.colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 13, 
                              color: theme.colors.textSecondary 
                            }}>
                              {userProfile.email}
                            </Text>
                          </XStack>
                        </YStack>
                      </XStack>

                      <XStack gap="$2" alignItems="center">
                        <View style={{
                          backgroundColor: getRoleColor(userProfile.role, theme) + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12
                        }}>
                          <Text style={{
                            fontSize: 11,
                            color: getRoleColor(userProfile.role, theme),
                            fontWeight: '500'
                          }}>
                            {userProfile.role.toUpperCase()}
                          </Text>
                        </View>

                        <View style={{
                          backgroundColor: getStatusColor(userProfile.status, theme) + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12
                        }}>
                          <Text style={{
                            fontSize: 11,
                            color: getStatusColor(userProfile.status, theme),
                            fontWeight: '500'
                          }}>
                            {userProfile.status.toUpperCase()}
                          </Text>
                        </View>
                      </XStack>
                    </XStack>

                    <Text style={{ 
                      fontSize: 12, 
                      color: theme.colors.textSecondary 
                    }}>
                      Registered: {new Date(userProfile.created_at).toLocaleDateString()}
                      {userProfile.approved_at && ` • Approved: ${new Date(userProfile.approved_at).toLocaleDateString()}`}
                    </Text>

                    {/* Action Buttons */}
                    <XStack gap="$2" justifyContent="flex-end">
                      {userProfile.status === 'pending' && (
                        <>
                          <Button
                            backgroundColor={theme.colors.success}
                            color="white"
                            size="$2"
                            icon={<UserCheck size={16} />}
                            onPress={() => handleApproveUser(userProfile.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            backgroundColor={theme.colors.error}
                            color="white"
                            size="$2"
                            icon={<UserX size={16} />}
                            onPress={() => handleRejectUser(userProfile.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {userProfile.status === 'approved' && (
                        <Button
                          backgroundColor={theme.colors.backgroundSecondary}
                          borderColor={theme.colors.border}
                          borderWidth={1}
                          color={theme.colors.text}
                          size="$2"
                          icon={<Settings size={16} />}
                          onPress={() => {
                            Alert.alert(
                              'Change Role',
                              `Change role for ${userProfile.full_name}`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Inspector', onPress: () => handleChangeUserRole(userProfile.id, 'inspector') },
                                { text: 'Manager', onPress: () => handleChangeUserRole(userProfile.id, 'manager') },
                                ...(user?.role === 'admin' ? [{ text: 'Admin', onPress: () => handleChangeUserRole(userProfile.id, 'admin') }] : [])
                              ]
                            );
                          }}
                        >
                          Change Role
                        </Button>
                      )}
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </ScreenContainer>
  );
}
