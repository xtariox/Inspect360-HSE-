import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import ImagePicker from '../components/ui/ImagePicker';
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
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useUser } from '../contexts/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { InspectionTemplate, InspectionSection, InspectionField } from '../types/inspection';
import { DateTimeInput } from '../components/forms/DateTimeInput';
import { InspectionsService } from '../services/inspectionsService';
import { TemplatesService } from '../services/templatesService';
import { CrossPlatformAlert } from '../utils/CrossPlatformAlert';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

// const exportInspectionAsPDF = async (inspection) => {
//   try {
//     const htmlContent = `
//       <html>
//         <head>
//           <style>
//             body { font-family: sans-serif; padding: 24px; }
//             h1 { color: #333; font-size: 20px; }
//             h2 { margin-top: 24px; font-size: 16px; color: #555; }
//             p { margin: 4px 0; }
//             .section { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 12px; }
//           </style>
//         </head>
//         <body>
//           <h1>${inspection.title}</h1>
//           <p><strong>Location:</strong> ${inspection.location}</p>
//           <p><strong>Date:</strong> ${inspection.date}</p>
//           <p><strong>Time:</strong> ${inspection.time}</p>
//           <p><strong>Inspector:</strong> ${inspection.inspector}</p>
//           <p><strong>Status:</strong> ${inspection.status}</p>

//           ${(inspection.sections || []).map((section, idx) => `
//             <div class="section">
//               <h2>Section ${idx + 1}: ${section.title}</h2>
//               ${section.fields.map(field => {
//                 const response = (inspection.responses || []).find(r => r.fieldId === field.id);
//                 return `<p><strong>${field.label}:</strong> ${response?.value ?? '—'}</p>`;
//               }).join('')}
//             </div>
//           `).join('')}
//         </body>
//       </html>
//     `;

//     const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
//     if (Platform.OS === 'ios' || Platform.OS === 'android') {
//       await Sharing.shareAsync(uri);
//     } else {
//       Alert.alert('Export complete', 'PDF generated at: ' + uri);
//     }
//   } catch (err) {
//     console.error('❌ Error exporting PDF:', err);
//     Alert.alert('Error', 'Failed to export PDF');
//   }
// };

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

