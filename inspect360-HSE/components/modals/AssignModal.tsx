import React from 'react';
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';
import { User, CheckCircle, X as XIcon } from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { Inspection } from '../../types/inspection';
import { UserProfile } from '../../types/auth';

type Props = {
  visible: boolean;
  onClose: () => void;

  inspection: Inspection | null;

  availableInspectors: UserProfile[];
  selectedInspector: UserProfile | null;
  setSelectedInspector: (u: UserProfile | null) => void;

  dueDate: string;
  setDueDate: (v: string) => void;

  notes: string;
  setNotes: (v: string) => void;

  priority: 'low' | 'medium' | 'high' | 'urgent';
  setPriority: (v: 'low' | 'medium' | 'high' | 'urgent') => void;

  onSubmit: () => void;

  isTablet?: boolean;
};

const AssignModal: React.FC<Props> = ({
  visible,
  onClose,
  inspection,
  availableInspectors,
  selectedInspector,
  setSelectedInspector,
  dueDate,
  setDueDate,
  notes,
  setNotes,
  priority,
  setPriority,
  onSubmit,
  isTablet = false,
}) => {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Card backgroundColor={theme.colors.surface} padding="$4" width="100%" maxWidth={isTablet ? 400 : undefined} borderRadius={12}>
          <YStack gap="$4">
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between">
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>Assign Inspection</Text>
              <TouchableOpacity onPress={onClose}>
                <XIcon size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </XStack>

            {/* Inspection summary */}
            {inspection && (
              <Card backgroundColor={theme.colors.primaryLight + '20'} padding="$3">
                <YStack gap="$1">
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>{inspection.title}</Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {inspection.location} • {inspection.date}
                  </Text>
                </YStack>
              </Card>
            )}

            {/* Inspector list */}
            <YStack gap="$2">
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>Select Inspector</Text>
              <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                <YStack gap="$2">
                  {availableInspectors.map((inspector) => (
                    <TouchableOpacity key={inspector.id} onPress={() => setSelectedInspector(inspector)}>
                      <Card
                        backgroundColor={selectedInspector?.id === inspector.id ? theme.colors.primary + '20' : theme.colors.surface}
                        borderColor={selectedInspector?.id === inspector.id ? theme.colors.primary : theme.colors.border}
                        borderWidth={1}
                        padding="$3"
                      >
                        <XStack alignItems="center" gap="$3">
                          <User size={20} color={theme.colors.textSecondary} />
                          <YStack flex={1}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                              {inspector.full_name}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{inspector.email}</Text>
                          </YStack>
                          {selectedInspector?.id === inspector.id && <CheckCircle size={20} color={theme.colors.primary} />}
                        </XStack>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </YStack>
              </ScrollView>
            </YStack>

            {/* Due date */}
            <YStack gap="$2">
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>Due Date (Optional)</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  color: theme.colors.text,
                  fontSize: 14,
                }}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </YStack>

            {/* Priority */}
            <YStack gap="$2">
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <TouchableOpacity key={p} onPress={() => setPriority(p)}>
                      <View
                        style={{
                          backgroundColor: priority === p ? theme.colors.primary : theme.colors.surface,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: priority === p ? theme.colors.primary : theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: priority === p ? 'white' : theme.colors.text,
                            fontSize: 14,
                            fontWeight: priority === p ? '600' : '500',
                            textTransform: 'capitalize',
                          }}
                        >
                          {p}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </ScrollView>
            </YStack>

            {/* Notes */}
            <YStack gap="$2">
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }}>Notes (Optional)</Text>
              <TextInput
                placeholder="Add any additional instructions..."
                value={notes}
                onChangeText={setNotes}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  color: theme.colors.text,
                  fontSize: 14,
                  height: 80,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </YStack>

            {/* Actions */}
            <XStack gap="$3">
              <Button
                flex={1}
                backgroundColor={theme.colors.surface}
                borderColor={theme.colors.border}
                borderWidth={1}
                color={theme.colors.text}
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                backgroundColor={theme.colors.primary}
                color="white"
                onPress={onSubmit}
                disabled={!selectedInspector}
                opacity={!selectedInspector ? 0.6 : 1}
              >
                Assign
              </Button>
            </XStack>
          </YStack>
        </Card>
      </View>
    </Modal>
  );
};

export default AssignModal;
