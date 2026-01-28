const { supabase } = require('../config/database');
const { validationResult } = require('express-validator');

const authController = {
  signup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, fullName } = req.body;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (data.user && !data.session) {
        return res.status(200).json({
          success: true,
          message: 'Registration successful!',
          user: {
            id: data.user.id,
            email: data.user.email
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata.full_name
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during registration'
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata.full_name
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login'
      });
    }
  },

  logout: async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          fullName: req.user.user_metadata.full_name
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      res.status(200).json({
        success: true,
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Error refreshing token'
      });
    }
  }
};

module.exports = authController;