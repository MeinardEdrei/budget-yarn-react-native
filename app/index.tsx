import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const budgetType = await AsyncStorage.getItem('budget_type');
        const budgetAmount = await AsyncStorage.getItem('budget_amount');
        
        if (budgetType && budgetAmount) {
          // User has completed full setup, go to home
          router.replace('/(tabs)');
        } else if (budgetType) {
          // User selected type but hasn't set budget, go to budget setup
          router.replace('/budget-setup');
        } else {
          // User hasn't started onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.replace('/onboarding');
      }
    };

    checkOnboardingStatus();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#2e7d32" />
    </View>
  );
}