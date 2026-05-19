-- FitCore Database Schema
-- Run this file once in MySQL to set up the database

CREATE DATABASE IF NOT EXISTS fitcore;
USE fitcore;

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  category   VARCHAR(100) NOT NULL DEFAULT 'Other',
  duration   INT NOT NULL,
  calories   INT NOT NULL,
  notes      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'Snack',
  calories   INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profile table (single row)
CREATE TABLE IF NOT EXISTS profile (
  id         INT PRIMARY KEY DEFAULT 1,
  name       VARCHAR(255),
  age        INT,
  gender     VARCHAR(20),
  weight     DECIMAL(5,2),
  height     DECIMAL(5,2),
  goal       VARCHAR(100),
  cal_goal   INT DEFAULT 500,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default profile row
INSERT IGNORE INTO profile (id) VALUES (1);
