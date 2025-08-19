import { Stack } from 'expo-router';

export default function FoodLayout() {
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
          title: 'Food Log',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="history" 
        options={{
          title: 'Food History',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}