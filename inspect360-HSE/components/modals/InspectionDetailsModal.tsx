// Inside InspectionDetailsModal.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import { X } from '@tamagui/lucide-icons';
import { useAppTheme } from '../../themes';
import { Inspection } from '../../types/inspection';

type Props = {
  visible: boolean;
  inspection: Inspection | null;
  onClose: () => void;
  onExportPdf: (inspection: Inspection) => Promise<void>;
};

const LABEL_MAP: Record<string, string> = {
  title: 'Title',
  location: 'Location',
  inspector: 'Inspector',
  date: 'Date',
  time: 'Time',
};

const formatValue = (val: any) => {
  if (val == null || val === '') return 'N/A';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
};

export default function InspectionDetailsModal({ visible, inspection, onClose, onExportPdf }: Props) {
  const { theme } = useAppTheme();
  const [isExporting, setIsExporting] = useState(false);

  const hasSections = !!inspection?.template?.sections?.length;

  const fallbackRows = useMemo(() => {
    if (!inspection?.responses?.length) return [];
    return inspection.responses.map((r) => {
      const label = LABEL_MAP[r.fieldId] ?? r.fieldId;
      return { label, value: formatValue(r.value) };
    });
  }, [inspection]);

  const handleExportPdf = async () => {
    if (!inspection) return;
    setIsExporting(true);
    try {
      await onExportPdf(inspection);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!visible || !inspection) return null;

  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ width: '90%', maxWidth: 600 }} padding="$4" backgroundColor={theme.colors.surface} borderRadius={12}>
        <XStack alignItems="center" justifyContent="space-between" mb="$3">
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>
            {inspection?.title ?? 'Inspection'}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
            <X size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </XStack>

        <ScrollView style={{ maxHeight: 500 }}>
          {/* Meta summary */}
          <YStack gap="$2" mb="$3">
            <Text style={{ color: theme.colors.textSecondary }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>Status: </Text>
              {inspection?.status ?? 'N/A'}
            </Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>Location: </Text>
              {inspection?.location ?? 'N/A'}
            </Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>Inspector: </Text>
              {inspection?.inspector ?? 'N/A'}
            </Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>When: </Text>
              {inspection?.date} {inspection?.time}
            </Text>
          </YStack>

          {/* Sections or fallback */}
          {hasSections ? (
            inspection.template.sections.map((section, sIdx) => (
              <YStack key={sIdx} mb="$4" gap="$2">
                <Text style={{ fontWeight: '700', fontSize: 16, color: theme.colors.text }}>
                  Section {sIdx + 1}: {section.title || 'Untitled'}
                </Text>
                {!!section.description && (
                  <Text style={{ color: theme.colors.textSecondary }}>{section.description}</Text>
                )}
                <YStack>
                  {section.fields?.map((field) => {
                    const match = inspection.responses?.find((r) => r.fieldId === field.id);
                    const value = match ? formatValue(match.value) : 'N/A';
                    return (
                      <XStack
                        key={field.id}
                        justifyContent="space-between"
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.border,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ fontWeight: '600', color: theme.colors.text }}>{field.label}</Text>
                        <Text style={{ color: theme.colors.textSecondary, maxWidth: '60%' }}>{value}</Text>
                      </XStack>
                    );
                  })}
                </YStack>
              </YStack>
            ))
          ) : (
            <YStack gap="$2">
              <Text style={{ fontWeight: '700', fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>
                Responses
              </Text>
              {fallbackRows.length ? (
                fallbackRows.map((row) => (
                  <XStack
                    key={row.label}
                    justifyContent="space-between"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: theme.colors.text }}>{row.label}</Text>
                    <Text style={{ color: theme.colors.textSecondary, maxWidth: '60%' }}>{row.value}</Text>
                  </XStack>
                ))
              ) : (
                <Text style={{ color: theme.colors.textSecondary }}>No responses saved.</Text>
              )}
            </YStack>
          )}
        </ScrollView>

        <TouchableOpacity onPress={handleExportPdf} disabled={isExporting} style={{ marginTop: 16 }}>
          <Text style={{ color: isExporting ? theme.colors.textSecondary : theme.colors.primary }}>
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}
