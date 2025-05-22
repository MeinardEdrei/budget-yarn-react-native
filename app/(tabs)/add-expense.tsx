import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const CATEGORIES = [
  '🍕 Food',
  '🚌 Transportation',
  '📚 School Supplies',
  '👕 Clothing',
  '🎬 Entertainment',
  '💊 Health',
  '☕ Coffee/Snacks',
  '📱 Phone/Internet',
  '🏠 Utilities',
  '🎁 Others'
];

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export default function AddExpense() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const clearForm = () => {
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setJustAdded(false);
  };

  const handleAddExpense = async () => {
    const expenseAmount = parseFloat(amount);
    
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category');
      return;
    }

    setLoading(true);

    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : [];

      const newExpense: Expense = {
        id: Date.now().toString(),
        amount: expenseAmount,
        category: selectedCategory,
        note: note.trim(),
        date: new Date().toISOString(),
      };

      expenses.push(newExpense);
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));

      // Clear the form immediately
      clearForm();
      setJustAdded(true);

      // Show success message
      Alert.alert(
        'Expense Added!', 
        `₱${expenseAmount.toFixed(2)} has been added to your expenses.`,
        [
          {
            text: 'Add Another',
            style: 'cancel'
          },
          {
            text: 'View Expenses',
            onPress: () => router.push('/(tabs)/expenses')
          }
        ]
      );

      // Hide success state after 2 seconds
      setTimeout(() => setJustAdded(false), 2000);

    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Expense</Text>

        {justAdded && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ Expense added successfully!</Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categorySelected
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note about this expense..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            (!amount || !selectedCategory || loading) && styles.addButtonDisabled
          ]}
          onPress={handleAddExpense}
          disabled={!amount || !selectedCategory || loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>

        {/* Quick Add Another Button */}
        {justAdded && (
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => setJustAdded(false)}
          >
            <Text style={styles.quickAddText}>Add Another Expense</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  categorySelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  quickAddButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  quickAddText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
});