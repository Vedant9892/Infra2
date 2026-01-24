import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function SupervisorLayout() {
  useEffect(() => {
    console.log('SupervisorNavigator mounted');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="approve-work" />
      <Stack.Screen name="access-control" />
      <Stack.Screen name="stock/[siteId]" />
      <Stack.Screen name="bills/[siteId]" />
      <Stack.Screen name="face-attendance/[siteId]" />
    </Stack>
  );
}
