import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { YStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { Input } from '@tamagui/input';
import { Card } from '@tamagui/card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginBackground from '../../components/auth/LoginBackground';
import { useAppTheme } from '../../themes';
import authService from '../../services/authService';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;


// AuthScreen handles both login and registration in a single screen.
// Accept navigation prop from React Navigation
export default function AuthScreen({ navigation }: any) {
  // Theme and color variables from your custom hook
  const { theme, themeName } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Form state: email, password, and fullName (for registration)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  // Toggle between login and register mode
  const [isLogin, setIsLogin] = useState(true);
  // Error and success messages for user feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle input changes for all fields
  const handleInput = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Handle form submission for login or registration
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (isLogin) {
        // Attempt login
        const result = await authService.login({ email: form.email, password: form.password });
        // If the result has an error property, show it
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          setError((result.error as any).message || 'Login failed. Please check your credentials.');
        } else {
          setSuccess('Login successful!');
          // Don't manually navigate - let the auth state change handle navigation automatically
          // The UserContext will detect the SIGNED_IN event and the root navigator will handle routing
        }
      } else {
        // Attempt registration
        const result = await authService.register({ email: form.email, password: form.password, fullName: form.fullName });
        // If the result has an error property, show it
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          setError((result.error as any).message || 'Registration failed.');
        } else {
          setSuccess(result?.message || 'Registration successful! Please wait for admin approval before logging in.');
          // Clear the form after successful registration
          setForm({ email: '', password: '', fullName: '' });
          // Switch to login mode after successful registration
          setIsLogin(true);
          // Do NOT navigate to App - user needs admin approval first
        }
      }
    } catch (err: any) {
      // Catch and display any thrown errors
      setError(err?.message || (isLogin ? 'Login failed. Please try again.' : 'Registration failed. Please try again.'));
    }
  };

  // Render the UI
  return (
    <LoginBackground
      blurRadius={4}
      overlayColor={`rgba(${
        themeName === 'hse' ? '51, 161, 44' : themeName === 'dark' ? '18, 18, 18' : '0, 0, 0'
      }, ${themeName === 'dark' ? '0.6' : '0.4'})`}
      overlayOpacity={0.6}
      image={require('../../assets/icons/Gemini_Generated_Image.png')}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: isTablet ? 40 : 20,
        paddingTop: Platform.OS === 'web' ? 20 : Math.max(insets.top, 20),
        paddingBottom: Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 20),
        width: '100%',
        maxWidth: isTablet ? 500 : '100%',
      }}>
        {/* App Title and Subtitle */}
        <View style={{ 
          alignItems: 'center', 
          marginBottom: isTablet ? 40 : 30,
          width: '100%'
        }}>
          <Text style={{
            fontSize: isTablet ? 32 : 28,
            fontWeight: 'bold',
            color: themeName === 'dark' ? theme.colors.primaryLight : theme.colors.primaryDark,
            textAlign: 'center',
          }}>
            Inspect360 HSE
          </Text>
          <Text style={{
            fontSize: isTablet ? 18 : 16,
            color: themeName === 'dark' ? theme.colors.primary : theme.colors.primaryLight,
            textAlign: 'center',
            marginTop: 8,
          }}>
            Health, Safety & Environment
          </Text>
        </View>

        {/* Main Card with Form */}
        <Card style={{ 
          ...theme.components.Card, 
          padding: isTablet ? 32 : 24, 
          borderRadius: 12, 
          width: '100%',
          maxWidth: isTablet ? 400 : '100%'
        }}>
          {/*  
          // backgroundColor={theme.colors.surface}
          // padding={24}
          // borderRadius={12}
          // width="100%"
          // borderColor={theme.colors.border}
          // shadowColor={theme.colors.shadow}
          // shadowOffset={{ width: 0, height: 4 }}
          // shadowOpacity={0.1}
          // shadowRadius={8}
          // elevation={4}}
          {/* Error message (red) */}
          {error && (
            <View style={{ marginBottom: 12, backgroundColor: '#ffeaea', borderRadius: 6, padding: 10 }}>
              <Text style={{ color: '#d32f2f', fontSize: 15, textAlign: 'center' }}>{error}</Text>
            </View>
          )}
          {/* Success message (green) */}
          {success && (
            <View style={{ marginBottom: 12, backgroundColor: '#eaffea', borderRadius: 6, padding: 10 }}>
              <Text style={{ color: '#2e7d32', fontSize: 15, textAlign: 'center' }}>{success}</Text>
            </View>
          )}

          {/* Registration: Full Name field */}
          {!isLogin && (
            <Input
              placeholder="Full Name"
              size="$4"
              marginBottom={16}
              backgroundColor={theme.colors.background}
              borderColor={theme.colors.border}
              color={theme.colors.text}
              value={form.fullName}
              onChange={e => handleInput('fullName', (e.target as HTMLInputElement).value)}
              focusStyle={{ borderColor: theme.colors.primary }}
            />
          )}

          {/* Email field (shared) */}
          <Input
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            size="$4"
            marginBottom={16}
            backgroundColor={theme.colors.background}
            borderColor={theme.colors.border}
            color={theme.colors.text}
            value={form.email}
            onChange={e => handleInput('email', (e.target as HTMLInputElement).value)}
            focusStyle={{ borderColor: theme.colors.primary }}
          />

          {/* Password field (shared) */}
          <Input
            placeholder="Enter your password"
            secureTextEntry
            size="$4"
            marginBottom={16}
            backgroundColor={theme.colors.background}
            borderColor={theme.colors.border}
            color={theme.colors.text}
            value={form.password}
            onChange={e => handleInput('password', (e.target as HTMLInputElement).value)}
            focusStyle={{ borderColor: theme.colors.primary }}
          />

          {/* Submit button: Login or Register */}
          <Button
            onPress={handleSubmit}
            width="100%"
            backgroundColor={theme.colors.primary}
            color="white"
            size="$4"
            marginTop={8}
            pressStyle={{ backgroundColor: theme.colors.primaryDark }}
          >
            {isLogin ? 'Login' : 'Register'}
          </Button>

          {/* Toggle between Login and Register */}
          <TouchableOpacity
            style={{ marginTop: 16, alignSelf: 'center' }}
            onPress={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 14 }}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </LoginBackground>
  );
}