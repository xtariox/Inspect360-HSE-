import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility that works on both web and mobile
 */
export class CrossPlatformAlert {
  /**
   * Show a simple alert message
   */
  static alert(title: string, message?: string): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // For web, combine title and message
      const fullMessage = message ? `${title}\n\n${message}` : title;
      window.alert(fullMessage);
    } else {
      // For mobile, use React Native Alert
      Alert.alert(title, message);
    }
  }

  /**
   * Show a confirmation dialog
   */
  static confirm(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // For web, use window.confirm
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    } else {
      // For mobile, use React Native Alert with buttons
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: 'OK',
            onPress: onConfirm,
          },
        ]
      );
    }
  }

  /**
   * Show a destructive confirmation dialog (for delete actions)
   */
  static destructiveConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Delete'
  ): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // For web, use window.confirm
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    } else {
      // For mobile, use React Native Alert with destructive style
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: confirmText,
            style: 'destructive',
            onPress: onConfirm,
          },
        ]
      );
    }
  }
}
