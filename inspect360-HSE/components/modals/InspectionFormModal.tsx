import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Modal } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import ImagePicker from '../ui/ImagePicker';
import { 
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Save
} from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { useUser } from '../../contexts/UserContext';
import { InspectionTemplate, InspectionSection, InspectionField } from '../../types/inspection';
import { DateTimeInput } from '../forms/DateTimeInput';
import { InspectionsService } from '../../services/inspectionsService';
import { TemplatesService } from '../../services/templatesService';
import assignmentService from '../../services/assignmentService';
import { CrossPlatformAlert } from '../../utils/CrossPlatformAlert';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

type Props = {
  visible: boolean;
  onClose: () => void;
  template?: InspectionTemplate;
  inspectionId?: string;
  assignmentId?: string;
  readOnly?: boolean;
};

export default function InspectionFormModal({ 
  visible, 
  onClose, 
  template, 
  inspectionId, 
  assignmentId, 
  readOnly = false 
}: Props) {
  const { theme } = useAppTheme();
  const { user } = useUser();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<{[key: string]: any}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loadedInspection, setLoadedInspection] = useState<any>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [sectionResponses, setSectionResponses] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Load existing inspection if inspectionId is provided
  useEffect(() => {
    const loadInspection = async () => {
      if (inspectionId && !template) {
        try {
          setLoadingInspection(true);
          console.log('🔍 Loading existing inspection:', inspectionId);
          
          const inspection = await InspectionsService.getInspectionById(inspectionId);
          if (inspection) {
            setLoadedInspection(inspection);
            console.log('✅ Loaded inspection:', inspection.title);
            
            // Pre-populate form data from existing inspection
            const initialData: {[key: string]: any} = {};
            if (inspection.responses) {
              inspection.responses.forEach((response: any) => {
                initialData[response.fieldId] = response.value;
              });
            }
            setSectionResponses(initialData);
          } else {
            Alert.alert('Error', 'Inspection not found.');
            onClose();
          }
        } catch (error) {
          console.error('❌ Error loading inspection:', error);
          Alert.alert('Error', 'Failed to load inspection.');
          onClose();
        } finally {
          setLoadingInspection(false);
        }
      }
    };

    if (visible) {
      loadInspection();
    }
  }, [inspectionId, template, visible, onClose]);

  // Auto-change status to 'in-progress' when inspector opens a pending inspection
  useEffect(() => {
    const updateStatusToInProgress = async () => {
      if (loadedInspection && 
          loadedInspection.status === 'pending' && 
          !readOnly && 
          user?.role === 'inspector') {
        try {
          console.log('🚀 Changing inspection status from pending to in-progress');
          
          const updatedInspection = {
            ...loadedInspection,
            status: 'in-progress' as const,
            updatedAt: new Date().toISOString()
          };
          
          await InspectionsService.saveInspection(updatedInspection);
          setLoadedInspection(updatedInspection);
          
          console.log('✅ Status updated to in-progress');
        } catch (error) {
          console.error('❌ Error updating status to in-progress:', error);
        }
      }
    };

    updateStatusToInProgress();
  }, [loadedInspection, readOnly, user]);

  // Use template sections with automatic field cleaning or loaded inspection template
  const inspectionSections = (() => {
    let templateSections;
    
    if (loadedInspection) {
      if (loadedInspection.template?.sections) {
        templateSections = loadedInspection.template.sections;
      } else if (loadedInspection.sections) {
        templateSections = loadedInspection.sections;
      } else {
        templateSections = [
          {
            id: 1,
            title: 'General Information',
            fields: [
              { id: 'title', label: 'Inspection Title', type: 'text' as const, required: true },
              { id: 'location', label: 'Location/Area', type: 'text' as const, required: true },
              { id: 'inspector', label: 'Inspector Name', type: 'text' as const, required: true },
              { id: 'date', label: 'Inspection Date', type: 'date' as const, required: true },
              { id: 'time', label: 'Inspection Time', type: 'time' as const, required: true }
            ]
          }
        ];
      }
    } else {
      templateSections = template?.sections || [
        {
          id: 1,
          title: 'General Information',
          fields: [
            { id: 'title', label: 'Inspection Title', type: 'text' as const, required: true },
            { id: 'location', label: 'Location/Area', type: 'text' as const, required: true },
            { id: 'inspector', label: 'Inspector Name', type: 'text' as const, required: true },
            { id: 'date', label: 'Inspection Date', type: 'date' as const, required: true },
            { id: 'time', label: 'Inspection Time', type: 'time' as const, required: true }
          ]
        }
      ];
    }

    // Clean and validate template sections
    const cleanedSections = templateSections.map((section, sectionIndex) => {
      console.log(`🧹 Cleaning section ${sectionIndex}: "${section.title}"`);
      
      if (!Array.isArray(section.fields)) {
        console.warn(`🔧 Section "${section.title}" fields is not an array, converting to empty array`);
        section.fields = [];
      }
      
      const originalFieldCount = section.fields.length;
      section.fields = section.fields.filter((field, fieldIndex) => {
        const isValid = field && 
                        typeof field === 'object' && 
                        field.id && 
                        field.label && 
                        field.type;
        
        if (!isValid) {
          console.warn(`🚫 Filtering out corrupted field ${fieldIndex} in section "${section.title}":`, field);
        }
        
        return isValid;
      });
      
      const cleanedFieldCount = section.fields.length;
      const removedFields = originalFieldCount - cleanedFieldCount;
      
      if (removedFields > 0) {
        console.warn(`🧹 Removed ${removedFields} corrupted fields from section "${section.title}"`);
      }
      
      console.log(`✅ Section "${section.title}" cleaned: ${cleanedFieldCount} valid fields`);
      
      return section;
    });

    console.log(`🎯 Template cleaning complete: ${cleanedSections.length} sections processed`);
    return cleanedSections;
  })();

  // Initialize form data when modal opens
  useEffect(() => {
    if (!visible) return;
    
    const initialData: {[key: string]: any} = {};
    
    inspectionSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'date') {
          initialData[field.id] = new Date().toISOString().split('T')[0];
        } else if (field.type === 'time') {
          initialData[field.id] = new Date().toTimeString().split(' ')[0].substring(0, 5);
        } else if (field.type === 'number') {
          initialData[field.id] = 0;
        } else {
          initialData[field.id] = '';
        }
      });
    });
    
    setSectionResponses(initialData);
  }, [visible, template]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentSection(0);
      setSectionResponses({});
      setPhotos([]);
      setShowValidationErrors(false);
      setLoadedInspection(null);
      setErrors({});
    }
  }, [visible]);

  const updateResponse = (fieldId: string, value: any) => {
    console.log('📝 InspectionFormModal - Updating response:', { 
      fieldId, 
      oldValue: sectionResponses[fieldId],
      newValue: value, 
      newValueType: typeof value,
      oldValueType: typeof sectionResponses[fieldId]
    });
    
    setSectionResponses(prev => {
      const updated = { ...prev, [fieldId]: value };
      console.log('🔄 InspectionFormModal - SectionResponses updated for field:', fieldId, 'new state:', updated[fieldId]);
      return updated;
    });
  };

  const handleSaveDraft = async () => {
    try {
      const generalInfoFields = inspectionSections[0].fields.filter(f => f.required);
      const missingGeneralInfo = generalInfoFields.some(field => 
        !sectionResponses[field.id] && sectionResponses[field.id] !== false
      );

      if (missingGeneralInfo) {
        Alert.alert(
          'Missing Information',
          'Please fill in the basic inspection details (title, location, inspector, date, time) before saving as draft.',
          [{ text: 'OK' }]
        );
        return;
      }

      const responses = Object.keys(sectionResponses).map(fieldId => ({
        fieldId,
        value: sectionResponses[fieldId],
        timestamp: new Date().toISOString()
      }));

      const draftData = {
        title: sectionResponses.title,
        location: sectionResponses.location,
        inspector: sectionResponses.inspector || user?.full_name || user?.email || 'Unknown Inspector',
        date: sectionResponses.date,
        time: sectionResponses.time,
        templateId: template?.id || 'default-safety',
        status: 'pending' as const,
        priority: 'medium' as const,
        responses: responses,
        photos: photos,
        issues: 0,
        categories: [template?.category || 'safety'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📝 About to save draft with data:', draftData);
      
      const result = await InspectionsService.saveDraft(draftData);
      
      console.log('✅ Draft saved successfully with result:', result);
      
      CrossPlatformAlert.alert(
        'Draft Saved',
        'Your inspection progress has been saved as a draft. You can continue later from where you left off.'
      );
      
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
      CrossPlatformAlert.alert(
        'Error',
        'Failed to save draft. Please try again.'
      );
    }
  };

  const handleSubmitInspection = async () => {
    try {
      console.log('🚀 handleSubmitInspection started');
      console.log('📋 Current sections:', inspectionSections.length);
      console.log('📝 Current responses:', sectionResponses);
      
      // Validate all sections
      let allSectionsValid = true;
      for (let i = 0; i < inspectionSections.length; i++) {
        const sectionData = inspectionSections[i];
        const requiredFields = sectionData.fields.filter(field => field.required);
        
        console.log(`🔍 Validating section ${i}: "${sectionData.title}" with ${requiredFields.length} required fields`);
        
        for (const field of requiredFields) {
          const fieldValue = sectionResponses[field.id];
          if (!fieldValue && fieldValue !== false && fieldValue !== 0) {
            console.log(`❌ Missing required field: ${field.id} (${field.label})`);
            allSectionsValid = false;
            break;
          } else {
            console.log(`✅ Field valid: ${field.id} = ${fieldValue}`);
          }
        }
        if (!allSectionsValid) break;
      }

      if (!allSectionsValid) {
        console.log('❌ Validation failed - showing alert');
        CrossPlatformAlert.alert(
          'Incomplete Inspection',
          'Please complete all required fields in all sections before submitting.'
        );
        return;
      }

      console.log('✅ All sections valid - proceeding to submit');
      CrossPlatformAlert.confirm(
        'Submit Inspection',
        'Are you sure you want to submit this inspection? This action cannot be undone.',
        async () => {
              try {
                console.log('🔄 User confirmed submission');
                
                // Create responses array dynamically from all section responses
                const responses = Object.keys(sectionResponses).map(fieldId => ({
                  fieldId,
                  value: sectionResponses[fieldId],
                  timestamp: new Date().toISOString()
                }));

                console.log('📤 Prepared responses:', responses);

                let finalInspection;

                // Update existing inspection instead of creating new one
                if (loadedInspection && inspectionId) {
                  console.log('🔄 InspectionFormModal - Updating existing inspection:', inspectionId);
                  
                  finalInspection = {
                    ...loadedInspection,
                    responses: responses,
                    photos: photos,
                    status: 'completed' as const,
                    updatedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    // Update basic fields from responses if they exist
                    title: sectionResponses.title || loadedInspection.title,
                    location: sectionResponses.location || loadedInspection.location,
                    inspector: sectionResponses.inspector || loadedInspection.inspector,
                    date: sectionResponses.date || loadedInspection.date,
                    time: sectionResponses.time || loadedInspection.time,
                    score: sectionResponses.overall_score || loadedInspection.score || 0,
                    issues: sectionResponses.critical_issues || loadedInspection.issues || 0,
                    description: sectionResponses.recommendations || loadedInspection.description || ''
                  };
                } else {
                  // Fallback: create new inspection if no existing one (shouldn't happen in this context)
                  console.warn('⚠️ No existing inspection found, creating new one');
                  
                  const generateUUID = () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      const r = Math.random() * 16 | 0;
                      const v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };

                  finalInspection = {
                    id: generateUUID(),
                    title: sectionResponses.title || 'Untitled Inspection',
                    location: sectionResponses.location || 'Unknown Location',
                    inspector: sectionResponses.inspector || user?.full_name || user?.email || 'Unknown Inspector',
                    date: sectionResponses.date || new Date().toISOString().split('T')[0],
                    time: sectionResponses.time || new Date().toLocaleTimeString(),
                    templateId: template?.id || loadedInspection?.templateId || 'default-safety',
                    status: 'completed' as const,
                    priority: 'medium' as const,
                    responses: responses,
                    photos: photos,
                    score: sectionResponses.overall_score || 0,
                    issues: sectionResponses.critical_issues || 0,
                    categories: [template?.category || 'safety'],
                    description: sectionResponses.recommendations || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString()
                  };
                }

                console.log('🔄 InspectionFormModal - Final inspection data to save:', {
                  id: finalInspection.id,
                  title: finalInspection.title,
                  status: finalInspection.status,
                  responsesCount: finalInspection.responses.length,
                  templateId: finalInspection.templateId,
                  userId: user?.id
                });

                // Add timeout to the save operation to prevent hanging
                console.log('⏰ Starting inspection save with 30-second timeout...');
                const savePromise = InspectionsService.saveInspection(finalInspection);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000)
                );
                
                await Promise.race([savePromise, timeoutPromise]);
                console.log('✅ Inspection saved to Supabase successfully');
                
                // Update assignment status to completed if this inspection was assigned
                if (assignmentId) {
                  try {
                    console.log('🔄 InspectionFormModal - Updating assignment status to completed:', assignmentId);
                    
                    // Add timeout for assignment update too
                    const assignmentUpdatePromise = assignmentService.updateAssignmentStatus(assignmentId, 'completed');
                    const assignmentTimeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Assignment update timed out after 10 seconds')), 10000)
                    );
                    
                    await Promise.race([assignmentUpdatePromise, assignmentTimeoutPromise]);
                    console.log('✅ Assignment status updated to completed');
                  } catch (assignmentError) {
                    console.error('❌ Error updating assignment status:', assignmentError);
                    // Don't fail the whole operation if assignment update fails
                    // Show a warning but continue
                    console.warn('⚠️ Assignment status update failed, but inspection was saved successfully');
                  }
                } else {
                  console.log('ℹ️ No assignment ID provided, skipping assignment status update');
                }
                
                console.log('✅ Inspection submitted successfully - showing success alert');
                CrossPlatformAlert.alert(
                  'Success', 
                  'Inspection submitted successfully! Your inspection has been completed and saved.'
                );
                
                // Close modal immediately after showing success message
                console.log('🚪 Closing modal after successful submission');
                setTimeout(() => {
                  onClose();
                }, 100); // Small delay to ensure alert is shown
                
              } catch (error) {
                console.error('❌ Error submitting inspection:', error);
                console.error('❌ Error details:', {
                  message: error?.message,
                  stack: error?.stack,
                  name: error?.name,
                  cause: error?.cause
                });
                
                CrossPlatformAlert.alert(
                  'Error',
                  `Failed to submit inspection: ${error?.message || 'Unknown error'}. Please try again.`
                );
              }
            }
        );
    } catch (error) {
      console.error('Error validating inspection:', error);
      CrossPlatformAlert.alert(
        'Error',
        'An error occurred while validating the inspection.'
      );
    }
  };

  const validateSection = () => {
    console.log('🔍 validateSection called');
    const currentSectionData = inspectionSections[currentSection];
    const requiredFields = currentSectionData.fields.filter(field => field.required);
    
    console.log(`🔍 Validating section "${currentSectionData.title}" with ${requiredFields.length} required fields`);
    
    for (const field of requiredFields) {
      const fieldValue = sectionResponses[field.id];
      console.log(`🔍 Checking field "${field.label}" (${field.id}): ${fieldValue}`);
      
      // More robust validation for different field types
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        console.log(`❌ Field "${field.label}" is empty or undefined`);
        return false;
      }
    }
    
    console.log('✅ Section validation passed');
    return true;
  };

  const isFieldCompleted = (field: any) => {
    const value = sectionResponses[field.id];
    if (!field.required) return true;
    return value !== undefined && value !== null && value !== '';
  };

  const getFieldBorderColor = (field: any) => {
    if (!field.required) return theme.colors.border;
    
    if (showValidationErrors && !isFieldCompleted(field)) {
      return theme.colors.error;
    }
    
    return isFieldCompleted(field) ? theme.colors.success : theme.colors.border;
  };

  const renderField = (field: any) => {
    if (!field.type) {
      return (
        <View style={{
          backgroundColor: theme.colors.error + '20',
          borderColor: theme.colors.error,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12
        }}>
          <Text style={{ color: theme.colors.error }}>
            Error: Field "{field.label}" is missing type definition
          </Text>
        </View>
      );
    }
    
    const value = field.type === 'boolean' 
      ? sectionResponses[field.id] 
      : sectionResponses[field.id] || '';

    switch (field.type) {
      case 'date':
      case 'time':
        return (
          <DateTimeInput
            field={field}
            value={value}
            onChange={(newValue: any) => updateResponse(field.id, newValue)}
            showValidation={showValidationErrors}
            readOnly={readOnly}
            theme={theme}
            isTablet={isTablet}
          />
        );

      case 'text':
      case 'number':
        return (
          <TextInput
            placeholder={field.label}
            value={value}
            onChangeText={(text: string) => updateResponse(field.id, text)}
            editable={!readOnly}
            style={{
              backgroundColor: readOnly ? theme.colors.background : theme.colors.surface,
              borderColor: getFieldBorderColor(field),
              borderWidth: 1,
              borderRadius: 8,
              padding: isTablet ? 16 : 12,
              fontSize: isTablet ? 16 : 14,
              color: readOnly ? theme.colors.textSecondary : theme.colors.text,
              minHeight: isTablet ? 48 : 40,
            }}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            placeholderTextColor={theme.colors.textSecondary}
          />
        );

      case 'textarea':
        return (
          <TextInput
            placeholder={field.label}
            value={String(value)}
            onChangeText={(text: string) => updateResponse(field.id, text)}
            editable={!readOnly}
            style={{
              backgroundColor: readOnly ? theme.colors.background : theme.colors.surface,
              borderColor: getFieldBorderColor(field),
              borderWidth: 1,
              borderRadius: 8,
              padding: isTablet ? 16 : 12,
              fontSize: isTablet ? 16 : 14,
              color: readOnly ? theme.colors.textSecondary : theme.colors.text,
              minHeight: isTablet ? 120 : 100,
              textAlignVertical: 'top',
            }}
            multiline
            numberOfLines={isTablet ? 6 : 4}
            placeholderTextColor={theme.colors.textSecondary}
          />
        );

      case 'boolean':        
        return (
          <XStack gap="$3" justifyContent={isTablet ? "flex-start" : "space-between"}>
            <TouchableOpacity
              onPress={() => {
                if (!readOnly) {
                  updateResponse(field.id, true);
                }
              }}
              style={{ flex: isTablet ? 0 : 1, minWidth: isTablet ? 120 : undefined }}
              disabled={readOnly}
            >
              <View style={{
                backgroundColor: value === true ? theme.colors.success : theme.colors.surface,
                borderColor: value === true ? theme.colors.success : theme.colors.border,
                borderWidth: 2,
                padding: isTablet ? 16 : 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: readOnly ? 0.6 : 1
              }}>
                <CheckCircle size={20} color={value === true ? 'white' : theme.colors.textSecondary} />
                <Text style={{
                  color: value === true ? 'white' : theme.colors.text,
                  fontWeight: '500',
                  fontSize: isTablet ? 16 : 14
                }}>
                  Yes
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (!readOnly) {
                  updateResponse(field.id, false);
                }
              }}
              style={{ flex: isTablet ? 0 : 1, minWidth: isTablet ? 120 : undefined }}
              disabled={readOnly}
            >
              <View style={{
                backgroundColor: value === false ? theme.colors.error : theme.colors.surface,
                borderColor: value === false ? theme.colors.error : theme.colors.border,
                borderWidth: 2,
                padding: isTablet ? 16 : 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: readOnly ? 0.6 : 1
              }}>
                <X size={20} color={value === false ? 'white' : theme.colors.textSecondary} />
                <Text style={{
                  color: value === false ? 'white' : theme.colors.text,
                  fontWeight: '500',
                  fontSize: isTablet ? 16 : 14
                }}>
                  No
                </Text>
              </View>
            </TouchableOpacity>
          </XStack>
        );

      case 'image':
        return (
          <ImagePicker
            value={value}
            onImageSelected={(uri: string | null) => updateResponse(field.id, uri || '')}
            placeholder={field.placeholder || field.label}
            required={field.required}
            readOnly={readOnly}
          />
        );

      case 'select':
        const options = field.options || [];
        return (
          <View style={{
            backgroundColor: readOnly ? theme.colors.background : theme.colors.background,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: 8,
            overflow: 'hidden',
            opacity: readOnly ? 0.6 : 1
          }}>
            {options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (!readOnly) {
                    updateResponse(field.id, option);
                  }
                }}
                disabled={readOnly}
                style={{
                  padding: 12,
                  backgroundColor: value === option ? theme.colors.primary + '20' : 'transparent',
                  borderBottomWidth: index < options.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{
                  color: value === option ? theme.colors.primary : theme.colors.text,
                  fontWeight: value === option ? '600' : 'normal',
                  fontSize: 16
                }}>
                  {option}
                </Text>
                {value === option && (
                  <CheckCircle size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            {options.length === 0 && (
              <View style={{ padding: 12 }}>
                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                  No options available for this field
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return (
          <View style={{
            backgroundColor: '#FFA500' + '20',
            borderColor: '#FFA500',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12
          }}>
            <Text style={{ color: '#FFA500' }}>
              Warning: Unknown field type "{field.type}" for field "{field.label}"
            </Text>
          </View>
        );
    }
  };

  const currentSectionData = inspectionSections[currentSection];
  const isLastSection = currentSection === inspectionSections.length - 1;
  const isFirstSection = currentSection === 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        {loadingInspection ? (
          <Card 
            backgroundColor={theme.colors.surface} 
            padding="$4" 
            width="100%" 
            maxWidth={isTablet ? 500 : undefined} 
            borderRadius={12}
          >
            <YStack alignItems="center" gap="$3">
              <Text style={{ 
                fontSize: 16, 
                color: theme.colors.text,
                textAlign: 'center'
              }}>
                Loading inspection details...
              </Text>
            </YStack>
          </Card>
        ) : (
          <Card 
            backgroundColor={theme.colors.surface} 
            padding="$4" 
            width="100%" 
            maxWidth={isTablet ? 600 : undefined} 
            maxHeight="85%"
            borderRadius={12}
          >
            <YStack gap="$4" height="100%">
              {/* Header */}
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$3" flex={1}>
                  <TouchableOpacity onPress={onClose}>
                    <X size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <YStack flex={1}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: theme.colors.text 
                    }}>
                      {readOnly ? 'View Inspection' : 'Fill Inspection'}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: theme.colors.textSecondary 
                    }}>
                      Section {currentSection + 1} of {inspectionSections.length}
                    </Text>
                  </YStack>
                  
                  {!readOnly && (
                    <Button
                      backgroundColor={theme.colors.surface}
                      borderColor={theme.colors.border}
                      borderWidth={1}
                      icon={<Save size={16} color={theme.colors.text} />}
                      color={theme.colors.text}
                      onPress={handleSaveDraft}
                      size="$3"
                    >
                      {isTablet ? 'Save Draft' : 'Draft'}
                    </Button>
                  )}
                </XStack>
              </XStack>

              {/* Progress Bar */}
              <View style={{
                backgroundColor: theme.colors.border,
                height: 4,
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <View style={{
                  backgroundColor: theme.colors.primary,
                  height: '100%',
                  width: `${((currentSection + 1) / inspectionSections.length) * 100}%`,
                  borderRadius: 2
                }} />
              </View>

              {/* Section Content */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <YStack gap="$4" paddingBottom="$4">
                  <YStack gap="$2">
                    <Text style={{ 
                      fontSize: isTablet ? 24 : 18, 
                      fontWeight: '600', 
                      color: theme.colors.text 
                    }}>
                      {currentSectionData.title}
                    </Text>
                    
                    {/* Validation Message */}
                    <View style={{
                      backgroundColor: theme.colors.info + '15',
                      borderLeftWidth: 3,
                      borderLeftColor: theme.colors.info,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginVertical: 4
                    }}>
                      <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors.info,
                        fontWeight: '500'
                      }}>
                        ℹ️ Complete all required fields to continue to the next section
                      </Text>
                    </View>
                  </YStack>

                  {/* Fields */}
                  {currentSectionData.fields && Array.isArray(currentSectionData.fields) ? (
                    currentSectionData.fields
                      .filter((field) => {
                        const isValid = field && 
                                      typeof field === 'object' && 
                                      field.id && 
                                      field.label && 
                                      field.type;
                        
                        if (!isValid) {
                          console.warn('🚨 Filtering out corrupted field:', field);
                        }
                        
                        return isValid;
                      })
                      .map((field) => (
                      <YStack key={field.id} gap="$2">
                        <XStack alignItems="center" justifyContent="space-between">
                          <Text style={{ 
                            fontSize: isTablet ? 18 : 16, 
                            fontWeight: '500', 
                            color: showValidationErrors && field.required && !isFieldCompleted(field) 
                              ? theme.colors.error 
                              : theme.colors.text 
                          }}>
                            {field.label}
                            {field.required && <Text style={{ color: theme.colors.error }}> *</Text>}
                            {showValidationErrors && field.required && !isFieldCompleted(field) && (
                              <Text style={{ color: theme.colors.error, fontSize: 12 }}> (Required)</Text>
                            )}
                          </Text>
                          {field.required && isFieldCompleted(field) && (
                          <CheckCircle size={20} color={theme.colors.success} />
                        )}
                      </XStack>
                      {renderField(field)}
                    </YStack>
                  ))
                  ) : (
                    <View style={{
                      backgroundColor: theme.colors.error + '20',
                      borderColor: theme.colors.error,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 16
                    }}>
                      <Text style={{ color: theme.colors.error, fontWeight: '500' }}>
                        ⚠️ Template Error: Section Field Issues
                      </Text>
                      <Text style={{ color: theme.colors.text, marginTop: 4 }}>
                        Section "{currentSectionData.title}" has field configuration problems.
                      </Text>
                    </View>
                  )}

                  {/* Photo Section */}
                  {currentSection > 0 && (
                    <YStack gap="$3">
                      <Text style={{ 
                        fontSize: isTablet ? 18 : 16, 
                        fontWeight: '500', 
                        color: theme.colors.text 
                      }}>
                        Photos (Optional)
                      </Text>
                      
                      <TouchableOpacity onPress={() => Alert.alert('Camera', 'Camera functionality would be implemented here')}>
                        <View style={{
                          backgroundColor: theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          padding: isTablet ? 32 : 24,
                          borderRadius: 8,
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <Camera size={isTablet ? 40 : 32} color={theme.colors.textSecondary} />
                          <Text style={{ 
                            color: theme.colors.textSecondary,
                            fontSize: isTablet ? 16 : 14
                          }}>
                            Tap to add photos
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </YStack>
                  )}
                </YStack>
              </ScrollView>

              {/* Navigation Buttons */}
              <XStack gap="$3" paddingTop="$2">
                {!isFirstSection && (
                  <Button
                    flex={1}
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    borderWidth={1}
                    color={theme.colors.text}
                    onPress={() => {
                      setShowValidationErrors(false);
                      setCurrentSection(prev => prev - 1);
                    }}
                    size="$3"
                  >
                    Previous
                  </Button>
                )}
                
                <Button
                  flex={1}
                  backgroundColor={readOnly ? theme.colors.surface : theme.colors.primary}
                  color={readOnly ? theme.colors.textSecondary : "white"}
                  size="$3"
                  disabled={readOnly}
                  onPress={() => {
                    console.log('🔘 Submit button clicked');
                    console.log('🔘 readOnly:', readOnly);
                    console.log('🔘 isLastSection:', isLastSection);
                    console.log('🔘 currentSection:', currentSection);
                    console.log('🔘 inspectionSections.length:', inspectionSections.length);
                    
                    if (readOnly) return;
                    
                    if (!validateSection()) {
                      console.log('❌ Section validation failed');
                      setShowValidationErrors(true);
                      CrossPlatformAlert.alert('Missing Required Fields', 'Please fill in all required fields (marked in red) before continuing.');
                      return;
                    }
                    
                    console.log('✅ Section validation passed');
                    setShowValidationErrors(false);
                    
                    if (isLastSection) {
                      console.log('🚀 Calling handleSubmitInspection...');
                      handleSubmitInspection();
                    } else {
                      console.log('➡️ Moving to next section');
                      setCurrentSection(prev => prev + 1);
                    }
                  }}
                >
                  {readOnly ? 'View Only' : (isLastSection ? 'Submit Inspection' : 'Next Section')}
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}
      </View>
    </Modal>
  );
}
