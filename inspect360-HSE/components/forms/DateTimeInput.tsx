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
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const formattedValue = formatDateForStorage(selectedDate);
      onChange(formattedValue);
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      // On web, we'll fall back to HTML5 input
      return;
    }
    setShowPicker(true);
  };

  const getBorderColor = () => {
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

  // For web, use HTML5 input types
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
      <View>
        <TextInput
          placeholder={field.placeholder || field.label}
          value={value || ''}
          onChangeText={onChange}
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderWidth: 1,
            borderRadius: 8,
            padding: isTablet ? 16 : 12,
            fontSize: isTablet ? 16 : 14,
            color: theme.colors.text,
            minHeight: isTablet ? 48 : 40,
          }}
          placeholderTextColor={theme.colors.textSecondary}
          {...(Platform.OS === 'web' && {
            // @ts-ignore - Web-specific props
            type: getInputType()
          })}
        />
      </View>
    );
  }

  // For mobile, use native pickers
  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: getBorderColor(),
          borderWidth: 1,
          borderRadius: 8,
          padding: isTablet ? 16 : 12,
          minHeight: isTablet ? 48 : 40,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: isTablet ? 16 : 14,
            color: value ? theme.colors.text : theme.colors.textSecondary,
          }}
        >
          {value ? getDisplayValue() : (field.placeholder || field.label)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={getDateValue()}
          mode={getPickerMode()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateTimeChange}
          {...(Platform.OS === 'ios' && {
            onTouchCancel: () => setShowPicker(false)
          })}
        />
      )}
    </View>
  );
};