export default function InspectionFormScreen() {
  const { theme } = useAppTheme();
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Debug theme colors
  console.log('🎨 InspectionForm Theme colors debug:', {
    error: theme.colors.error,
    surface: theme.colors.surface,
    border: theme.colors.border,
    success: theme.colors.success,
    background: theme.colors.background,
    text: theme.colors.text
  });
  
  // Get template or inspection ID from navigation params
  const template = (route.params as any)?.template as InspectionTemplate;
  const inspectionId = (route.params as any)?.inspectionId as string;
  const readOnly = (route.params as any)?.readOnly as boolean;
  const templateId = template?.id;
  
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<{[key: string]: any}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loadedInspection, setLoadedInspection] = useState<any>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

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
            setFormData(initialData);
          } else {
            Alert.alert('Error', 'Inspection not found.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('❌ Error loading inspection:', error);
          Alert.alert('Error', 'Failed to load inspection.');
          navigation.goBack();
        } finally {
          setLoadingInspection(false);
        }
      }
    };

    loadInspection();
  }, [inspectionId, template, navigation]);

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
    // If we have a loaded inspection, try to get its template or use its sections
    let templateSections;
    
    if (loadedInspection) {
      // If the loaded inspection has template sections, use those
      if (loadedInspection.template?.sections) {
        templateSections = loadedInspection.template.sections;
      } else if (loadedInspection.sections) {
        templateSections = loadedInspection.sections;
      } else {
        // Fallback to default sections for loaded inspections
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
      // Use template sections or default
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
      
      // Ensure fields is an array
      if (!Array.isArray(section.fields)) {
        console.warn(`🔧 Section "${section.title}" fields is not an array, converting to empty array`);
        section.fields = [];
      }
      
      // Filter out corrupted fields
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

  // Initialize form data based on template
  useEffect(() => {
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
    
    setFormData(initialData);
  }, [template]);

  // Original sample sections (keeping as fallback)
  const defaultInspectionSections = [
    {
      id: 1,
      title: 'General Information',
      fields: [
        { id: 'title', label: 'Inspection Title', type: 'text', required: true },
        { id: 'location', label: 'Location/Area', type: 'text', required: true },
        { id: 'inspector', label: 'Inspector Name', type: 'text', required: true },
        { id: 'date', label: 'Inspection Date', type: 'date', required: true },
        { id: 'time', label: 'Inspection Time', type: 'time', required: true },
      ]
    },
    {
      id: 2,
      title: 'Safety Equipment',
      fields: [
        { id: 'safety_signs', label: 'Safety Signs Visible & Clear', type: 'boolean', required: true },
        { id: 'emergency_exits', label: 'Emergency Exits Accessible', type: 'boolean', required: true },
        { id: 'fire_extinguishers', label: 'Fire Extinguishers Available', type: 'boolean', required: true },
        { id: 'first_aid_kit', label: 'First Aid Kit Accessible', type: 'boolean', required: true },
        { id: 'ppe_available', label: 'PPE Available for Workers', type: 'boolean', required: true },
        { id: 'safety_equipment_notes', label: 'Additional Notes', type: 'textarea', required: false },
      ]
    },
    {
      id: 3,
      title: 'Machinery & Equipment',
      fields: [
        { id: 'machinery_guards', label: 'Machinery Guards in Place', type: 'boolean', required: true },
        { id: 'emergency_stops', label: 'Emergency Stop Buttons Functional', type: 'boolean', required: true },
        { id: 'equipment_condition', label: 'Equipment in Good Condition', type: 'boolean', required: true },
        { id: 'maintenance_records', label: 'Maintenance Records Up to Date', type: 'boolean', required: true },
        { id: 'lockout_procedures', label: 'Lockout/Tagout Procedures Followed', type: 'boolean', required: true },
        { id: 'machinery_notes', label: 'Equipment Issues Found', type: 'textarea', required: false },
      ]
    },
    {
      id: 4,
      title: 'Environmental Conditions',
      fields: [
        { id: 'lighting_adequate', label: 'Adequate Lighting', type: 'boolean', required: true },
        { id: 'ventilation_proper', label: 'Proper Ventilation', type: 'boolean', required: true },
        { id: 'noise_levels', label: 'Acceptable Noise Levels', type: 'boolean', required: true },
        { id: 'housekeeping', label: 'Good Housekeeping Standards', type: 'boolean', required: true },
        { id: 'chemical_storage', label: 'Chemicals Stored Safely', type: 'boolean', required: true },
        { id: 'environment_notes', label: 'Environmental Concerns', type: 'textarea', required: false },
      ]
    },
    {
      id: 5,
      title: 'Training & Procedures',
      fields: [
        { id: 'staff_trained', label: 'Staff Properly Trained', type: 'boolean', required: true },
        { id: 'procedures_followed', label: 'Safety Procedures Being Followed', type: 'boolean', required: true },
        { id: 'documentation_current', label: 'Safety Documentation Current', type: 'boolean', required: true },
        { id: 'incident_reporting', label: 'Incident Reporting System Active', type: 'boolean', required: true },
        { id: 'training_notes', label: 'Training Gaps Identified', type: 'textarea', required: false },
      ]
    },
    {
      id: 6,
      title: 'Final Assessment',
      fields: [
        { id: 'overall_score', label: 'Overall Safety Score (0-100)', type: 'number', required: true },
        { id: 'critical_issues', label: 'Critical Issues Found', type: 'number', required: true },
        { id: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
        { id: 'follow_up_required', label: 'Follow-up Required', type: 'boolean', required: true },
        { id: 'follow_up_date', label: 'Follow-up Date', type: 'date', required: false },
      ]
    }
  ];

  const exportInspectionAsPDF = async (inspectionData) => {
  // Generate HTML content from inspectionData
  const html = `
    <html>
      <body>
        <h1>Inspection Report</h1>
        <p>ID: ${inspectionData.id}</p>
        <p>Status: ${inspectionData.status}</p>
        <!-- Add more fields as needed -->
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'web') {
    // On web, trigger download
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'inspection.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // On native, use sharing dialog
    await Sharing.shareAsync(uri);
  }
};

  const [sectionResponses, setSectionResponses] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const updateResponse = (fieldId: string, value: any) => {
    console.log('📝 InspectionForm - Updating response:', { 
      fieldId, 
      oldValue: sectionResponses[fieldId],
      newValue: value, 
      newValueType: typeof value,
      oldValueType: typeof sectionResponses[fieldId]
    });
    
    setSectionResponses(prev => {
      const updated = { ...prev, [fieldId]: value };
      console.log('🔄 InspectionForm - SectionResponses updated for field:', fieldId, 'new state:', updated[fieldId]);
      return updated;
    });
  };

  const handleSaveDraft = async () => {
    try {
      // Check if required general information is filled
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

      // Convert responses to the correct format
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
      
      // Show alert and navigate back to previous screen
      CrossPlatformAlert.alert(
        'Draft Saved',
        'Your inspection progress has been saved as a draft. You can continue later from where you left off.'
      );
      
      // Navigate back to previous screen
      navigation.goBack();
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
      // Validate all sections
      let allSectionsValid = true;
      for (let i = 0; i < inspectionSections.length; i++) {
        const sectionData = inspectionSections[i];
        const requiredFields = sectionData.fields.filter(field => field.required);
        
        for (const field of requiredFields) {
          if (!sectionResponses[field.id] && sectionResponses[field.id] !== false) {
            allSectionsValid = false;
            break;
          }
        }
        if (!allSectionsValid) break;
      }

      if (!allSectionsValid) {
        Alert.alert(
          'Incomplete Inspection',
          'Please complete all required fields in all sections before submitting.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Submit Inspection',
        'Are you sure you want to submit this inspection? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Submit', 
            onPress: async () => {
              try {
                // Convert responses to the correct format
                const responses = Object.keys(sectionResponses).map(fieldId => ({
                  fieldId,
                  value: sectionResponses[fieldId],
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
                  title: sectionResponses.title || 'Untitled Inspection',
                  location: sectionResponses.location || 'Unknown Location',
                  inspector: sectionResponses.inspector || user?.full_name || user?.email || 'Unknown Inspector',
                  date: sectionResponses.date || new Date().toISOString().split('T')[0],
                  time: sectionResponses.time || new Date().toLocaleTimeString(),
                  templateId: template?.id || 'default-safety',
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

                console.log('🔄 InspectionForm - Submitting inspection data:', {
                  id: inspectionData.id,
                  idType: typeof inspectionData.id,
                  title: inspectionData.title,
                  inspector: inspectionData.inspector,
                  responsesCount: inspectionData.responses.length,
                  fullData: inspectionData
                });

                await InspectionsService.submitInspection(inspectionData);
                
                // Show success alert and navigate back to previous screen
                Alert.alert(
                  'Success', 
                  'Inspection submitted successfully! Your inspection has been completed and saved.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to dashboard for inspectors or previous screen for others
                        try {
                          if (user?.role === 'inspector') {
                            // Try to navigate to InspectorDashboard, fallback to going back
                            (navigation as any).navigate('InspectorDashboard');
                          } else {
                            navigation.goBack();
                          }
                        } catch (navError) {
                          console.log('Navigation error, falling back to goBack():', navError);
                          navigation.goBack();
                        }
                      }
                    }
                  ]
                );
                
              } catch (error) {
                console.error('Error submitting inspection:', error);
                CrossPlatformAlert.alert(
                  'Error',
                  'Failed to submit inspection. Please try again.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error validating inspection:', error);
      Alert.alert(
        'Error',
        'An error occurred while validating the inspection.',
        [{ text: 'OK' }]
      );
    }
  };

  const validateSection = () => {
    console.log('🔍 VALIDATE SECTION - Called for current section:', currentSection);
    const currentSectionData = inspectionSections[currentSection];
    console.log('📋 Current section data:', currentSectionData?.title);
    const requiredFields = currentSectionData.fields.filter(field => field.required);
    console.log('📝 Required fields in current section:', requiredFields.length);
    
    for (const field of requiredFields) {
      const fieldValue = sectionResponses[field.id];
      console.log(`   📌 Checking field: "${field.label}" (id: ${field.id})`);
      console.log(`   📊 Value:`, fieldValue);
      console.log(`   ❌ Is invalid?`, !fieldValue && fieldValue !== false);
      
      if (!sectionResponses[field.id] && sectionResponses[field.id] !== false) {
        console.log(`   ❌ VALIDATION FAILED: Field "${field.label}" is missing!`);
        return false;
      } else {
        console.log(`   ✅ Field "${field.label}" is valid`);
      }
    }
    console.log('✅ VALIDATE SECTION - All fields valid, returning true');
    return true;
  };

  const isFieldCompleted = (field: any) => {
    const value = sectionResponses[field.id];
    if (!field.required) return true;
    return value !== undefined && value !== null && value !== '';
  };

  const getFieldBorderColor = (field: any) => {
    if (!field.required) return theme.colors.border;
    
    // Show red border if validation errors are shown and field is incomplete
    if (showValidationErrors && !isFieldCompleted(field)) {
      return theme.colors.error;
    }
    
    // Show green border if field is completed
    return isFieldCompleted(field) ? theme.colors.success : theme.colors.border;
  };

  const renderField = (field: any) => {
    // Enhanced field debugging
    console.log('🔍 InspectionForm renderField:', {
      fieldId: field.id,
      fieldType: field.type,
      fieldLabel: field.label,
      fieldRequired: field.required,
      fieldOptions: field.options,
      hasFieldType: !!field.type,
      fullField: field
    });

    if (!field.type) {
      console.error('❌ Field missing type:', field);
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
    
    // For boolean fields, don't use empty string fallback
    const value = field.type === 'boolean' 
      ? sectionResponses[field.id] 
      : sectionResponses[field.id] || '';

    console.log('🔧 renderField called:', {
      fieldId: field.id,
      fieldType: field.type,
      rawValue: sectionResponses[field.id],
      processedValue: value,
      valueType: typeof value
    });

    switch (field.type) {
      case 'date':
      case 'time':
        return (
          <DateTimeInput
            field={field}
            value={value}
            onChange={(newValue: any) => updateResponse(field.id, newValue)}
            showValidation={showValidationErrors}
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
        console.log('🔍 InspectionForm Boolean field debug:', { 
          fieldId: field.id, 
          value, 
          valueType: typeof value, 
          isTrue: value === true,
          isFalse: value === false,
          errorColor: theme.colors.error,
          surfaceColor: theme.colors.surface,
          borderColor: theme.colors.border,
          successColor: theme.colors.success
        });
        
        const noButtonStyle = {
          backgroundColor: value === false ? theme.colors.error : theme.colors.surface,
          borderColor: value === false ? theme.colors.error : theme.colors.border,
          borderWidth: 2,
          padding: isTablet ? 16 : 12,
          borderRadius: 8,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: 8
        };
        
        console.log('🎨 InspectionForm No button style computed:', {
          fieldId: field.id,
          valueFalse: value === false,
          backgroundColor: noButtonStyle.backgroundColor,
          borderColor: noButtonStyle.borderColor,
          expectedErrorColor: theme.colors.error,
          actualBgColor: value === false ? 'error color' : 'surface color'
        });
        
        return (
          <XStack gap="$3" justifyContent={isTablet ? "flex-start" : "space-between"}>
            <TouchableOpacity
              onPress={() => {
                if (!readOnly) {
                  console.log('✅ InspectionForm Yes button pressed for field:', field.id);
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
                  console.log('❌ InspectionForm No button pressed for field:', field.id, 'Setting to false');
                  console.log('🔄 InspectionForm Before update - current value:', value, 'type:', typeof value);
                  updateResponse(field.id, false);
                  // Log after a brief delay to see if state updated
                  setTimeout(() => {
                    console.log('⏰ InspectionForm After update delay - value should be false:', sectionResponses[field.id]);
                  }, 100);
                }
              }}
              style={{ flex: isTablet ? 0 : 1, minWidth: isTablet ? 120 : undefined }}
              disabled={readOnly}
            >
              <View style={{
                ...noButtonStyle,
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
        console.log('🖼️ RENDERING IMAGE FIELD:', field.id, field.label);
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
        console.log('🔍 Select field options:', options, 'for field:', field.id);
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
                    console.log('📝 Select option selected:', option, 'for field:', field.id);
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
        console.error('❌ Unknown field type:', field.type, 'for field:', field);
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
            <Text style={{ color: theme.colors.text, marginTop: 4, fontSize: 12 }}>
              This field will not be editable. Please check the template configuration.
            </Text>
          </View>
        );
    }
  };

  const currentSectionData = inspectionSections[currentSection];
  const isLastSection = currentSection === inspectionSections.length - 1;
  const isFirstSection = currentSection === 0;

  // Enhanced debugging for current section
  console.log('📋 Current section analysis:', {
    currentSection,
    sectionTitle: currentSectionData?.title,
    sectionId: currentSectionData?.id,
    fieldsExists: !!currentSectionData?.fields,
    fieldsIsArray: Array.isArray(currentSectionData?.fields),
    fieldsCount: currentSectionData?.fields?.length || 0,
    totalSections: inspectionSections.length,
    templateId: template?.id,
    templateTitle: template?.title
  });

  // Log each field in current section
  if (currentSectionData?.fields && Array.isArray(currentSectionData.fields)) {
    currentSectionData.fields.forEach((field, index) => {
      console.log(`📝 Field ${index + 1}:`, {
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        hasAllRequiredProps: !!(field.id && field.label && field.type)
      });
    });
  }

  return (
    <ScreenContainer>
      {loadingInspection ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20 
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: theme.colors.text,
            marginBottom: 10 
          }}>
            Loading inspection details...
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" paddingBottom="$8">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" flexWrap={isTablet ? 'nowrap' : 'wrap'}>
          <XStack alignItems="center" gap="$3" flex={isTablet ? undefined : 1}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <YStack>
              <Text style={{ 
                fontSize: isTablet ? 28 : 20, 
                fontWeight: 'bold', 
                color: theme.colors.text 
              }}>
                {readOnly ? 'View Inspection' : 'New Inspection'}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.textSecondary 
              }}>
                Section {currentSection + 1} of {inspectionSections.length}
              </Text>
            </YStack>
          </XStack>
          
          {!readOnly && (
            <Button
              backgroundColor={theme.colors.surface}
              borderColor={theme.colors.border}
              borderWidth={1}
              icon={<Save size={20} color={theme.colors.text} />}
              color={theme.colors.text}
              onPress={handleSaveDraft}
              size={isTablet ? "$4" : "$3"}
              marginTop={isTablet ? 0 : "$2"}
            >
              {isTablet ? 'Save Draft' : 'Draft'}
            </Button>
          )}
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card 
            backgroundColor={theme.colors.surface}
            borderColor={theme.colors.border}
            padding={isTablet ? "$8" : "$4"}
            maxWidth={isDesktop ? 800 : undefined}
            alignSelf={isDesktop ? "center" : undefined}
            width="100%"
          >
            <YStack gap="$4">
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

              {/* Check if fields exist and is an array */}
              {currentSectionData.fields && Array.isArray(currentSectionData.fields) ? (
                currentSectionData.fields
                  .filter((field) => {
                    // Enhanced field validation - filter out corrupted fields
                    const isValid = field && 
                                  typeof field === 'object' && 
                                  field.id && 
                                  field.label && 
                                  field.type;
                    
                    if (!isValid) {
                      console.warn('🚨 Filtering out corrupted field:', {
                        field,
                        hasId: !!field?.id,
                        hasLabel: !!field?.label,
                        hasType: !!field?.type,
                        fieldType: typeof field
                      });
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
                /* Enhanced error message when fields are missing or corrupted */
                (() => {
                  const totalFields = currentSectionData.fields?.length || 0;
                  const validFields = Array.isArray(currentSectionData.fields) 
                    ? currentSectionData.fields.filter(field => 
                        field && typeof field === 'object' && field.id && field.label && field.type
                      ).length 
                    : 0;
                  const corruptedFields = totalFields - validFields;
                  
                  console.error('❌ Section field analysis:', {
                    sectionTitle: currentSectionData.title,
                    fieldsIsArray: Array.isArray(currentSectionData.fields),
                    totalFields,
                    validFields,
                    corruptedFields,
                    fieldsData: currentSectionData.fields
                  });
                  
                  return (
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
                        Section "{currentSectionData.title}" has field configuration problems:
                      </Text>
                      {!Array.isArray(currentSectionData.fields) && (
                        <Text style={{ color: theme.colors.text, marginTop: 2, fontSize: 12 }}>
                          • Fields is not an array (type: {typeof currentSectionData.fields})
                        </Text>
                      )}
                      {Array.isArray(currentSectionData.fields) && totalFields === 0 && (
                        <Text style={{ color: theme.colors.text, marginTop: 2, fontSize: 12 }}>
                          • No fields configured for this section
                        </Text>
                      )}
                      {corruptedFields > 0 && (
                        <Text style={{ color: theme.colors.text, marginTop: 2, fontSize: 12 }}>
                          • {corruptedFields} corrupted field(s) filtered out (missing id, label, or type)
                        </Text>
                      )}
                      {validFields > 0 && (
                        <Text style={{ color: theme.colors.success, marginTop: 2, fontSize: 12 }}>
                          • {validFields} valid field(s) found and displayed above
                        </Text>
                      )}
                      <Text style={{ color: theme.colors.textSecondary, marginTop: 8, fontSize: 12, fontStyle: 'italic' }}>
                        Please contact an administrator to fix this template or try a different template.
                      </Text>
                    </View>
                  );
                })()
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
          </Card>
        </ScrollView>

        {/* Navigation Buttons */}
        <XStack gap="$3" paddingTop="$4" maxWidth={isDesktop ? 800 : undefined} alignSelf={isDesktop ? "center" : undefined} width="100%">
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
              size={isTablet ? "$4" : "$3"}
            >
              Previous
            </Button>
          )}
          
          <Button
            flex={1}
            backgroundColor={readOnly ? theme.colors.surface : theme.colors.primary}
            color={readOnly ? theme.colors.textSecondary : "white"}
            size={isTablet ? "$4" : "$3"}
            disabled={readOnly}
            onPress={() => {
              if (readOnly) return;
              
              console.log('🔘 BUTTON PRESSED - Submit/Next button clicked');
              console.log('📊 Button state:', {
                isLastSection,
                currentSection,
                totalSections: inspectionSections.length
              });
              
              if (!validateSection()) {
                console.log('❌ Validation failed - showing alert');
                setShowValidationErrors(true);
                Alert.alert('Missing Required Fields', 'Please fill in all required fields (marked in red) before continuing.');
                return;
              }
              
              console.log('✅ Validation passed - proceeding...');
              setShowValidationErrors(false);
              
              if (isLastSection) {
                console.log('🎯 Last section - calling handleSubmitInspection');
                handleSubmitInspection();
              } else {
                console.log('➡️ Not last section - moving to next');
                setCurrentSection(prev => prev + 1);
              }
            }}
          >
            {readOnly ? 'View Only' : (isLastSection ? 'Submit Inspection' : 'Next Section')}
          </Button>
        </XStack>
      </YStack>
      </ScrollView>
      )}
    </ScreenContainer>
  );
}
