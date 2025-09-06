import React from "react";
import { Text, View, Platform, Alert, TouchableOpacity } from "react-native";
import { Card } from "@tamagui/card";
import { Button } from "@tamagui/button";
import { YStack, XStack } from "@tamagui/stacks";
import { LogOut, User, Settings as SettingsIcon, Info } from "@tamagui/lucide-icons";
import ScreenContainer from '../components/ui/ScreenContainer';
import ThemeToggle from '../components/ui/themeToggle';
import { useAppTheme } from '../themes';
import { useUser } from '../contexts/UserContext';
import { CrossPlatformAlert } from '../utils/CrossPlatformAlert';

export default function SettingsScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const { user, logout } = useUser();
  
  // Show ThemeToggle on mobile, and on web for small screens (width < 768px)
  const showThemeToggle = Platform.OS !== 'web' ||
    (Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth < 768);

  const handleLogout = async () => {
    console.log('Settings - Logout button pressed');
    
    CrossPlatformAlert.confirm(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        console.log('Settings - Logout confirmed, calling logout...');
        try {
          await logout();
          console.log('Settings - Logout successful');
        } catch (error) {
          console.error('Logout error:', error);
          CrossPlatformAlert.alert('Error', 'Failed to logout. Please try again.');
        }
      }
    );
  };

  return (
    <ScreenContainer>
      <YStack gap="$4" padding="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: theme.colors.text 
          }}>
            Settings
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: theme.colors.textSecondary 
          }}>
            Manage your account and preferences
          </Text>
        </YStack>

        {/* User Profile Card */}
        {user && (
          <Card backgroundColor={theme.colors.surface} padding="$4">
            <YStack gap="$3">
              <XStack alignItems="center" gap="$3">
                <View style={{
                  backgroundColor: theme.colors.primary + '20',
                  padding: 12,
                  borderRadius: 8
                }}>
                  <User size={24} color={theme.colors.primary} />
                </View>
                <YStack flex={1}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    color: theme.colors.text 
                  }}>
                    {user.full_name}
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: theme.colors.textSecondary 
                  }}>
                    {user.email}
                  </Text>
                  <View style={{
                    backgroundColor: theme.colors.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: 'flex-start',
                    marginTop: 4
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: theme.colors.primary,
                      fontWeight: '500'
                    }}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Theme Settings */}
        {showThemeToggle && (
          <Card backgroundColor={theme.colors.surface} padding="$4">
            <YStack gap="$3">
              <XStack alignItems="center" gap="$3">
                <View style={{
                  backgroundColor: theme.colors.warning + '20',
                  padding: 12,
                  borderRadius: 8
                }}>
                  <SettingsIcon size={20} color={theme.colors.warning} />
                </View>
                <YStack flex={1}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500', 
                    color: theme.colors.text 
                  }}>
                    Appearance
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: theme.colors.textSecondary 
                  }}>
                    Choose your preferred theme
                  </Text>
                </YStack>
              </XStack>
              <ThemeToggle />
            </YStack>
          </Card>
        )}

        {/* App Information */}
        <Card backgroundColor={theme.colors.surface} padding="$4">
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <View style={{
                backgroundColor: theme.colors.info + '20',
                padding: 12,
                borderRadius: 8
              }}>
                <Info size={20} color={theme.colors.info} />
              </View>
              <YStack flex={1}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: theme.colors.text 
                }}>
                  About
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors.textSecondary 
                }}>
                  Inspect360 HSE v1.0.0
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: theme.colors.textSecondary,
                  marginTop: 4
                }}>
                  Health, Safety & Environment Inspection System
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Logout Button */}
        <Card backgroundColor={theme.colors.surface} padding="$4">
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 4
            }}
          >
            <View style={{
              backgroundColor: theme.colors.error + '20',
              padding: 12,
              borderRadius: 8
            }}>
              <LogOut size={20} color={theme.colors.error} />
            </View>
            <YStack flex={1}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: theme.colors.error 
              }}>
                Logout
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.textSecondary 
              }}>
                Sign out of your account
              </Text>
            </YStack>
          </TouchableOpacity>
        </Card>
      </YStack>
    </ScreenContainer>
  );
}