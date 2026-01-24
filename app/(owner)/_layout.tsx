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
      <Stack.Screen name="site/[id]" />
      <Stack.Screen name="site-detail" />
      <Stack.Screen name="site-qr/[siteId]" />
      <Stack.Screen name="stock/[siteId]" />
      <Stack.Screen name="bills/[siteId]" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
