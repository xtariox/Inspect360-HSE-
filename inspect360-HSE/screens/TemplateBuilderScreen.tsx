import React from 'react';
import { View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import ChecklistBuilder from '../components/checklists/ChecklistBuilder';
import { InspectionTemplate } from '../types/inspection';
import { TemplateStackParamList } from '../types/navigation';
import { TemplatesService } from '../services/templatesService';

type TemplateBuilderScreenRouteProp = RouteProp<TemplateStackParamList, 'TemplateBuilder'>;
type TemplateBuilderScreenNavigationProp = StackNavigationProp<TemplateStackParamList, 'TemplateBuilder'>;

export default function TemplateBuilderScreen() {
  const navigation = useNavigation<TemplateBuilderScreenNavigationProp>();
  const route = useRoute<TemplateBuilderScreenRouteProp>();
  const { template } = route.params || {};

  const handleSaveTemplate = async (savedTemplate: InspectionTemplate) => {
    try {
      console.log('💾 TemplateBuilderScreen - Saving template:', savedTemplate.title);
      
      // Always use saveTemplate as it handles both create and update
      await TemplatesService.saveTemplate(savedTemplate);
      
      console.log('✅ TemplateBuilderScreen - Template saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('❌ TemplateBuilderScreen - Error saving template:', error);
    }
  };

  const handleSaveDraft = async (draftTemplate: Partial<InspectionTemplate>) => {
    try {
      console.log('💾 TemplateBuilderScreen - Saving draft template');
      
      const templateToSave: InspectionTemplate = {
        id: template?.id || TemplatesService.generateUUID(),
        title: draftTemplate.title || 'Untitled Template',
        description: draftTemplate.description || '',
        category: draftTemplate.category || 'custom',
        sections: draftTemplate.sections || [],
        tags: draftTemplate.tags || [],
        status: 'draft',
        isActive: false,
        isPrebuilt: false,
        createdBy: template?.createdBy || '',
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (template?.id) {
        await TemplatesService.saveTemplate(templateToSave);
      } else {
        await TemplatesService.saveTemplate(templateToSave);
      }
      
      console.log('✅ TemplateBuilderScreen - Draft saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('❌ TemplateBuilderScreen - Error saving draft:', error);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <ChecklistBuilder
        visible={true}
        onClose={handleClose}
        onSaveTemplate={handleSaveTemplate}
        onSaveDraft={handleSaveDraft}
        editingTemplate={template || null}
      />
    </View>
  );
}
