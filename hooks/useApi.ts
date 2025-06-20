import axios from 'axios';

const API_URL = 'http://172.20.10.11:3000'; // Computer's local IP address

export const useApi = () => {
  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses`);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      return response.data || [];
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching expenses:', error.message); // Log the error message
      } else {
        console.error('Error fetching expenses:', error); // Log the error object
      }
      throw error; // Re-throw the error for further handling
    }
  };

  const addExpense = async (expense: { amount: number; category: string; note: string; date: string }) => {
    const response = await axios.post(`${API_URL}/expenses`, expense);
    return response.data;
  };

  const deleteExpense = async (id: string) => {
    await axios.delete(`${API_URL}/expenses/${id}`);
  };

  const clearAllExpenses = async () => {
    await axios.delete(`${API_URL}/expenses`);
  };

  const updateExpense = async (id: string, updatedExpense: { amount: number; category: string; note: string; date: string }) => {
    await axios.put(`${API_URL}/expenses/${id}`, updatedExpense);
  };

  return { fetchExpenses, addExpense, deleteExpense, clearAllExpenses, updateExpense };
};
