import React from 'react';
import { View, Text } from 'react-native';
import { InspectionTemplate } from '../../types/inspection';

interface TestFormBuilderProps {
  onSave: (template: InspectionTemplate) => void;
  onCancel: () => void;
  existingTemplate?: InspectionTemplate;
}

function TestFormBuilder({ onSave, onCancel, existingTemplate }: TestFormBuilderProps) {
  console.log('TestFormBuilder - Component rendering');
  
  return (
    <View style={{ flex: 1, backgroundColor: 'lightblue', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Test FormBuilder</Text>
      <Text style={{ fontSize: 14, marginTop: 10 }}>This is a test to verify imports work</Text>
    </View>
  );
}

export default TestFormBuilder;
