import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  // Simulate loading
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Replace with your actual loading logic
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (!loading) return null; // Hide splash when done

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Image source={require('../assets/icons/OCP-Group.svg')} style={{ width: 120, height: 120 }} />
      <ActivityIndicator size="large" color="#33A12C" style={{ marginTop: 24 }} />
    </View>
  );
}