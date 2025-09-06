import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { 
  ArrowLeft,
  Plus,
  FileText,
  Shield,
  Wrench,
  Leaf,
  Wand2,
  Clock,
  User,
  MapPin,
  Eye,
  X
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InspectionTemplate } from '../types/inspection';
import { InspectionStackParamList } from '../types/navigation';
import { TemplatesService } from '../services/templatesService';
import { assignmentService } from '../services/assignmentService';
import { InspectionsService } from '../services/inspectionsService';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types/auth';

type NavigationProp = StackNavigationProp<InspectionStackParamList>;

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'safety': return <Shield size={24} />;
    case 'maintenance': return <Wrench size={24} />;
    case 'environmental': return <Leaf size={24} />;
    default: return <FileText size={24} />;
  }
};

const getCategoryColor = (category: string, theme: any) => {
  switch (category.toLowerCase()) {
    case 'safety': return theme.colors.error;
    case 'maintenance': return theme.colors.warning;
    case 'environmental': return theme.colors.success;
    default: return theme.colors.primary;
  }
};

export default function NewInspectionScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUser();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [availableInspectors, setAvailableInspectors] = useState<UserProfile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [loadingInspectors, setLoadingInspectors] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const loadedTemplates = await TemplatesService.getAllTemplates();
      // Show only prebuilt templates for quick access
      const prebuiltTemplates = loadedTemplates.filter(t => t.isPrebuilt);
      setTemplates(prebuiltTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromScratch = () => {
    // Navigate to Templates screen with create mode
    (navigation as any).navigate('Templates', { createFromScratch: true });
  };

  const handleBrowseAllTemplates = () => {
    // Navigate to parent navigator which should have Templates
    (navigation as any).navigate('Templates');
  };

  const handleUseTemplate = async (template: InspectionTemplate) => {
    if (user?.role === 'inspector') {
      // Inspectors can use templates to create inspections
      navigation.navigate('InspectionForm', { template });
    } else {
      // Admins/Managers should show inspector selection modal
      try {
        console.log('👤 NewInspectionScreen - Admin/Manager detected, showing inspector selection');
        setSelectedTemplate(template);
        setLoadingInspectors(true);
        setShowInspectorModal(true);
        
        // Fetch available inspectors
        const inspectors = await assignmentService.getAvailableInspectors();
        setAvailableInspectors(inspectors);
        setLoadingInspectors(false);
        
      } catch (error) {
        console.error('❌ Error loading inspectors:', error);
        setLoadingInspectors(false);
        Alert.alert('Error', 'Failed to load available inspectors. Please try again.');
      }
    }
  };

  const handleSelectInspector = async (inspector: UserProfile) => {
    if (!selectedTemplate || !user) {
      Alert.alert('Error', 'Missing template or user information');
      return;
    }

    try {
      console.log('👤 NewInspectionScreen - Creating assignment for inspector:', inspector.full_name);
      
      // First, create an inspection from the template
      const inspection = await InspectionsService.createInspectionFromTemplate(
        selectedTemplate.id,
        inspector.id,
        user.id,
        `${selectedTemplate.title} - ${inspector.full_name}`,
        'To be determined',
        undefined // due date will be set in assignment
      );

      // Then create the assignment
      const assignment = await assignmentService.createAssignment(
        {
          inspection_id: inspection.id,
          assigned_to: inspector.id,
          priority: 'medium',
          notes: `Assignment created from template: ${selectedTemplate.title}`
        },
        user.id
      );

      console.log('✅ Successfully created assignment:', assignment);
      
      setShowInspectorModal(false);
      Alert.alert(
        'Assignment Created', 
        `Successfully assigned "${selectedTemplate.title}" to ${inspector.full_name}`
      );
      
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      Alert.alert('Error', 'Failed to create assignment. Please try again.');
    }
  };

  const handleCloseInspectorModal = () => {
    setShowInspectorModal(false);
    setSelectedTemplate(null);
    setAvailableInspectors([]);
  };

  return (
    <ScreenContainer>
      <YStack gap="$4" paddingBottom="$8">
        {/* Header */}
        <XStack alignItems="center" gap="$3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <YStack>
            <Text style={{ 
              fontSize: isTablet ? 28 : 24, 
              fontWeight: 'bold', 
              color: theme.colors.text 
            }}>
              {user?.role === 'inspector' ? 'New Inspection' : 'Create Template'}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: theme.colors.textSecondary 
            }}>
              {user?.role === 'inspector' 
                ? 'Choose how you\'d like to start your inspection'
                : 'Create a new template or assign existing ones to inspectors'
              }
            </Text>
          </YStack>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4">
            {/* Quick Start Options */}
            <YStack gap="$3">
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Quick Start
              </Text>

              {/* Create from Scratch */}
              <TouchableOpacity onPress={handleCreateFromScratch}>
                <Card
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  padding="$4"
                >
                  <XStack alignItems="center" gap="$4">
                    <View style={{
                      backgroundColor: theme.colors.primary + '20',
                      padding: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Wand2 size={32} color={theme.colors.primary} />
                    </View>
                    
                    <YStack flex={1} gap="$1">
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: theme.colors.text
                      }}>
                        {user?.role === 'inspector' ? 'Create from Scratch' : 'Create New Template'}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20
                      }}>
                        {user?.role === 'inspector' 
                          ? 'Build a custom inspection template with your own questions and sections'
                          : 'Create a new inspection template that can be assigned to inspectors'
                        }
                      </Text>
                    </YStack>

                    <View style={{
                      backgroundColor: theme.colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        Custom
                      </Text>
                    </View>
                  </XStack>
                </Card>
              </TouchableOpacity>

              {/* Browse All Templates */}
              <TouchableOpacity onPress={handleBrowseAllTemplates}>
                <Card
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  padding="$4"
                >
                  <XStack alignItems="center" gap="$4">
                    <View style={{
                      backgroundColor: theme.colors.info + '20',
                      padding: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={32} color={theme.colors.info} />
                    </View>
                    
                    <YStack flex={1} gap="$1">
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: theme.colors.text
                      }}>
                        Browse All Templates
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20
                      }}>
                        {user?.role === 'inspector'
                          ? 'Explore all available templates including custom and prebuilt options'
                          : 'View and manage all templates, or assign them to inspectors'
                        }
                      </Text>
                    </YStack>

                    <View style={{
                      backgroundColor: theme.colors.info,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        Library
                      </Text>
                    </View>
                  </XStack>
                </Card>
              </TouchableOpacity>
            </YStack>

            {/* Prebuilt Templates */}
            <YStack gap="$3">
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text
              }}>
                Prebuilt Templates
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                lineHeight: 18
              }}>
                {user?.role === 'inspector'
                  ? 'Ready-to-use inspection templates for common use cases'
                  : 'Assign prebuilt templates to inspectors for quick setup'
                }
              </Text>

              {loading ? (
                <Card backgroundColor={theme.colors.surface} padding="$4">
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    Loading templates...
                  </Text>
                </Card>
              ) : templates.length === 0 ? (
                <Card backgroundColor={theme.colors.surface} padding="$4">
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    No prebuilt templates available
                  </Text>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    backgroundColor={theme.colors.surface}
                    borderColor={theme.colors.border}
                    padding="$4"
                  >
                    <YStack gap="$3">
                      <XStack alignItems="center" gap="$3">
                        <View style={{
                          backgroundColor: getCategoryColor(template.category, theme) + '20',
                          padding: 12,
                          borderRadius: 8
                        }}>
                          {getCategoryIcon(template.category)}
                        </View>
                        
                        <YStack flex={1} gap="$1">
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: 'bold', 
                            color: theme.colors.text 
                          }}>
                            {template.title}
                          </Text>
                          <Text style={{ 
                            fontSize: 13, 
                            color: theme.colors.textSecondary 
                          }}>
                            {template.category} • {template.sections.length} sections
                          </Text>
                        </YStack>

                        <View style={{
                          backgroundColor: theme.colors.success + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12
                        }}>
                          <Text style={{
                            fontSize: 11,
                            color: theme.colors.success,
                            fontWeight: '500'
                          }}>
                            PREBUILT
                          </Text>
                        </View>
                      </XStack>

                      <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors.text,
                        lineHeight: 18
                      }}>
                        {template.description}
                      </Text>

                      {template.tags.length > 0 && (
                        <XStack gap="$2" flexWrap="wrap">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <View
                              key={index}
                              style={{
                                backgroundColor: theme.colors.primary + '15',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 10
                              }}
                            >
                              <Text style={{
                                fontSize: 11,
                                color: theme.colors.primary,
                                fontWeight: '500'
                              }}>
                                {tag}
                              </Text>
                            </View>
                          ))}
                          {template.tags.length > 3 && (
                            <View style={{
                              backgroundColor: theme.colors.textSecondary + '15',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 10
                            }}>
                              <Text style={{
                                fontSize: 11,
                                color: theme.colors.textSecondary,
                                fontWeight: '500'
                              }}>
                                +{template.tags.length - 3}
                              </Text>
                            </View>
                          )}
                        </XStack>
                      )}

                      <XStack gap="$3" alignItems="center" justifyContent="space-between">
                        <XStack alignItems="center" gap="$3">
                          <XStack alignItems="center" gap="$1">
                            <Clock size={12} color={theme.colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 11, 
                              color: theme.colors.textSecondary 
                            }}>
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </Text>
                          </XStack>
                          <XStack alignItems="center" gap="$1">
                            <User size={12} color={theme.colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 11, 
                              color: theme.colors.textSecondary 
                            }}>
                              {template.createdBy}
                            </Text>
                          </XStack>
                        </XStack>
                        
                        <XStack gap="$2">
                          <Button
                            backgroundColor={theme.colors.backgroundSecondary}
                            borderColor={theme.colors.border}
                            borderWidth={1}
                            color={theme.colors.text}
                            size="$2"
                            icon={<Eye size={16} />}
                            onPress={() => {
                              // Navigate to templates for preview
                              handleBrowseAllTemplates();
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            backgroundColor={theme.colors.primary}
                            color="white"
                            size="$2"
                            onPress={() => handleUseTemplate(template)}
                          >
                            {user?.role === 'inspector' ? 'Use Template' : 'Assign Template'}
                          </Button>
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

      {/* Inspector Selection Modal */}
      <Modal
        visible={showInspectorModal}
        animationType="fade"
        transparent
        onRequestClose={handleCloseInspectorModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <Card style={{
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '80%',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4
          }}>
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: theme.colors.text
              }}>
                Select Inspector
              </Text>
              <TouchableOpacity onPress={handleCloseInspectorModal}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </XStack>

            {/* Template Info */}
            {selectedTemplate && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  marginBottom: 5,
                  color: theme.colors.text,
                  fontWeight: '600'
                }}>
                  Assign: {selectedTemplate.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  marginBottom: 15,
                  color: theme.colors.textSecondary
                }}>
                  {selectedTemplate.description}
                </Text>
              </View>
            )}

            {/* Inspectors List */}
            <ScrollView style={{ maxHeight: 300 }}>
              {loadingInspectors ? (
                <View style={{
                  padding: 40,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: theme.colors.textSecondary,
                    fontSize: 14
                  }}>
                    Loading inspectors...
                  </Text>
                </View>
              ) : availableInspectors.length === 0 ? (
                <View style={{
                  padding: 40,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: theme.colors.textSecondary,
                    fontSize: 14,
                    textAlign: 'center'
                  }}>
                    No available inspectors found.
                  </Text>
                </View>
              ) : (
                availableInspectors.map((inspector) => (
                  <TouchableOpacity
                    key={inspector.id}
                    style={{
                      padding: 15,
                      borderRadius: 8,
                      marginBottom: 10,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: theme.colors.border
                    }}
                    onPress={() => handleSelectInspector(inspector)}
                  >
                    <XStack alignItems="center" gap="$3">
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={20} color="white" />
                      </View>
                      <YStack flex={1}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: theme.colors.text
                        }}>
                          {inspector.full_name || 'Unknown Name'}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary
                        }}>
                          {inspector.email}
                        </Text>
                      </YStack>
                    </XStack>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Card>
        </View>
      </Modal>

    </ScreenContainer>
  );
}
