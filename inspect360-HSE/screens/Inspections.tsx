import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, RefreshControl, Platform } from 'react-native';
import { Card } from '@tamagui/card';
import { YStack, XStack } from '@tamagui/stacks';
import html2pdf from 'html2pdf.js';
import { Button } from '@tamagui/button';
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Camera,
  User,
  UserPlus,
  Download
} from '@tamagui/lucide-icons';
import ScreenContainer from '../components/ui/ScreenContainer';
import { useAppTheme } from '../themes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InspectionStackParamList } from '../types/navigation';
import { InspectionsService } from '../services/inspectionsService';
import { Inspection } from '../types/inspection';
import { useUser } from '../contexts/UserContext';
import assignmentService from '../services/assignmentService';
import { UserProfile } from '../types/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';


// NEW: modal components
import AssignModal from '../components/modals/AssignModal';
import InspectionDetailsModal from '../components/modals/InspectionDetailsModal';

type NavigationProp = StackNavigationProp<InspectionStackParamList>;

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function InspectionsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAdmin } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [availableInspectors, setAvailableInspectors] = useState<UserProfile[]>([]);
  const [selectedInspector, setSelectedInspector] = useState<UserProfile | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedInspections, setAssignedInspections] = useState<Set<string>>(new Set());

  // Details modal state
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewedInspection, setViewedInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    loadInspections();
    if (isAdmin()) {
      loadAvailableInspectors();
      loadAssignments();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInspections();
      if (isAdmin()) loadAssignments();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadInspections();
      if (isAdmin()) loadAssignments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAvailableInspectors = async () => {
    try {
      const inspectors = await assignmentService.getAssignableUsers();
      setAvailableInspectors(inspectors);
    } catch (error) {
      console.error('Error loading inspectors:', error);
    }
  };
  const generateInspectionHtml = (inspection) => {
  const fields = Object.keys(inspection).map((key) => {
    if (key === 'template' || key === 'responses') return ''; // Skip nested objects
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '); // Format key as label
    const value = inspection[key] ?? 'N/A';
    return `
      <tr>
        <td style="padding:8px; border:1px solid #ddd; font-weight:bold; background-color:#f9f9f9;">${label}</td>
        <td style="padding:8px; border:1px solid #ddd;">${value}</td>
      </tr>
    `;
  }).join('');

  const sections = inspection.template?.sections?.map((section, index) => {
    const fieldsHtml = section.fields?.map((field) => {
      const response = inspection.responses?.find((r) => r.fieldId === field.id);
      const value = response ? response.value : 'N/A';
      return `
        <tr>
          <td style="padding:8px; border:1px solid #ddd; font-weight:bold; background-color:#f9f9f9;">${field.label}</td>
          <td style="padding:8px; border:1px solid #ddd;">${value}</td>
        </tr>
      `;
    }).join('');

    return `
      <h2 style="margin-top:24px; color:#444;">Section ${index + 1}: ${section.title || 'Untitled'}</h2>
      ${section.description ? `<p style="color:#666;">${section.description}</p>` : ''}
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:8px; border:1px solid #ddd; background-color:#f1f1f1;">Field</th>
            <th style="padding:8px; border:1px solid #ddd; background-color:#f1f1f1;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${fieldsHtml}
        </tbody>
      </table>
    `;
  }).join('') || '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${inspection.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          h1 {
            color: #222;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
          }
          h2 {
            color: #444;
            margin-top: 24px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f1f1f1;
            text-align: left;
          }
          p {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <h1>${inspection.title}</h1>
        <p><strong>Status:</strong> ${inspection.status}</p>
        <p><strong>Location:</strong> ${inspection.location}</p>
        <p><strong>Date:</strong> ${inspection.date} at ${inspection.time}</p>
        <p><strong>Inspector:</strong> ${inspection.inspector}</p>
        <p><strong>Score:</strong> ${inspection.score ?? 'N/A'}%</p>
        <p><strong>Issues:</strong> ${inspection.issues ?? 0}</p>
        <p><strong>Description:</strong> ${inspection.description || 'N/A'}</p>
        <hr style="margin:24px 0;" />
        <h2>General Information</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${fields}
          </tbody>
        </table>
        ${sections}
      </body>
    </html>
  `;
};

  const loadAssignments = async () => {
    try {
      const assignments = await assignmentService.getAllAssignments();
      const assignedIds = new Set(assignments.map(a => a.inspection_id));
      setAssignedInspections(assignedIds);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadInspections = async () => {
    try {
      setLoading(true);
      const allInspections = await InspectionsService.getAllInspections();
      setInspections(allInspections);
    } catch (error) {
      console.error('Error loading inspections:', error);
      Alert.alert('Error', 'Failed to load inspections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const allInspections = await InspectionsService.getAllInspections();
      setInspections(allInspections);
    } catch (error) {
      console.error('Error refreshing inspections:', error);
      Alert.alert('Error', 'Failed to refresh inspections. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  

  const handleExportAsPDF = async (inspection) => {
    const html = generateInspectionHtml(inspection);

    try {
        if (Platform.OS === 'web') {
            // Use html2pdf.js for web
            const element = document.createElement('div');
            element.innerHTML = html;

            const options = {
                margin: 1,
                filename: `${inspection.title}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };

            html2pdf().set(options).from(element).save();
        } else {
            // Use expo-print for native platforms
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        Alert.alert('Error', 'Failed to export PDF');
    }
};

  // CHANGED: View details => open modal instead of navigation
  const openDetailsModal = async (inspection: Inspection) => {
    // fetch a fresh copy to ensure up-to-date template/responses from Supabase
    const fresh = await InspectionsService.getInspectionById(inspection.id);
    setViewedInspection(fresh || inspection);
    setViewModalVisible(true);
  };

  const handleCreateNewInspection = () => {
    navigation.navigate('NewInspection');
  };

  const isInspectionAssigned = (inspection: Inspection) => {
    if (assignedInspections.has(inspection.id)) return true;
    return (
      !!inspection.inspector &&
      inspection.inspector !== 'Unknown Inspector' &&
      inspection.inspector.trim() !== ''
    );
  };

  const handleAssignInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowAssignModal(true);
    setSelectedInspector(null);
    setDueDate('');
    setAssignmentNotes('');
    setAssignmentPriority('medium');
  };

  const handleSubmitAssignment = async () => {
    if (!selectedInspection || !selectedInspector || !user) {
      Alert.alert('Error', 'Please select an inspector and ensure all fields are filled.');
      return;
    }
    try {
      await assignmentService.createAssignment(
        {
          inspection_id: selectedInspection.id,
          assigned_to: selectedInspector.id,
          due_date: dueDate || null,
          notes: assignmentNotes || null,
          priority: assignmentPriority,
        },
        user.id
      );
      Alert.alert('Success', `Inspection assigned to ${selectedInspector.full_name} successfully!`);
      setShowAssignModal(false);
      await loadInspections();
      await loadAssignments();
    } catch (error) {
      console.error('Error assigning inspection:', error);
      Alert.alert('Error', 'Failed to assign inspection. Please try again.');
    }
  };

  // Export to PDF for one inspection (uses template+responses)
  const LABEL_MAP: Record<string, string> = {
  title: 'Title',
  location: 'Location',
  inspector: 'Inspector',
  date: 'Date',
  time: 'Time',
};

