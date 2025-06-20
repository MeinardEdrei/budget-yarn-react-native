CREATE DATABASE IF NOT EXISTS budget_app;

USE budget_app;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  note TEXT,
  date DATETIME NOT NULL
);
