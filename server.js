require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DB CONNECTION POOL ───────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'fitcore',
  waitForConnections: true,
  connectionLimit: 10,
});

// Test DB connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    Make sure MySQL is running and .env is configured correctly.');
  }
})();

// ─── HELPER ──────────────────────────────────────────────────────────────────
function ok(res, data)         { res.json({ success: true,  data }); }
function fail(res, msg, code)  { res.status(code || 400).json({ success: false, message: msg }); }

// ═══════════════════════════════════════════════════════════════════════════════
//  WORKOUT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET all workouts
app.get('/api/workouts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workouts ORDER BY created_at DESC');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// POST add workout
app.post('/api/workouts', async (req, res) => {
  const { name, category, duration, calories, notes } = req.body;
  if (!name || !duration || !calories) return fail(res, 'name, duration and calories are required');
  try {
    const [result] = await pool.query(
      'INSERT INTO workouts (name, category, duration, calories, notes) VALUES (?, ?, ?, ?, ?)',
      [name, category || 'Other', duration, calories, notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM workouts WHERE id = ?', [result.insertId]);
    ok(res, rows[0]);
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE workout by id
app.delete('/api/workouts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM workouts WHERE id = ?', [req.params.id]);
    ok(res, { id: parseInt(req.params.id) });
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE all workouts
app.delete('/api/workouts', async (req, res) => {
  try {
    await pool.query('DELETE FROM workouts');
    ok(res, { cleared: true });
  } catch (e) { fail(res, e.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MEAL ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET all meals
app.get('/api/meals', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM meals ORDER BY created_at DESC');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// POST add meal
app.post('/api/meals', async (req, res) => {
  const { name, type, calories } = req.body;
  if (!name || !calories) return fail(res, 'name and calories are required');
  try {
    const [result] = await pool.query(
      'INSERT INTO meals (name, type, calories) VALUES (?, ?, ?)',
      [name, type || 'Snack', calories]
    );
    const [rows] = await pool.query('SELECT * FROM meals WHERE id = ?', [result.insertId]);
    ok(res, rows[0]);
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE meal by id
app.delete('/api/meals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM meals WHERE id = ?', [req.params.id]);
    ok(res, { id: parseInt(req.params.id) });
  } catch (e) { fail(res, e.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET profile
app.get('/api/profile', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM profile WHERE id = 1');
    ok(res, rows[0] || {});
  } catch (e) { fail(res, e.message, 500); }
});

// PUT update profile
app.put('/api/profile', async (req, res) => {
  const { name, age, gender, weight, height, goal, cal_goal } = req.body;
  try {
    await pool.query(
      `UPDATE profile SET name=?, age=?, gender=?, weight=?, height=?, goal=?, cal_goal=? WHERE id=1`,
      [name||null, age||null, gender||null, weight||null, height||null, goal||null, cal_goal||500]
    );
    const [rows] = await pool.query('SELECT * FROM profile WHERE id = 1');
    ok(res, rows[0]);
  } catch (e) { fail(res, e.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  STATS ROUTE  (summary for dashboard)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
  try {
    const [[totals]]   = await pool.query('SELECT COUNT(*) as total_workouts, IFNULL(SUM(calories),0) as total_calories, IFNULL(SUM(duration),0) as total_duration FROM workouts');
    const today        = new Date().toISOString().slice(0,10);
    const [[today_w]]  = await pool.query('SELECT IFNULL(SUM(calories),0) as today_calories FROM workouts WHERE DATE(created_at) = ?', [today]);
    const [[profile]]  = await pool.query('SELECT cal_goal FROM profile WHERE id = 1');
    ok(res, { ...totals, today_calories: today_w.today_calories, cal_goal: profile?.cal_goal || 500 });
  } catch (e) { fail(res, e.message, 500); }
});

// ─── SERVE FRONTEND ──────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀  FitCore running at http://localhost:${PORT}`));
