import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, TextInput } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  ArrowLeft,
  Camera,
  CheckCircle,
  X,
  Save,
  ArrowRight,
  FileText,
  ChevronDown
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useUser } from '../contexts/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { InspectionTemplate, InspectionSection, InspectionField } from '../types/inspection';
import { InspectionsService } from '../services/inspectionsService';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePickerComponent from '../components/ui/ImagePicker';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function InspectionFormScreen() {
  const { theme } = useAppTheme();
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Debug theme colors
  console.log('🎨 Theme colors debug:', {
    error: theme.colors.error,
    surface: theme.colors.surface,
    border: theme.colors.border,
    primary: theme.colors.primary,
    background: theme.colors.background,
    text: theme.colors.text
  });
  
  // Get template from navigation params
  const template = (route.params as any)?.template as InspectionTemplate;
  
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<{[key: string]: any}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Use template sections or fallback to default
  const inspectionSections = template?.sections || [
    {
      id: 1,
      title: 'General Information',
      description: 'Basic inspection details',
      fields: [
        { id: 'title', label: 'Inspection Title', type: 'text' as const, required: true, placeholder: 'Enter inspection title' },
        { id: 'location', label: 'Location/Area', type: 'text' as const, required: true, placeholder: 'Enter location or area' },
        { id: 'inspector', label: 'Inspector Name', type: 'text' as const, required: true, placeholder: 'Enter inspector name' },
        { id: 'date', label: 'Inspection Date', type: 'date' as const, required: true },
        { id: 'time', label: 'Inspection Time', type: 'time' as const, required: true }
      ]
    }
  ];

  // Validate and fix any malformed sections
  const validatedSections = inspectionSections.map(section => {
    if (!section.fields || !Array.isArray(section.fields)) {
      console.error('❌ Section has no fields or malformed fields:', section);
      return {
        ...section,
        fields: []
      };
    }
    
    const validatedFields = section.fields.map(field => {
      if (!field.type) {
        console.error('❌ Field missing type:', field);
        return {
          ...field,
          type: 'text' as const,
          placeholder: field.placeholder || 'Enter value'
        };
      }
      return {
        ...field,
        placeholder: field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`
      };
    });
    
    return {
      ...section,
      fields: validatedFields
    };
  });

  console.log('🔍 InspectionFormTemplated - Template data:', {
    templateId: template?.id,
    templateTitle: template?.title,
    sectionsCount: validatedSections?.length || 0,
    firstSectionFields: validatedSections?.[0]?.fields?.length || 0,
    fallbackUsed: !template?.sections,
    sampleFields: validatedSections?.[0]?.fields?.slice(0, 3)
  });

  // Initialize form data based on template
  useEffect(() => {
    const initialData: {[key: string]: any} = {};
    
    validatedSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'date') {
          initialData[field.id] = new Date().toISOString().split('T')[0];
        } else if (field.type === 'time') {
          initialData[field.id] = new Date().toTimeString().split(' ')[0].substring(0, 5);
        } else if (field.type === 'boolean') {
          initialData[field.id] = null; // Initialize as null for proper boolean comparison
        } else {
          initialData[field.id] = '';
        }
      });
    });

    console.log('📝 Initializing form data:', Object.keys(initialData));
    setFormData(initialData);
  }, [template]);  const renderField = (field: InspectionField) => {
    const value = formData[field.id];
    const hasError = errors[field.id];

    console.log('🔍 Rendering field:', {
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder,
      value: value,
      hasError: hasError
    });

    const updateFieldValue = (newValue: any) => {
      console.log('📝 Updating field value:', { 
        fieldId: field.id, 
        oldValue: formData[field.id],
        newValue, 
        newValueType: typeof newValue,
        oldValueType: typeof formData[field.id]
      });
      
      setFormData(prev => {
        const updated = { ...prev, [field.id]: newValue };
        console.log('🔄 FormData updated for field:', field.id, 'new state:', updated[field.id]);
        return updated;
      });
      
      if (hasError) {
        setErrors(prev => ({ ...prev, [field.id]: '' }));
      }
    };

    if (!field.type) {
      console.error('❌ Field missing type:', field);
      return (
        <YStack key={field.id} gap="$2">
          <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.error }}>
            Error: Field "{field.label}" missing type
          </Text>
        </YStack>
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <TextInput
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value || ''}
              onChangeText={updateFieldValue}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hasError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'textarea':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <TextInput
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value || ''}
              onChangeText={updateFieldValue}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hasError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'date':
      case 'time':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <DateTimePicker
              mode={field.type}
              value={value ? new Date(value) : new Date()}
              onChange={(_, selectedDate) => {
                const date = selectedDate || new Date();
                if (field.type === 'date') {
                  updateFieldValue(date.toISOString().split('T')[0]);
                } else if (field.type === 'time') {
                  updateFieldValue(date.toTimeString().split(' ')[0].substring(0, 5));
                }
              }}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hasError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
              }}
            />
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'number':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <TextInput
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value.toString()}
              onChangeText={(text) => updateFieldValue(Number(text) || 0)}
              keyboardType="numeric"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hasError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: theme.colors.text,
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'boolean':
        console.log('🔍 Boolean field debug:', { 
          fieldId: field.id, 
          value, 
          valueType: typeof value, 
          isTrue: value === true,
          isFalse: value === false,
          errorColor: theme.colors.error,
          surfaceColor: theme.colors.surface,
          borderColor: theme.colors.border,
          primaryColor: theme.colors.primary
        });
        
        const noButtonStyle = {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          backgroundColor: value === false ? theme.colors.error : theme.colors.surface,
          borderColor: value === false ? theme.colors.error : theme.colors.border,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flex: 1
        };
        
        console.log('🎨 No button style computed:', {
          fieldId: field.id,
          valueFalse: value === false,
          backgroundColor: noButtonStyle.backgroundColor,
          borderColor: noButtonStyle.borderColor,
          expectedErrorColor: theme.colors.error,
          actualBgColor: value === false ? 'error color' : 'surface color'
        });
        
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <XStack gap="$3">
              <TouchableOpacity
                onPress={() => {
                  console.log('✅ Yes button pressed for field:', field.id);
                  updateFieldValue(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: value === true ? theme.colors.primary : theme.colors.surface,
                  borderColor: value === true ? theme.colors.primary : theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flex: 1
                }}
              >
                <CheckCircle 
                  size={16} 
                  color={value === true ? 'white' : theme.colors.primary} 
                />
                <Text style={{ 
                  marginLeft: 8, 
                  color: value === true ? 'white' : theme.colors.primary,
                  fontWeight: value === true ? '600' : '500'
                }}>
                  Yes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  console.log('❌ No button pressed for field:', field.id, 'Setting to false');
                  console.log('🔄 Before update - current value:', value, 'type:', typeof value);
                  updateFieldValue(false);
                  // Log after a brief delay to see if state updated
                  setTimeout(() => {
                    console.log('⏰ After update delay - value should be false:', formData[field.id]);
                  }, 100);
                }}
                style={noButtonStyle}
              >
                <X 
                  size={16} 
                  color={value === false ? 'white' : theme.colors.error} 
                />
                <Text style={{ 
                  marginLeft: 8, 
                  color: value === false ? 'white' : theme.colors.error,
                  fontWeight: value === false ? '600' : '500'
                }}>
                  No
                </Text>
              </TouchableOpacity>
            </XStack>
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'select':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            
            {/* Check if this is a compliance rating field and add default options if needed */}
            {(() => {
              const isComplianceRating = field.label.toLowerCase().includes('compliance rating') || 
                                       field.label.toLowerCase().includes('overall compliance');
              const options = field.options && field.options.length > 0 ? field.options : 
                            isComplianceRating ? [
                              'Excellent (90-100%)',
                              'Good (75-89%)', 
                              'Fair (60-74%)',
                              'Poor (40-59%)',
                              'Critical (0-39%)'
                            ] : [];

              if (isComplianceRating && options.length > 0) {
                // Dropdown style for compliance rating
                return (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Select Compliance Rating',
                        '',
                        options.map(option => ({
                          text: option,
                          onPress: () => updateFieldValue(option)
                        })).concat([
                          { text: 'Cancel', onPress: () => {} }
                        ])
                      );
                    }}
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: hasError ? theme.colors.error : theme.colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: value ? theme.colors.text : theme.colors.textSecondary
                    }}>
                      {value || field.placeholder || 'Select compliance rating...'}
                    </Text>
                    <ChevronDown size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                );
              } else {
                // Regular radio button style for other select fields
                return (
                  <YStack gap="$1">
                    {options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => updateFieldValue(option)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: value === option ? theme.colors.primary + '20' : theme.colors.surface,
                          borderColor: value === option ? theme.colors.primary : theme.colors.border,
                          borderWidth: 1,
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                        }}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: value === option ? theme.colors.primary : 'transparent',
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                          marginRight: 12,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {value === option && (
                            <View style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: 'white'
                            }} />
                          )}
                        </View>
                        <Text style={{ 
                          color: value === option ? theme.colors.primary : theme.colors.text,
                          fontSize: 14,
                          fontWeight: value === option ? '600' : '400'
                        }}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </YStack>
                );
              }
            })()}
            
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      case 'image':
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
              {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
            </Text>
            <ImagePickerComponent
              value={formData[field.id] as string}
              onImageSelected={(uri) => {
                updateFieldValue(uri || '');
              }}
              required={field.required}
              placeholder={field.placeholder || "Take photo or select from gallery"}
            />
            {hasError && (
              <Text style={{ fontSize: 12, color: theme.colors.error }}>{hasError}</Text>
            )}
          </YStack>
        );

      default:
        console.error('❌ Unsupported field type:', field.type, 'for field:', field.label);
        return (
          <YStack key={field.id} gap="$2">
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.error }}>
              Unsupported field type: {field.type} for "{field.label}"
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              Please contact support if this issue persists.
            </Text>
          </YStack>
        );
    }
  };

  const validateSection = (sectionIndex: number) => {
    const section = validatedSections[sectionIndex];
    const newErrors: {[key: string]: string} = {};
    let hasErrors = false;

    section.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = `${field.label} is required`;
          hasErrors = true;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return !hasErrors;
  };

  const handleNextSection = () => {
    if (validateSection(currentSection)) {
      if (currentSection < validatedSections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSaveInspection = async () => {
    try {
      // Validate all sections
      let allValid = true;
      for (let i = 0; i < validatedSections.length; i++) {
        if (!validateSection(i)) {
          allValid = false;
        }
      }

      if (!allValid) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      // Convert form data to inspection data format
      const responses = Object.keys(formData).map(fieldId => ({
        fieldId,
        value: formData[fieldId],
        timestamp: new Date().toISOString()
      }));

      // Generate a proper UUID for the inspection
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const inspectionData = {
        id: generateUUID(),
        title: formData.title || `${template?.title} Inspection`,
        location: formData.location || 'Unknown Location',
        inspector: formData.inspector || user?.full_name || user?.email || 'Unknown Inspector',
        date: formData.date || new Date().toISOString().split('T')[0],
        time: formData.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        templateId: template?.id || 'default-template',
        template: template,
        status: 'completed' as const,
        priority: 'medium' as const,
        responses: responses,
        sections: template?.sections,
        photos: [],
        score: 0,
        issues: 0,
        categories: [template?.category || 'safety'],
        description: formData.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      // Save to database
      await InspectionsService.saveInspection(inspectionData);

      Alert.alert(
        'Success',
        'Inspection saved successfully to database!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving inspection:', error);
      Alert.alert(
        'Error',
        'Failed to save inspection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const currentSectionData = validatedSections[currentSection];

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <Card backgroundColor={theme.colors.surface} padding="$4" marginBottom="$3">
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <YStack flex={1}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                  {template ? template.title : 'New Inspection'}
                </Text>
                {template && (
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {template.description}
                  </Text>
                )}
              </YStack>
            </XStack>

            {/* Progress */}
            <View style={{ 
              backgroundColor: theme.colors.background, 
              borderRadius: 8, 
              padding: 2 
            }}>
              <View style={{
                backgroundColor: theme.colors.primary,
                height: 6,
                borderRadius: 3,
                width: `${((currentSection + 1) / validatedSections.length) * 100}%`
              }} />
            </View>
            
            <Text style={{ 
              fontSize: 12, 
              color: theme.colors.textSecondary, 
              textAlign: 'center' 
            }}>
              Section {currentSection + 1} of {validatedSections.length}
            </Text>
          </YStack>
        </Card>

        {/* Section Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <XStack gap="$2">
            {validatedSections.map((section, index) => (
              <TouchableOpacity
                key={section.id}
                onPress={() => setCurrentSection(index)}
              >
                <View style={{
                  backgroundColor: currentSection === index ? theme.colors.primary : theme.colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: currentSection === index ? theme.colors.primary : theme.colors.border
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: currentSection === index ? 'white' : theme.colors.text
                  }}>
                    {section.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>

        {/* Form Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Card backgroundColor={theme.colors.surface} padding="$4">
            <YStack gap="$4">
              <YStack gap="$2">
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                  {currentSectionData.title}
                </Text>
                {currentSectionData.description && (
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {currentSectionData.description}
                  </Text>
                )}
              </YStack>

              {/* Fields */}
              <YStack gap="$4">
                {currentSectionData.fields.map(renderField)}
              </YStack>
            </YStack>
          </Card>
        </ScrollView>

        {/* Footer Actions */}
        <Card backgroundColor={theme.colors.surface} padding="$4">
          <XStack gap="$3" justifyContent="space-between" alignItems="center">
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

            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              {currentSection + 1} / {validatedSections.length}
            </Text>

            {currentSection < validatedSections.length - 1 ? (
              <Button
                backgroundColor={theme.colors.primary}
                color="white"
                icon={<ArrowRight size={16} />}
                onPress={handleNextSection}
                size="$3"
              >
                Next
              </Button>
            ) : (
              <Button
                backgroundColor={theme.colors.primary}
                color="white"
                icon={<Save size={16} />}
                onPress={handleSaveInspection}
                size="$3"
              >
                Save Inspection
              </Button>
            )}
          </XStack>
        </Card>
      </View>
    </ScreenContainer>
  );
}
