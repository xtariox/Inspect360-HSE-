import React, { useState } from 'react';
import { View, Text } from 'react-native';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useUser } from '../contexts/UserContext';
import { InspectorAssignments, AssignmentManager } from '../components/assignments';
import { useNavigation, useRoute } from '@react-navigation/native';
import InspectionFormModal from '../components/modals/InspectionFormModal';

export default function AssignmentsScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get preselected template from navigation params (if any)
  const preselectedTemplate = (route.params as any)?.template;

  // Modal state for inspection form
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(undefined);
  const [isReadOnly, setIsReadOnly] = useState(false);

  if (!user) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Please log in to view assignments.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleNavigateToInspection = (inspectionId: string) => {
    console.log('🔄 Opening inspection form modal for:', inspectionId);
    // Open inspection form modal
    setSelectedInspectionId(inspectionId);
    setSelectedTemplate(undefined);
    setIsReadOnly(false);
    setInspectionModalVisible(true);
  };

  const handleCreateInspection = () => {
    console.log('🔄 Navigating to new inspection screen');
    // Navigate to the new inspection screen
    (navigation as any).navigate('NewInspection');
  };

  return (
    <ScreenContainer>
      {user.role === 'inspector' ? (
        <InspectorAssignments
          inspectorId={user.id}
          onStartInspection={handleNavigateToInspection}
        />
      ) : (
        <AssignmentManager
          currentUserId={user.id}
          currentUserRole={user.role as 'admin' | 'manager'}
          onCreateInspection={handleCreateInspection}
          preselectedTemplate={preselectedTemplate}
        />
      )}
      
      {/* Inspection Form Modal */}
      <InspectionFormModal
        visible={inspectionModalVisible}
        onClose={() => {
          setInspectionModalVisible(false);
          setSelectedInspectionId(undefined);
          setSelectedTemplate(undefined);
          setIsReadOnly(false);
        }}
        inspectionId={selectedInspectionId}
        template={selectedTemplate}
        readOnly={isReadOnly}
      />
    </ScreenContainer>
  );
}
