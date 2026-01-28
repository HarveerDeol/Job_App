const supabase = require('../config/supabase');

const notificationsController = {
  getAllNotifications: async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          application_id,
          notification_date,
          message,
          is_completed,
          created_at,
          job_applications(company_name, position)
        `)
        .eq('user_id', userId)
        .lte('notification_date', new Date().toISOString())
        .order('notification_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        count: data.length,
        data: data
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch notifications'
      });
    }
  },

  getPendingNotifications: async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          application_id,
          notification_date,
          message,
          is_completed,
          created_at,
          job_applications(company_name, position)
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('notification_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        count: data.length,
        data: data
      });
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch pending notifications'
      });
    }
  },

  createNotification: async (req, res) => {
    try {
      const { user_id, application_id, notification_date, message } = req.body;

      const { data: insertedData, error: insertError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id,
            application_id,
            notification_date,
            message: message || 'Follow up reminder',
            is_completed: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({
          error: 'Database Error',
          message: insertError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: insertedData
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create notification'
      });
    }
  },

  completeNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_completed: true
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Notification not found'
          });
        }

        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as completed',
        data: data
      });
    } catch (error) {
      console.error('Error completing notification:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to complete notification'
      });
    }
  },

  updateNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const { notification_date, message } = req.body;

      const { data, error } = await supabase
        .from('notifications')
        .update({
          notification_date,
          message
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Notification not found'
          });
        }

        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification updated successfully',
        data: data
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update notification'
      });
    }
  }
};

module.exports = notificationsController;