const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'budget_app', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1); // Exit the process if the database connection fails
  }
  console.log('Connected to MySQL database');

  // Ensure the database and table exist
  db.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      note TEXT,
      date DATETIME NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error ensuring expenses table exists:', err.message);
    } else {
      console.log('Expenses table ensured.');
    }
  });
});

// Routes
app.get('/expenses', (req, res) => {
  db.query('SELECT * FROM expenses', (err, results) => {
    if (err) {
      console.error('Error fetching expenses:', err.message); // Log the error
      res.status(500).send(err.message);
      return;
    }

    // Convert amount to a number
    const formattedResults = results.map((expense) => ({
      ...expense,
      amount: parseFloat(expense.amount), // Convert amount to a number
    }));

    console.log('Fetched expenses:', formattedResults); // Log the formatted data
    res.json(formattedResults);
  });
});

app.post('/expenses', (req, res) => {
  const { amount, category, note, date } = req.body;

  // Validate the incoming data
  if (!amount || !category || !date) {
    console.error('Invalid data:', req.body);
    res.status(400).send('Invalid data. Amount, category, and date are required.');
    return;
  }

  try {
    // Convert ISO 8601 date to MySQL DATETIME format
    const formattedDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

    const query = 'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?)';
    db.query(query, [amount, category, note, formattedDate], (err, results) => {
      if (err) {
        console.error('Error adding expense:', err.message);
        res.status(500).send(err.message);
        return;
      }
      res.status(201).json({ id: results.insertId });
    });
  } catch (error) {
    console.error('Error processing date:', error.message);
    res.status(500).send('Error processing date.');
  }
});

app.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM expenses WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting expense:', err.message);
      res.status(500).send(err.message);
      return;
    }
    res.status(204).send();
  });
});

app.delete('/expenses', (req, res) => {
  db.query('DELETE FROM expenses', (err) => {
    if (err) {
      console.error('Error clearing all expenses:', err.message);
      res.status(500).send(err.message);
      return;
    }
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
