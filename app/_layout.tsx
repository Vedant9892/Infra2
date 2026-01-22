import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UserProvider } from '../contexts/UserContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <LanguageProvider>
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </QueryClientProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
