import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Camera, Image as ImageIcon, Trash2, Upload } from '@tamagui/lucide-icons';
import { Card } from '@tamagui/card';
import { XStack, YStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { useAppTheme } from '../../themes';

interface ImagePickerComponentProps {
  value?: string;
  onImageSelected: (uri: string | null) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function ImagePickerComponent({
  value,
  onImageSelected,
  placeholder = "Take photo or select from gallery",
  required = false,
  readOnly = false
}: ImagePickerComponentProps) {
  console.log('🖼️ ImagePicker component rendered. Value:', value, 'Required:', required);
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    console.log('🔐 Requesting permissions...');
    try {
      // Request camera permissions
      console.log('🔐 Requesting camera permissions...');
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔐 Camera permission result:', cameraPermission);
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return false;
      }

      // Request media library permissions for saving photos
      if (Platform.OS !== 'web') {
        console.log('🔐 Requesting media library permissions...');
        const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
        console.log('🔐 Media library permission result:', mediaLibraryPermission);
        if (mediaLibraryPermission.status !== 'granted') {
          Alert.alert('Permission needed', 'Media library permission is required to save photos.');
          return false;
        }
      } else {
        console.log('🔐 Web platform - skipping media library permissions');
      }

      console.log('🔐 All permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  };

  const showImagePicker = () => {
    console.log('📸 ImagePicker clicked! Platform:', Platform.OS);
    if (Platform.OS === 'web') {
      // On web, directly open file picker since Alert doesn't work well
      console.log('📸 Opening web file picker directly...');
      openGallery();
    } else {
      // Mobile experience with Alert
      console.log('📸 Showing mobile image picker...');
      Alert.alert(
        'Select Image',
        'Choose how you want to add a photo',
        [
          {
            text: 'Camera',
            onPress: () => {
              console.log('📸 Camera selected');
              openCamera();
            },
          },
          {
            text: 'Gallery',
            onPress: () => {
              console.log('📸 Gallery selected');
              openGallery();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openGallery = async () => {
    console.log('📁 openGallery called');
    const hasPermission = await requestPermissions();
    console.log('📁 Permissions result:', hasPermission);
    if (!hasPermission) return;

    setLoading(true);
    console.log('📁 Launching image library...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📁 Image picker result:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('📁 Selected image URI:', imageUri);
        onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('❌ Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onImageSelected(null),
        },
      ]
    );
  };

  if (value) {
    return (
      <Card
        backgroundColor={theme.colors.surface}
        borderColor={theme.colors.border}
        borderWidth={1}
        borderRadius={12}
        padding="$3"
        style={{ opacity: readOnly ? 0.8 : 1 }}
      >
        <YStack gap="$3">
          <Image
            source={{ uri: value }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              backgroundColor: theme.colors.background,
            }}
            resizeMode="cover"
          />
          <XStack gap="$2" justifyContent="space-between">
            <Button
              flex={1}
              size="$3"
              backgroundColor={theme.colors.surface}
              borderColor={theme.colors.border}
              borderWidth={1}
              color={theme.colors.text}
              icon={<Camera size={16} />}
              onPress={showImagePicker}
              disabled={loading || readOnly}
            >
              Change Photo
            </Button>
            <Button
              size="$3"
              backgroundColor={theme.colors.error}
              color="white"
              icon={<Trash2 size={16} />}
              onPress={removeImage}
              disabled={loading || readOnly}
            >
              Remove
            </Button>
          </XStack>
        </YStack>
      </Card>
    );
  }

  return (
    <TouchableOpacity onPress={showImagePicker} disabled={loading || readOnly}>
      <Card
        backgroundColor={theme.colors.surface}
        borderColor={theme.colors.border}
        borderWidth={2}
        borderStyle="dashed"
        borderRadius={12}
        padding="$6"
        style={{ opacity: readOnly ? 0.6 : 1 }}
      >
        <YStack alignItems="center" gap="$3">
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={28} color={theme.colors.primary} />
          </View>
          
          <YStack alignItems="center" gap="$1">
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text,
                textAlign: 'center',
              }}
            >
              {loading ? 'Loading...' : 'Add Photo'}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {placeholder}
            </Text>
            {required && (
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.error,
                  fontStyle: 'italic',
                }}
              >
                * Required
              </Text>
            )}
          </YStack>

          <XStack gap="$2">
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: theme.colors.primary + '20',
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Camera size={14} color={theme.colors.primary} />
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.primary,
                  fontWeight: '500',
                }}
              >
                Camera
              </Text>
            </View>
            
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: theme.colors.info + '20',
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ImageIcon size={14} color={theme.colors.info} />
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.info,
                  fontWeight: '500',
                }}
              >
                Gallery
              </Text>
            </View>
          </XStack>
        </YStack>
      </Card>
    </TouchableOpacity>
  );
}
