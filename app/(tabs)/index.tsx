import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export default function HomeScreen() {
  const [budgetType, setBudgetType] = useState<'weekly' | 'monthly' | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const type = await AsyncStorage.getItem('budget_type');
      const storedBudget = await AsyncStorage.getItem('budget_amount');
      const storedExpenses = await AsyncStorage.getItem('expenses');
      
      setBudgetType((type as 'weekly' | 'monthly') || null);
      setBudget(storedBudget ? parseFloat(storedBudget) : 0);
      setExpenses(storedExpenses ? JSON.parse(storedExpenses) : []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget - totalSpent;

  // Get recent expenses (last 5)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>🎓 Welcome, Student!</Text>
      
      {budgetType && (
        <Text style={styles.subtext}>
          You're on a <Text style={styles.bold}>{budgetType}</Text> budget.
        </Text>
      )}
      
      <View style={styles.card}>
        <Text style={styles.label}>Total Budget</Text>
        <Text style={styles.amount}>₱ {budget.toFixed(2)}</Text>
        
        <Text style={styles.label}>Spent</Text>
        <Text style={styles.amount}>₱ {totalSpent.toFixed(2)}</Text>
        
        <Text style={styles.label}>Remaining</Text>
        <Text style={[styles.amount, remaining < 0 && styles.negative]}>
          ₱ {remaining.toFixed(2)}
        </Text>
      </View>

      {remaining < 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>⚠️ You've exceeded your budget!</Text>
        </View>
      )}

      {recentExpenses.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseAmount}>₱ {expense.amount.toFixed(2)}</Text>
              </View>
              {expense.note && (
                <Text style={styles.expenseNote}>{expense.note}</Text>
              )}
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: '#fefefe' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  subtext: { 
    fontSize: 16, 
    marginBottom: 24 
  },
  bold: { 
    fontWeight: 'bold' 
  },
  card: { 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: '#fff', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { 
    fontSize: 14, 
    color: '#555',
    marginBottom: 4,
  },
  amount: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  negative: { 
    color: 'red' 
  },
  warningCard: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  warningText: {
    color: '#c62828',
    fontWeight: '600',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  expenseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  expenseNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});