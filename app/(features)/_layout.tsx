import { Stack } from 'expo-router';

export default function FeaturesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="work-logs" />
      <Stack.Screen name="stock" />
      <Stack.Screen name="gst-bills" />
      <Stack.Screen name="contractors" />
      <Stack.Screen name="face-recall" />
      <Stack.Screen name="permit-otp" />
      <Stack.Screen name="petty-cash" />
      <Stack.Screen name="consumption-variance" />
      <Stack.Screen name="owner-dashboard" />
      <Stack.Screen name="tool-library" />
    </Stack>
  );
}
