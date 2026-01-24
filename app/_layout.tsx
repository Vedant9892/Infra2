import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UserProvider } from '../contexts/UserContext';
import { DataSyncProvider } from '../contexts/DataSyncContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <LanguageProvider>
      <UserProvider>
        <DataSyncProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(owner)" />
              <Stack.Screen name="(labour)" />
              <Stack.Screen name="(supervisor)" />
              <Stack.Screen name="(features)" />
            </Stack>
          </QueryClientProvider>
        </DataSyncProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
