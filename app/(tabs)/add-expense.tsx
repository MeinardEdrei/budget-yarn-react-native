import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

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

const MONEY_SAVING_TIPS = [
  "🍳 Cook at home instead of eating out - save up to ₱200 per day!",
  "🚶 Walk or bike short distances to save on transportation costs",
  "📚 Buy second-hand books or borrow from classmates",
  "☕ Bring your own coffee/water bottle instead of buying drinks",
  "🎬 Look for student discounts on entertainment and activities",
  "📱 Use WiFi whenever possible to reduce data costs",
  "🛍️ Make a shopping list and stick to it to avoid impulse purchases",
  "💰 Set aside small amounts daily instead of large expenses",
  "🏪 Compare prices at different stores before buying",
  "📅 Plan your weekly expenses in advance"
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
  
  // Budget data
  const [budget, setBudget] = useState<number>(0);
  const [currentExpenses, setCurrentExpenses] = useState<number>(0);
  const [budgetType, setBudgetType] = useState<'weekly' | 'monthly' | null>(null);
  
  // Modal states
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<any>(null);

  const loadBudgetData = async () => {
    try {
      const storedBudget = await AsyncStorage.getItem('budget_amount');
      const storedType = await AsyncStorage.getItem('budget_type');
      const storedExpenses = await AsyncStorage.getItem('expenses');
      
      setBudget(storedBudget ? parseFloat(storedBudget) : 0);
      setBudgetType((storedType as 'weekly' | 'monthly') || null);
      
      if (storedExpenses) {
        const expenses: Expense[] = JSON.parse(storedExpenses);
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        setCurrentExpenses(total);
      } else {
        setCurrentExpenses(0);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  // Refresh budget data when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBudgetData();
    }, [])
  );

  const clearForm = () => {
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setJustAdded(false);
  };

  const checkBudgetOverflow = (expenseAmount: number): boolean => {
    if (budget === 0) return false; // No budget set
    return (currentExpenses + expenseAmount) > budget;
  };

  const getRemainingBudget = (): number => {
    return budget - currentExpenses;
  };

  const getRandomTips = (count: number = 3): string[] => {
    const shuffled = [...MONEY_SAVING_TIPS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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

    // Check for budget overflow
    if (checkBudgetOverflow(expenseAmount)) {
      const remainingBudget = getRemainingBudget();
      setPendingExpense({
        amount: expenseAmount,
        category: selectedCategory,
        note: note.trim()
      });
      
      setShowBudgetWarning(true);
      return;
    }

    // Proceed with normal expense addition
    await addExpenseToStorage(expenseAmount, selectedCategory, note.trim());
  };

  const addExpenseToStorage = async (expenseAmount: number, category: string, noteText: string) => {
    setLoading(true);

    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : [];

      const newExpense: Expense = {
        id: Date.now().toString(),
        amount: expenseAmount,
        category: category,
        note: noteText,
        date: new Date().toISOString(),
      };

      expenses.push(newExpense);
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));

      // Update current expenses
      setCurrentExpenses(prev => prev + expenseAmount);

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

  const handleBudgetWarningResponse = (action: 'add' | 'adjust' | 'cancel') => {
    setShowBudgetWarning(false);
    
    switch (action) {
      case 'add':
        // Add expense anyway and show tips
        if (pendingExpense) {
          addExpenseToStorage(pendingExpense.amount, pendingExpense.category, pendingExpense.note);
          setShowTipsModal(true);
        }
        break;
      case 'adjust':
        // Keep the form but suggest adjusting amount
        const remaining = getRemainingBudget();
        setAmount(remaining.toString());
        Alert.alert(
          'Amount Adjusted', 
          `Amount adjusted to ₱${remaining.toFixed(2)} to stay within budget.`
        );
        break;
      case 'cancel':
        // Do nothing, user can modify
        break;
    }
    
    setPendingExpense(null);
  };

  const increaseBudget = () => {
    setShowBudgetWarning(false);
    router.push('/budget-setup');
  };

  const BudgetWarningModal = () => {
    const remainingBudget = getRemainingBudget();
    const overAmount = pendingExpense ? pendingExpense.amount - remainingBudget : 0;
    
    return (
      <Modal
        visible={showBudgetWarning}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBudgetWarning(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.warningHeader}>
            <MaterialIcons name="warning" size={32} color="#f57c00" />
            <Text style={styles.warningTitle}>Budget Limit Exceeded!</Text>
          </View>
          
          <View style={styles.warningContent}>
            <Text style={styles.warningText}>
              This expense of <Text style={styles.highlightAmount}>₱{pendingExpense?.amount.toFixed(2)}</Text> will exceed your {budgetType} budget by <Text style={styles.exceedAmount}>₱{overAmount.toFixed(2)}</Text>.
            </Text>
            
            <View style={styles.budgetSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Budget:</Text>
                <Text style={styles.summaryValue}>₱{budget.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Already Spent:</Text>
                <Text style={styles.summaryValue}>₱{currentExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining:</Text>
                <Text style={[styles.summaryValue, { color: '#f44336' }]}>₱{remainingBudget.toFixed(2)}</Text>
              </View>
            </View>
            
            <Text style={styles.actionPrompt}>What would you like to do?</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.adjustButton}
              onPress={() => handleBudgetWarningResponse('adjust')}
            >
              <MaterialIcons name="tune" size={20} color="#2e7d32" />
              <Text style={styles.adjustButtonText}>Adjust Amount</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.increaseBudgetButton}
              onPress={increaseBudget}
            >
              <MaterialIcons name="trending-up" size={20} color="#1976d2" />
              <Text style={styles.increaseBudgetText}>Increase Budget</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.proceedButton}
              onPress={() => handleBudgetWarningResponse('add')}
            >
              <MaterialIcons name="warning" size={20} color="#f57c00" />
              <Text style={styles.proceedButtonText}>Add Anyway</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleBudgetWarningResponse('cancel')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const TipsModal = () => {
    const tips = getRandomTips();
    
    return (
      <Modal
        visible={showTipsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTipsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={32} color="#ffc107" />
            <Text style={styles.tipsTitle}>Money Saving Tips</Text>
            <Text style={styles.tipsSubtitle}>Since you've exceeded your budget, here are some tips to help you save:</Text>
          </View>
          
          <ScrollView style={styles.tipsContent}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
            
            <View style={styles.encouragementBox}>
              <Text style={styles.encouragementText}>
                💪 Remember, small changes in spending habits can lead to big savings over time!
              </Text>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeTipsButton}
            onPress={() => setShowTipsModal(false)}
          >
            <Text style={styles.closeTipsText}>Got it, Thanks!</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Expense</Text>

        {/* Budget Status Indicator */}
        {budget > 0 && (
          <View style={styles.budgetIndicator}>
            <Text style={styles.budgetIndicatorText}>
              Budget Remaining: <Text style={styles.remainingAmount}>₱{getRemainingBudget().toFixed(2)}</Text>
            </Text>
            <View style={styles.budgetBar}>
              <View 
                style={[
                  styles.budgetBarFill, 
                  { width: `${Math.min((currentExpenses / budget) * 100, 100)}%` }
                ]} 
              />
            </View>
          </View>
        )}

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
          {/* Show warning if amount exceeds remaining budget */}
          {budget > 0 && amount && parseFloat(amount) > getRemainingBudget() && (
            <Text style={styles.warningHint}>
              ⚠️ This exceeds your remaining budget by ₱{(parseFloat(amount) - getRemainingBudget()).toFixed(2)}
            </Text>
          )}
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

      <BudgetWarningModal />
      <TipsModal />
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
  budgetIndicator: {
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
  budgetIndicatorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  remainingAmount: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  budgetBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  budgetBarFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
    borderRadius: 3,
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
  warningHint: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 8,
    fontWeight: '500',
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  warningHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff3e0',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e65100',
    marginTop: 8,
  },
  warningContent: {
    padding: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  highlightAmount: {
    fontWeight: '700',
    color: '#2e7d32',
  },
  exceedAmount: {
    fontWeight: '700',
    color: '#f44336',
  },
  budgetSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 24,
    gap: 12,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  adjustButtonText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  increaseBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  increaseBudgetText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    color: '#f57c00',
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  // Tips Modal Styles
  tipsHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fffbf0',
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e65100',
    marginTop: 8,
    marginBottom: 8,
  },
  tipsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tipsContent: {
    flex: 1,
    padding: 24,
  },
  tipItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  encouragementBox: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
  closeTipsButton: {
    backgroundColor: '#2e7d32',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeTipsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});