import React, { useState } from 'react';
import { TextInput, View, Platform, TouchableOpacity, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FormFieldProps } from '../../types/inspection';

interface DateTimeInputProps extends FormFieldProps {
  isTablet?: boolean;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({ 
  field, 
  value, 
  onChange, 
  showValidation = false,
  readOnly = false,
  theme,
  isTablet = false 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Convert string value to Date object
  const getDateValue = (): Date => {
    if (!value) return new Date();
    
    if (field.type === 'date') {
      // Handle date string (YYYY-MM-DD)
      return new Date(value + 'T00:00:00');
    } else if (field.type === 'time') {
      // Handle time string (HH:MM)
      const today = new Date();
      const [hours, minutes] = value.split(':').map(Number);
      today.setHours(hours || 0, minutes || 0, 0, 0);
      return today;
    }
    
    return new Date(value);
  };

  // Format Date object to string for storage
  const formatDateForStorage = (date: Date): string => {
    if (field.type === 'date') {
      // Return in YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    } else if (field.type === 'time') {
      // Return in HH:MM format
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return date.toISOString();
  };

  // Format value for display
  const getDisplayValue = (): string => {
    if (!value) return '';
    
    if (field.type === 'date') {
      const date = new Date(value + 'T00:00:00');
      return date.toLocaleDateString();
    } else if (field.type === 'time') {
      return value; // Time is already in HH:MM format
    }
    
    return value;
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    // On web, the event.target.value contains the formatted string from HTML5 input
    if (Platform.OS === 'web' && event?.target?.value !== undefined) {
      console.log('🌐 Web date/time change:', event.target.value);
      onChange(event.target.value);
      return;
    }
    
    // On mobile platforms
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const formattedValue = formatDateForStorage(selectedDate);
      console.log('📱 Mobile date/time change:', formattedValue);
      onChange(formattedValue);
    }
  };

  const handlePress = () => {
    if (readOnly) {
      // Don't open picker in read-only mode
      return;
    }
    
    if (Platform.OS === 'web') {
      // On web, the picker is always visible, no need to toggle
      return;
    }
    setShowPicker(true);
  };

  const getBorderColor = () => {
    if (readOnly) {
      return theme.colors.border;
    }
    if (showValidation && field.required && !value) {
      return theme.colors.error;
    }
    if (value && field.required) {
      return theme.colors.success;
    }
    return theme.colors.border;
  };

  const getPickerMode = () => {
    if (field.type === 'date') return 'date';
    if (field.type === 'time') return 'time';
    return 'date';
  };

  // For web, use HTML5 input elements (DateTimePicker doesn't support web)
  if (Platform.OS === 'web') {
    const getInputType = () => {
      switch (field.type) {
        case 'date':
          return 'date';
        case 'time':
          return 'time';
        default:
          return 'text';
      }
    };

    return (
      <View style={{
        backgroundColor: readOnly ? theme.colors.background : theme.colors.surface,
        borderColor: getBorderColor(),
        borderWidth: 1,
        borderRadius: 8,
        padding: isTablet ? 16 : 12,
        minHeight: isTablet ? 48 : 40,
        justifyContent: 'center',
        opacity: readOnly ? 0.6 : 1,
      }}>
        {readOnly ? (
          <Text
            style={{
              fontSize: isTablet ? 16 : 14,
              color: theme.colors.textSecondary,
            }}
          >
            {value ? getDisplayValue() : (field.placeholder || field.label)}
          </Text>
        ) : (
          <TextInput
            placeholder={field.placeholder || field.label}
            value={value || ''}
            onChange={handleDateTimeChange}
            style={{
              backgroundColor: 'transparent',
              fontSize: isTablet ? 16 : 14,
              color: theme.colors.text,
              width: '100%',
              padding: 0,
            }}
            // @ts-ignore - Web-specific props
            type={getInputType()}
            disabled={readOnly}
          />
        )}
      </View>
    );
  }

  // For mobile, use native pickers with TouchableOpacity trigger
  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        disabled={readOnly}
        style={{
          backgroundColor: readOnly ? theme.colors.background : theme.colors.surface,
          borderColor: getBorderColor(),
          borderWidth: 1,
          borderRadius: 8,
          padding: isTablet ? 16 : 12,
          minHeight: isTablet ? 48 : 40,
          justifyContent: 'center',
          opacity: readOnly ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            fontSize: isTablet ? 16 : 14,
            color: value ? (readOnly ? theme.colors.textSecondary : theme.colors.text) : theme.colors.textSecondary,
          }}
        >
          {value ? getDisplayValue() : (field.placeholder || field.label)}
        </Text>
      </TouchableOpacity>

      {showPicker && !readOnly && (
        <DateTimePicker
          value={getDateValue()}
          mode={getPickerMode()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateTimeChange}
          textColor={theme.colors.text}
          {...(Platform.OS === 'ios' && {
            onTouchCancel: () => setShowPicker(false)
          })}
        />
      )}
    </View>
  );
};
