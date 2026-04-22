const pool = require('../config/database');

const createTask = async (req, res) => {
  const { title, description, task_type, budget, budget_type, workers_needed, required_skill, deadline_at, location_lat, location_lng, area_description, linked_listing_id } = req.body;
  try {
    if (!title || !task_type || !budget) {
      return res.status(400).json({ success: false, message: 'Title, task type and budget are required' });
    }
    const validTypes = ['delivery', 'labour', 'skilled', 'promotion', 'errand'];
    if (!validTypes.includes(task_type)) {
      return res.status(400).json({ success: false, message: 'Invalid task type' });
    }
    const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTask = await pool.query(
      `INSERT INTO tasks (poster_id, title, description, task_type, budget, budget_type, workers_needed, required_skill, deadline_at, location_lat, location_lng, area_description, pickup_code, linked_listing_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.user.id, title, description || null, task_type, budget, budget_type || 'fixed', workers_needed || 1, required_skill || null, deadline_at || null, location_lat || null, location_lng || null, area_description || null, pickupCode, linked_listing_id || null]
    );
    res.status(201).json({ success: true, message: 'Task posted successfully', task: newTask.rows[0] });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

const getTasks = async (req, res) => {
  const { task_type, area } = req.query;
  try {
    let query = `SELECT t.*, u.full_name as poster_name, u.proxi_score as poster_score, u.score_tier as poster_tier FROM tasks t JOIN users u ON t.poster_id = u.id WHERE t.status = 'open'`;
    const params = [];
    if (task_type) { params.push(task_type); query += ` AND t.task_type = $${params.length}`; }
    if (area) { params.push(`%${area}%`); query += ` AND t.area_description ILIKE $${params.length}`; }
    query += ' ORDER BY t.created_at DESC LIMIT 50';
    const tasks = await pool.query(query, params);
    res.json({ success: true, count: tasks.rows.length, tasks: tasks.rows });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await pool.query(
      `SELECT t.*, u.full_name as poster_name, u.proxi_score as poster_score, u.phone_number as poster_phone FROM tasks t JOIN users u ON t.poster_id = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (task.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task: task.rows[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching task' });
  }
};

const applyForTask = async (req, res) => {
  const { pitch, proposed_amount } = req.body;
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.rows[0].status !== 'open') return res.status(400).json({ success: false, message: 'Task is no longer open' });
    if (task.rows[0].poster_id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot apply to your own task' });
    const existing = await pool.query('SELECT id FROM task_applications WHERE task_id = $1 AND applicant_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Already applied to this task' });
    const application = await pool.query(
      `INSERT INTO task_applications (task_id, applicant_id, pitch, proposed_amount) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, pitch || null, proposed_amount || null]
    );
    res.status(201).json({ success: true, message: 'Application submitted successfully', application: application.rows[0] });
  } catch (error) {
    console.error('Apply for task error:', error);
    res.status(500).json({ success: false, message: 'Server error applying for task' });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await pool.query('SELECT * FROM tasks WHERE poster_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, count: tasks.rows.length, tasks: tasks.rows });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching your tasks' });
  }
};

const getTaskApplications = async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND poster_id = $2', [req.params.id, req.user.id]);
    if (task.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found or not yours' });
    const applications = await pool.query(
      `SELECT ta.*, u.full_name as applicant_name, u.proxi_score, u.score_tier, u.phone_number FROM task_applications ta JOIN users u ON ta.applicant_id = u.id WHERE ta.task_id = $1 ORDER BY u.proxi_score DESC`,
      [req.params.id]
    );
    res.json({ success: true, count: applications.rows.length, applications: applications.rows });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

module.exports = { createTask, getTasks, getTask, applyForTask, getMyTasks, getTaskApplications };
