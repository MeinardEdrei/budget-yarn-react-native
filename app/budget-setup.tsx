import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function BudgetSetup() {
  const [budgetType, setBudgetType] = useState<'weekly' | 'monthly'>('weekly');
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    const loadBudgetType = async () => {
      const type = await AsyncStorage.getItem('budget_type');
      if (type) {
        setBudgetType(type as 'weekly' | 'monthly');
      }
    };
    loadBudgetType();
  }, []);

  const handleSetBudget = async () => {
    const amount = parseFloat(budgetAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount');
      return;
    }

    try {
      await AsyncStorage.setItem('budget_amount', budgetAmount);
      await AsyncStorage.setItem('expenses', JSON.stringify([])); // Initialize empty expenses
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your {budgetType.charAt(0).toUpperCase() + budgetType.slice(1)} Budget</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Budget Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            style={styles.input}
            value={budgetAmount}
            onChangeText={setBudgetAmount}
            placeholder="0.00"
            keyboardType="numeric"
            autoFocus
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, !budgetAmount && styles.buttonDisabled]} 
        onPress={handleSetBudget}
        disabled={!budgetAmount}
      >
        <Text style={styles.buttonText}>Set Budget</Text>
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});