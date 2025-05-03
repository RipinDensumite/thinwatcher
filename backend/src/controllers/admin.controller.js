const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

class AdminController {
  async getAllUsers(req, res) {
    try {
      const users = await req.db.all(
        'SELECT id, username, email, role, created_at FROM users'
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async addUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await req.db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await req.db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user']
      );

      res.status(201).json({
        result: username + ' added successfully',
      });
    } catch (error) {
      console.error('Add user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateUserRole(req, res) {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    try {
      await req.db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
      const updatedUser = await req.db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        userId
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteUser(req, res) {
    const userId = req.params.id;

    try {
      const result = await req.db.run('DELETE FROM users WHERE id = ?', userId);

      if (result.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new AdminController();