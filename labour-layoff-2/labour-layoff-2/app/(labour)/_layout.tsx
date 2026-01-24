import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function LabourLayout() {
  useEffect(() => {
    // Temporary log: confirm Labour flow is mounted (not Owner)
    console.log('LabourNavigator mounted');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scan-qr" />
      <Stack.Screen name="manage-site/[siteId]" />
      <Stack.Screen name="attendance/[siteId]" />
      <Stack.Screen name="tasks/[siteId]" />
      <Stack.Screen name="documentation/[siteId]" />
      <Stack.Screen name="tools-diary/[siteId]" />
    </Stack>
  );
}
