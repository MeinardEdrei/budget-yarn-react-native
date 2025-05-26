import { useApi } from '@/hooks/useApi';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function ExpensesScreen() {
  const { fetchExpenses, deleteExpense, clearAllExpenses, updateExpense } = useApi();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');

  const loadExpenses = async () => {
    try {
      const expensesData = await fetchExpenses();
      if (Array.isArray(expensesData)) {
        setExpenses(expensesData as Expense[]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error loading expenses:', error); // Log the actual error
      Alert.alert('Error', 'Failed to fetch expenses. Please check your network connection or try again later.');
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Refresh expenses when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, []);

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditNote(expense.note);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingExpense(null);
    setEditAmount('');
    setEditCategory('');
    setEditNote('');
  };

  const saveEditedExpense = async () => {
    if (!editingExpense) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount');
      return;
    }

    if (!editCategory) {
      Alert.alert('Missing Category', 'Please select a category');
      return;
    }

    try {
      const updatedExpense = {
        amount,
        category: editCategory,
        note: editNote.trim(),
        date: editingExpense.date, // Keep the original date
      };

      await updateExpense(editingExpense.id, updatedExpense); // Call the API to update the expense
      const updatedExpenses = expenses.map((expense) =>
        expense.id === editingExpense.id ? { ...expense, ...updatedExpense } : expense
      );

      setExpenses(updatedExpenses); // Update the local state
      closeEditModal();
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense');
    }
  };

  const deleteExpenseHandler = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId); // Ensure the ID is passed as a string
      loadExpenses();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const clearAllExpensesHandler = () => {
    Alert.alert(
      'Clear All Expenses',
      'Are you sure you want to delete all expenses? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllExpenses(); // Clear all expenses from the backend
              setExpenses([]); // Reset the local state
              Alert.alert('Success', 'All expenses cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear expenses');
            }
          }
        }
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseAmount}>₱ {item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={18} color="#2e7d32" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteExpenseHandler(item.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={18} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.note && (
        <Text style={styles.expenseNote}>{item.note}</Text>
      )}
      
      <Text style={styles.expenseDate}>
        {new Date(item.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : 0), 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 0 }} />
      <View style={styles.header}>
        <Text style={styles.title}>All Expenses</Text>
        {expenses.length > 0 && (
          <TouchableOpacity onPress={clearAllExpensesHandler} style={styles.clearButton}>
            <MaterialIcons name="clear-all" size={20} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>
      
      {expenses.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>₱ {totalExpenses.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Add your first expense to start tracking!</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Edit Expense Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <TouchableOpacity onPress={saveEditedExpense} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currency}>₱</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
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
                      editCategory === category && styles.categorySelected
                    ]}
                    onPress={() => setEditCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      editCategory === category && styles.categoryTextSelected
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
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note about this expense..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    color: '#999',
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#ffebee',
  },
  expenseNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categorySelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2e7d32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});