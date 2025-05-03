const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { config } = require('../config/app.config');

class AuthController {
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUsers = await req.db.get('SELECT COUNT(*) as count FROM users');
      const isFirstUser = existingUsers.count === 0;

      const existingUser = await req.db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      if (existingUsers.count !== 0) {
        return res.status(400).json({ message: 'Registration is not allowed' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await req.db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, isFirstUser ? 'admin' : 'user']
      );

      const user = await req.db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        result.lastID
      );

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isFirstUser,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await req.db.get('SELECT * FROM users WHERE username = ?', username);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password. Please try again.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password. Please try again.' });
      }

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getProfile(req, res) {
    try {
      res.json(req.user);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async checkRegistration(req, res) {
    try {
      const existingUsers = await req.db.get('SELECT COUNT(*) as count FROM users');
      res.json({ canRegister: existingUsers.count === 0 });
    } catch (error) {
      console.error('Registration check error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  logout(req, res) {
    res.json({ message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();