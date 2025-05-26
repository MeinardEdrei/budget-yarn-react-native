import { useApi } from '@/hooks/useApi';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export default function HomeScreen() {
  const { fetchExpenses, clearAllExpenses } = useApi();
  const [budgetType, setBudgetType] = useState<'weekly' | 'monthly' | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const loadData = async () => {
    try {
      const type = await AsyncStorage.getItem('budget_type');
      const storedBudget = await AsyncStorage.getItem('budget_amount');

      setBudgetType((type as 'weekly' | 'monthly') || null);
      setBudget(storedBudget ? parseFloat(storedBudget) : 0);

      // Fetch expenses from the backend
      const expensesData = await fetchExpenses();
      if (Array.isArray(expensesData)) {
        setExpenses(expensesData as Expense[]);
        const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalExpenses(total);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
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
  const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // Get recent expenses (last 5)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Budget status functions
  const getBudgetStatus = () => {
    if (remaining < 0) return 'exceeded';
    if (percentageUsed >= 90) return 'critical';
    if (percentageUsed >= 75) return 'warning';
    if (percentageUsed >= 50) return 'caution';
    return 'good';
  };

  const getBudgetStatusColor = () => {
    const status = getBudgetStatus();
    switch (status) {
      case 'exceeded': return '#d32f2f';
      case 'critical': return '#f57c00';
      case 'warning': return '#fbc02d';
      case 'caution': return '#689f38';
      default: return '#2e7d32';
    }
  };

  const getBudgetMessage = () => {
    const status = getBudgetStatus();
    switch (status) {
      case 'exceeded':
        return `⚠️ Budget exceeded by ₱${Math.abs(remaining).toFixed(2)}`;
      case 'critical':
        return `🚨 Only ₱${remaining.toFixed(2)} left (${(100 - percentageUsed).toFixed(1)}%)`;
      case 'warning':
        return `⚡ Low budget: ₱${remaining.toFixed(2)} remaining`;
      case 'caution':
        return `📊 Half budget used - ₱${remaining.toFixed(2)} left`;
      default:
        return `✅ Budget on track - ₱${remaining.toFixed(2)} remaining`;
    }
  };

  const handleEditBudget = () => {
    Alert.alert(
      'Edit Budget',
      'Do you want to change your budget amount or budget type?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Amount',
          onPress: () => router.push('/budget-setup')
        },
        {
          text: 'Change Type',
          onPress: () => router.push('/onboarding')
        }
      ]
    );
  };

  const resetBudget = () => {
    Alert.alert(
      'Reset Budget Period',
      `Are you sure you want to reset your ${budgetType} budget? This will clear all current expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllExpenses(); // Clear all expenses from the backend
              setExpenses([]); // Reset the local state
              setTotalExpenses(0); // Reset the total expenses
              Alert.alert('Success', 'Budget period reset successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset budget');
            }
          }
        }
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <Text style={styles.expenseCategory}>{item.category}</Text>
      <Text style={styles.expenseAmount}>₱ {item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fefefe' }}>
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎓 Welcome, Student!</Text>
        <TouchableOpacity onPress={handleEditBudget} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {budgetType && (
        <Text style={styles.subtext}>
          You're on a <Text style={styles.bold}>{budgetType}</Text> budget.
        </Text>
      )}

      {/* Budget Status Alert */}
      {getBudgetStatus() !== 'good' && (
        <View style={[styles.alertCard, { borderLeftColor: getBudgetStatusColor() }]}>
          <Text style={[styles.alertText, { color: getBudgetStatusColor() }]}>
            {getBudgetMessage()}
          </Text>
        </View>
      )}
      
      <View style={styles.card}>
        <View style={styles.budgetHeader}>
          <Text style={styles.label}>Budget Overview</Text>
          <TouchableOpacity onPress={resetBudget} style={styles.resetButton}>
            <MaterialIcons name="refresh" size={16} color="#666" />
            <Text style={styles.resetText}>Reset Period</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(percentageUsed, 100)}%`,
                  backgroundColor: getBudgetStatusColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {percentageUsed.toFixed(1)}% used
          </Text>
        </View>
        
        <View style={styles.budgetRow}>
          <View style={styles.budgetItem}>
            <Text style={styles.label}>Total Budget</Text>
            <Text style={styles.amount}>₱ {budget.toFixed(2)}</Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={styles.label}>Spent</Text>
            <Text style={[styles.amount, { color: '#f44336' }]}>₱ {totalSpent.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.remainingContainer}>
          <Text style={styles.label}>Remaining</Text>
          <Text style={[
            styles.remainingAmount, 
            { color: getBudgetStatusColor() }
          ]}>
            ₱ {remaining.toFixed(2)}
          </Text>
        </View>

        {/* Daily/Weekly allowance suggestion */}
        {remaining > 0 && (
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>
              💡 Suggested {budgetType === 'weekly' ? 'daily' : 'weekly'} limit: 
              ₱{(remaining / (budgetType === 'weekly' ? 7 : 4)).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {recentExpenses.length > 0 && (
        <View style={styles.recentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
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

      {expenses.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your spending!</Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => router.push('/(tabs)/add-expense')}
          >
            <MaterialIcons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addFirstText}>Add First Expense</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: '#fefefe' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  subtext: { 
    fontSize: 16, 
    marginBottom: 24,
    color: '#666',
  },
  bold: { 
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: { 
    padding: 20, 
    borderRadius: 12, 
    backgroundColor: '#fff', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resetText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetItem: {
    flex: 1,
  },
  label: { 
    fontSize: 14, 
    color: '#555',
    marginBottom: 4,
  },
  amount: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
  },
  remainingContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remainingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  suggestionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addFirstText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  expenseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});