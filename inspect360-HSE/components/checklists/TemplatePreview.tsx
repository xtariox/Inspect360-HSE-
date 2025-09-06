import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { X, ArrowRight, FileText, MapPin, User } from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { InspectionTemplate, InspectionSection } from '../../types/inspection';
import ImagePickerComponent from '../ui/ImagePicker';

interface TemplatePreviewProps {
  template: InspectionTemplate | null;
  visible: boolean;
  onClose: () => void;
  onUseTemplate: (template: InspectionTemplate) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  visible,
  onClose,
  onUseTemplate
}) => {
  const { theme } = useAppTheme();
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    if (visible) {
      setCurrentSection(0);
    }
  }, [visible, template]);

  if (!template) return null;

  const sections = template.sections || [];

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderFieldPreview = (field: any) => {
    switch (field.type) {
      case 'boolean':
        return (
          <XStack gap="$3" marginTop="$2">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flex: 1
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  backgroundColor: 'transparent'
                }}
              />
              <Text style={{ marginLeft: 8, color: theme.colors.text }}>Yes</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flex: 1
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: theme.colors.error,
                  backgroundColor: 'transparent'
                }}
              />
              <Text style={{ marginLeft: 8, color: theme.colors.text }}>No</Text>
            </View>
          </XStack>
        );

      case 'select':
        return (
          <YStack gap="$1" marginTop="$2">
            {field.options?.slice(0, 2).map((option: string, index: number) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: index === 0 ? theme.colors.primary + '20' : theme.colors.surface,
                  borderColor: index === 0 ? theme.colors.primary : theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: index === 0 ? theme.colors.primary : 'transparent',
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                    marginRight: 12,
                  }}
                />
                <Text
                  style={{
                    color: index === 0 ? theme.colors.primary : theme.colors.text,
                    fontSize: 14,
                  }}
                >
                  {option}
                </Text>
              </View>
            ))}
            {(field.options?.length > 2) && (
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                +{field.options.length - 2} more options
              </Text>
            )}
          </YStack>
        );

      case 'text':
      case 'textarea':
        return (
          <View
            style={{
              marginTop: 8,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              height: field.type === 'textarea' ? 60 : 40,
            }}
          />
        );

      case 'date':
        return (
          <View
            style={{
              marginTop: 8,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: theme.colors.textSecondary }}>Select date</Text>
            <Text style={{ color: theme.colors.primary }}>📅</Text>
          </View>
        );

      case 'time':
        return (
          <View
            style={{
              marginTop: 8,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: theme.colors.textSecondary }}>Select time</Text>
            <Text style={{ color: theme.colors.primary }}>🕒</Text>
          </View>
        );

      case 'image':
        return (
          <ImagePickerComponent
            value={undefined}
            onImageSelected={() => {}}
            placeholder={field.placeholder || "Take photo or select from gallery"}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  const currentSectionData = sections[currentSection] as InspectionSection;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card
          backgroundColor={theme.colors.background}
          style={{
            width: isTablet ? '80%' : '95%',
            maxWidth: 600,
            maxHeight: '90%',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <XStack
            backgroundColor={theme.colors.surface}
            padding="$4"
            justifyContent="space-between"
            alignItems="center"
            borderBottomColor={theme.colors.border}
            borderBottomWidth={1}
          >
            <YStack>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                {template.title}
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                {template.description}
              </Text>
            </YStack>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </XStack>

          {/* Content */}
          <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ padding: 16 }}>
            {/* Section preview */}
            <Card backgroundColor={theme.colors.surface} padding="$4" marginBottom="$3">
              <YStack gap="$3">
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                  {currentSectionData?.title || 'Section Preview'}
                </Text>
                {currentSectionData?.description && (
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {currentSectionData.description}
                  </Text>
                )}
              </YStack>
            </Card>

            {/* Fields preview */}
            <Card backgroundColor={theme.colors.surface} padding="$4">
              <YStack gap="$4">
                {currentSectionData?.fields?.map((field, index) => (
                  <YStack key={index} gap="$2">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                      {field.label}
                      {field.required && (
                        <Text style={{ color: theme.colors.error }}> *</Text>
                      )}
                    </Text>
                    {renderFieldPreview(field)}
                  </YStack>
                ))}
              </YStack>
            </Card>
          </ScrollView>

          {/* Footer */}
          <XStack
            backgroundColor={theme.colors.surface}
            padding="$4"
            justifyContent="space-between"
            alignItems="center"
            borderTopColor={theme.colors.border}
            borderTopWidth={1}
          >
            <XStack gap="$3">
              <Button
                backgroundColor="transparent"
                borderColor={theme.colors.border}
                borderWidth={1}
                color={theme.colors.text}
                disabled={currentSection === 0}
                onPress={handlePreviousSection}
                opacity={currentSection === 0 ? 0.5 : 1}
                size="$3"
              >
                Previous
              </Button>
              <Button
                backgroundColor="transparent"
                borderColor={theme.colors.border}
                borderWidth={1}
                color={theme.colors.text}
                disabled={currentSection === sections.length - 1}
                onPress={handleNextSection}
                opacity={currentSection === sections.length - 1 ? 0.5 : 1}
                size="$3"
              >
                Next
              </Button>
            </XStack>

            <Button
              backgroundColor={theme.colors.primary}
              color="white"
              icon={<ArrowRight size={16} />}
              onPress={() => onUseTemplate(template)}
              size="$3"
            >
              Use Template
            </Button>
          </XStack>
        </Card>
      </View>
    </Modal>
  );
};

export default TemplatePreview;
