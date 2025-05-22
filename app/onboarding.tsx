import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Onboarding() {
  const handleSelect = async (type: 'weekly' | 'monthly') => {
    await AsyncStorage.setItem('budget_type', type);
    router.push('/budget-setup');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you want to manage your student budget?</Text>
      
      <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect('weekly')}>
        <Text style={styles.optionText}>Weekly</Text>
        <Text style={styles.subtext}>Track your budget week by week</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect('monthly')}>
        <Text style={styles.optionText}>Monthly</Text>
        <Text style={styles.subtext}>Plan your expenses for the whole month</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#333',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  optionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2e7d32',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});