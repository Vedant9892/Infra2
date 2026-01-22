import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="register" />
      <Stack.Screen name="sites" />
      <Stack.Screen name="add-site" />
    </Stack>
  );
}