// Filtering
  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(i => i.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q) ||
        i.categories.some(c => c.toLowerCase().includes(q)) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [inspections, searchQuery, selectedFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'in-progress': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={theme.colors.success} />;
      case 'pending': return <Clock size={16} color={theme.colors.warning} />;
      case 'in-progress': return <AlertTriangle size={16} color={theme.colors.info} />;
      default: return <FileText size={16} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      default: return status.replace('-', ' ');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <YStack gap="$4" paddingBottom="$8">
          {/* Header */}
          <YStack gap="$2">
            <XStack alignItems="center" justifyContent="space-between">
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.colors.text }}>
                Inspections
              </Text>
              <Button
                backgroundColor={theme.colors.primary}
                color="white"
                icon={<Plus size={20} />}
                borderRadius="$6"
                onPress={handleCreateNewInspection}
              >
                New
              </Button>
            </XStack>

            <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
              Manage and track all safety inspections
            </Text>
          </YStack>

          {/* Search & Filter */}
          <YStack gap="$3">
            <XStack gap="$3" alignItems="center">
              <View style={{ flex: 1, position: 'relative' }}>
                <TextInput
                  placeholder="Search inspections..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingLeft: 40,
                    paddingRight: 16,
                    paddingVertical: isTablet ? 16 : 12,
                    fontSize: isTablet ? 16 : 14,
                    color: theme.colors.text,
                    minHeight: isTablet ? 48 : 40,
                  }}
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Search
                  size={20}
                  color={theme.colors.textSecondary}
                  style={{ position: 'absolute', left: 12, top: isTablet ? 14 : 10 }}
                />
                {searchQuery.trim() && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 12, top: isTablet ? 14 : 10 }}
                  >
                    <Text style={{ fontSize: 18, color: theme.colors.textSecondary }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                backgroundColor={theme.colors.surface}
                borderColor={theme.colors.border}
                borderWidth={1}
                icon={<Filter size={20} color={theme.colors.text} />}
              >
                Filter
              </Button>
            </XStack>

            {/* Filter tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2">
                {(['all', 'pending', 'in-progress', 'completed'] as const).map(filter => (
                  <TouchableOpacity key={filter} onPress={() => setSelectedFilter(filter)}>
                    <View
                      style={{
                        backgroundColor: selectedFilter === filter ? theme.colors.primary : theme.colors.surface,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: selectedFilter === filter ? theme.colors.primary : theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedFilter === filter ? 'white' : theme.colors.text,
                          fontSize: 14,
                          fontWeight: '500',
                          textTransform: 'capitalize',
                        }}
                      >
                        {filter}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          {/* Results counter */}
          {(searchQuery.trim() || selectedFilter !== 'all') && (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' }}>
                {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {loading ? (
                <Card backgroundColor={theme.colors.surface} padding="$4">
                  <YStack alignItems="center" padding="$4">
                    <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>Loading inspections...</Text>
                  </YStack>
                </Card>
              ) : filteredInspections.length > 0 ? (
                filteredInspections.map(inspection => (
                  <TouchableOpacity key={inspection.id} onPress={() => openDetailsModal(inspection)}>
                    <Card
                      backgroundColor={theme.colors.surface}
                      borderColor={theme.colors.border}
                      padding="$4"
                      borderLeftWidth={4}
                      borderLeftColor={getPriorityColor(inspection.priority)}
                    >
                      <YStack gap="$3">
                        {/* Header */}
                        <XStack alignItems="flex-start" justifyContent="space-between">
                          <YStack gap="$1" flex={1}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                              {inspection.title}
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                              {inspection.description}
                            </Text>
                          </YStack>

                          <View
                            style={{
                              backgroundColor: getStatusColor(inspection.status) + '20',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {getStatusIcon(inspection.status)}
                            <Text
                              style={{
                                color: getStatusColor(inspection.status),
                                fontSize: 12,
                                fontWeight: '500',
                                textTransform: 'capitalize',
                              }}
                            >
                              {getStatusDisplayText(inspection.status)}
                            </Text>
                          </View>
                        </XStack>

                        {/* Details */}
                        <YStack gap="$2">
                          <XStack alignItems="center" gap="$4" flexWrap="wrap">
                            <XStack alignItems="center" gap="$2">
                              <MapPin size={16} color={theme.colors.textSecondary} />
                              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                                {inspection.location}
                              </Text>
                            </XStack>

                            <XStack alignItems="center" gap="$2">
                              <Calendar size={16} color={theme.colors.textSecondary} />
                              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                                {inspection.date} at {inspection.time}
                              </Text>
                            </XStack>

                            <XStack alignItems="center" gap="$2">
                              <User size={16} color={theme.colors.textSecondary} />
                              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                                {inspection.inspector}
                              </Text>
                            </XStack>
                          </XStack>

                          {/* Categories */}
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <XStack gap="$2">
                              {inspection.categories.map((category, index) => (
                                <View
                                  key={index}
                                  style={{
                                    backgroundColor: theme.colors.primaryLight + '40',
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '500' }}
                                  >
                                    {category}
                                  </Text>
                                </View>
                              ))}
                            </XStack>
                          </ScrollView>

                          {/* Score & Issues */}
                          {inspection.status === 'completed' && (
                            <XStack alignItems="center" justifyContent="space-between">
                              <XStack alignItems="center" gap="$2">
                                <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Score:</Text>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color:
                                      inspection.score !== null && inspection.score >= 90
                                        ? theme.colors.success
                                        : inspection.score !== null && inspection.score >= 75
                                        ? theme.colors.warning
                                        : theme.colors.error,
                                  }}
                                >
                                  {inspection.score !== null ? `${inspection.score}%` : 'N/A'}
                                </Text>
                              </XStack>

                              {inspection.issues > 0 && (
                                <XStack alignItems="center" gap="$2">
                                  <AlertTriangle size={16} color={theme.colors.warning} />
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      color: theme.colors.warning,
                                      fontWeight: '500',
                                    }}
                                  >
                                    {inspection.issues} issue{inspection.issues !== 1 ? 's' : ''}
                                  </Text>
                                </XStack>
                              )}
                            </XStack>
                          )}
                        </YStack>

                        {/* Actions */}
                        <XStack gap="$2" marginTop="$2">
                          <Button
                            size="$3"
                            backgroundColor={theme.colors.surface}
                            borderColor={theme.colors.border}
                            borderWidth={1}
                            color={theme.colors.text}
                            icon={<FileText size={16} />}
                            flex={1}
                            onPress={() => openDetailsModal(inspection)}
                          >
                            View Details
                          </Button>

                          <Button
                            size="$3"
                            backgroundColor={theme.colors.surface}
                            borderColor={theme.colors.border}
                            borderWidth={1}
                            color={theme.colors.text}
                            icon={<Download size={16} />}
                            flex={1}
                            onPress={async () => {
                              const freshInspection = await InspectionsService.getInspectionById(inspection.id);
                              if (freshInspection) {
                                await handleExportAsPDF(freshInspection);
                              }
                            }}
                          >
                            Export PDF
                          </Button>

                          {isAdmin() && inspection.status === 'pending' && !isInspectionAssigned(inspection) && (
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={(event) => {
                                event.stopPropagation();
                                handleAssignInspection(inspection);
                              }}
                            >
                              <Button
                                size="$3"
                                backgroundColor={theme.colors.info}
                                color="white"
                                icon={<UserPlus size={16} />}
                                flex={1}
                                disabled={false}
                              >
                                Assign
                              </Button>
                            </TouchableOpacity>
                          )}

                          {inspection.status !== 'completed' && !isAdmin() && (
                            <Button
                              size="$3"
                              backgroundColor={theme.colors.primary}
                              color="white"
                              icon={<Camera size={16} />}
                              flex={1}
                            >
                              Continue
                            </Button>
                          )}
                        </XStack>
                      </YStack>
                    </Card>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 18, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 8 }}>
                    No inspections found
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
                    {searchQuery.trim()
                      ? `No inspections match "${searchQuery}"`
                      : `No ${selectedFilter !== 'all' ? selectedFilter + ' ' : ''}inspections available`}
                  </Text>
                </View>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </ScrollView>

      {/* ASSIGN MODAL (component) */}
      <AssignModal
        visible={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        inspection={selectedInspection}
        availableInspectors={availableInspectors}
        selectedInspector={selectedInspector}
        setSelectedInspector={setSelectedInspector}
        dueDate={dueDate}
        setDueDate={setDueDate}
        notes={assignmentNotes}
        setNotes={setAssignmentNotes}
        priority={assignmentPriority}
        setPriority={setAssignmentPriority}
        onSubmit={handleSubmitAssignment}
        isTablet={isTablet}
      />

      {/* DETAILS MODAL (component) */}
      <InspectionDetailsModal
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        inspection={viewedInspection}
        onExportPdf={handleExportAsPDF}
      />
    </ScreenContainer>
  );
}
