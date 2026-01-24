import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function SupervisorLayout() {
  useEffect(() => {
    console.log('SupervisorNavigator mounted');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="tasks" />
    </Stack>
  );
}
