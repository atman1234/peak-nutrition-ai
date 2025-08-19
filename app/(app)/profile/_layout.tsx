import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTintColor: 'white',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Profile',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="setup" 
        options={{
          title: 'Profile Setup',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}