import React from 'react';
import { View, Text } from 'react-native';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useUser } from '../contexts/UserContext';
import { InspectorAssignments, AssignmentManager } from '../components/assignments';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AssignmentsScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get preselected template from navigation params (if any)
  const preselectedTemplate = (route.params as any)?.template;

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
    console.log('🔄 Navigating to inspection form for:', inspectionId);
    // Navigate to the inspection form with the inspection ID
    (navigation as any).navigate('InspectionForm', { inspectionId });
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
    </ScreenContainer>
  );
}
