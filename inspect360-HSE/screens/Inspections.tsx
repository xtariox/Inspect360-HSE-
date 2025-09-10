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
    // Helper function to format field values based on type
    const formatFieldValue = (field, response) => {
      if (!response || response.value === null || response.value === undefined) {
        return 'N/A';
      }

      const value = response.value;
      
      switch (field.type) {
        case 'image':
        case 'photo':
          if (typeof value === 'string' && value.startsWith('data:image/')) {
            return `<img src="${value}" alt="${field.label}" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;" />`;
          } else if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('file://'))) {
            return `<img src="${value}" alt="${field.label}" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;" />`;
          }
          return 'Image not available';
          
        case 'boolean':
        case 'checkbox':
          return value ? '✓ Yes' : '✗ No';
          
        case 'rating':
        case 'score':
          const rating = parseInt(value);
          const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          return `${stars} (${rating}/5)`;
          
        case 'date':
          return new Date(value).toLocaleDateString();
          
        case 'datetime':
          return new Date(value).toLocaleString();
          
        case 'number':
          return parseFloat(value).toFixed(2);
          
        case 'select':
        case 'dropdown':
          return Array.isArray(value) ? value.join(', ') : value;
          
        case 'textarea':
          return value.replace(/\n/g, '<br>');
          
        default:
          return Array.isArray(value) ? value.join(', ') : value;
      }
    };

    // Generate basic inspection information
    const basicFields = Object.keys(inspection)
      .filter(key => !['template', 'responses', 'images'].includes(key))
      .map((key) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        const value = inspection[key] ?? 'N/A';
        return `
          <tr>
            <td style="padding:8px; border:1px solid #ddd; font-weight:bold; background-color:#f9f9f9; width: 30%;">${label}</td>
            <td style="padding:8px; border:1px solid #ddd;">${Array.isArray(value) ? value.join(', ') : value}</td>
          </tr>
        `;
      }).join('');

    // Generate sections with all field types
    const sections = inspection.template?.sections?.map((section, sectionIndex) => {
      const fieldsHtml = section.fields?.map((field) => {
        const response = inspection.responses?.find((r) => r.fieldId === field.id);
        const formattedValue = formatFieldValue(field, response);
        
        return `
          <tr>
            <td style="padding:8px; border:1px solid #ddd; font-weight:bold; background-color:#f9f9f9; width: 30%;">
              ${field.label}
              ${field.required ? '<span style="color: red;">*</span>' : ''}
            </td>
            <td style="padding:8px; border:1px solid #ddd; vertical-align: top;">
              ${formattedValue}
              ${field.description ? `<br><small style="color: #666; font-style: italic;">${field.description}</small>` : ''}
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="2" style="padding:8px; text-align:center; color:#666;">No fields in this section</td></tr>';

      return `
        <div style="page-break-inside: avoid; margin-bottom: 30px;">
          <h2 style="margin-top:30px; color:#2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            Section ${sectionIndex + 1}: ${section.title || 'Untitled Section'}
          </h2>
          ${section.description ? `<p style="color:#6b7280; margin: 12px 0; font-style: italic;">${section.description}</p>` : ''}
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color:#f8fafc;">
                <th style="padding:12px 8px; border:1px solid #d1d5db; background-color:#f1f5f9; font-weight: 600;">Field</th>
                <th style="padding:12px 8px; border:1px solid #d1d5db; background-color:#f1f5f9; font-weight: 600;">Response</th>
              </tr>
            </thead>
            <tbody>
              ${fieldsHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('') || '<p style="color:#666; font-style: italic;">No sections found in this inspection template.</p>';

    // Generate images section if images exist
    const imagesSection = inspection.images && inspection.images.length > 0 ? `
      <div style="page-break-before: auto; margin-top: 40px;">
        <h2 style="color:#2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Inspection Images</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
          ${inspection.images.map((image, index) => `
            <div style="text-align: center; border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px;">
              <img src="${image.url || image.uri}" alt="Inspection Image ${index + 1}" 
                   style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 8px;" />
              <p style="font-size: 12px; color: #6b7280; margin: 0;">${image.caption || `Image ${index + 1}`}</p>
              ${image.timestamp ? `<p style="font-size: 10px; color: #9ca3af; margin: 4px 0 0 0;">${new Date(image.timestamp).toLocaleString()}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Generate summary section for critical issues
    const criticalIssues = inspection.responses?.filter(r => {
      const field = inspection.template?.sections
        ?.flatMap(s => s.fields)
        ?.find(f => f.id === r.fieldId);
      return field?.type === 'boolean' && r.value === false && field?.critical;
    }) || [];

    const criticalIssuesSection = criticalIssues.length > 0 ? `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center;">
          ⚠️ Critical Issues Found (${criticalIssues.length})
        </h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${criticalIssues.map(issue => {
            const field = inspection.template?.sections
              ?.flatMap(s => s.fields)
              ?.find(f => f.id === issue.fieldId);
            return `<li style="color: #dc2626; margin-bottom: 4px;">${field?.label || 'Unknown Field'}</li>`;
          }).join('')}
        </ul>
      </div>
    ` : '';

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${inspection.title} - Inspection Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              color: #1f2937;
              line-height: 1.6;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .company-logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 8px;
            }
            h1 {
              color: #1e40af;
              margin: 16px 0;
              font-size: 28px;
              font-weight: 700;
            }
            h2 {
              color: #2563eb;
              margin-top: 32px;
              margin-bottom: 16px;
              font-size: 20px;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }
            h3 {
              color: #374151;
              margin-top: 24px;
              margin-bottom: 12px;
              font-size: 16px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            th, td {
              padding: 12px 8px;
              border: 1px solid #d1d5db;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 600;
              color: #374151;
            }
            .summary-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin: 20px 0;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-logo">INSPECT360 HSE</div>
            <h1>${inspection.title}</h1>
            <p style="color: #6b7280; margin: 8px 0;">Safety Inspection Report</p>
            <p style="color: #6b7280; font-size: 14px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <!-- Executive Summary -->
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-value" style="color: ${inspection.score >= 90 ? '#059669' : inspection.score >= 75 ? '#d97706' : '#dc2626'}">${inspection.score ?? 'N/A'}%</div>
              <div class="stat-label">Compliance Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: ${inspection.issues === 0 ? '#059669' : '#dc2626'}">${inspection.issues ?? 0}</div>
              <div class="stat-label">Issues Found</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: ${inspection.status === 'completed' ? '#059669' : inspection.status === 'in-progress' ? '#d97706' : '#6b7280'}">${inspection.status?.toUpperCase()}</div>
              <div class="stat-label">Status</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #2563eb">${inspection.template?.sections?.length ?? 0}</div>
              <div class="stat-label">Sections</div>
            </div>
          </div>

          ${criticalIssuesSection}

          <!-- Basic Information -->
          <h2>Inspection Details</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Status</td>
                <td>${inspection.status}</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Location</td>
                <td>${inspection.location}</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Date & Time</td>
                <td>${inspection.date} at ${inspection.time}</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Inspector</td>
                <td>${inspection.inspector}</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Score</td>
                <td>${inspection.score ?? 'N/A'}%</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Issues</td>
                <td>${inspection.issues ?? 0}</td>
              </tr>
              <tr>
                <td style="font-weight:bold; background-color:#f9f9f9;">Description</td>
                <td>${inspection.description || 'N/A'}</td>
              </tr>
              ${basicFields}
            </tbody>
          </table>

          ${sections}
          ${imagesSection}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This report was generated automatically by Inspect360 HSE on ${new Date().toLocaleString()}</p>
            <p>Report ID: ${inspection.id}</p>
          </div>
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
