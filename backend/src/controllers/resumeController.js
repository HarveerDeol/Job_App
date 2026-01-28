const supabase = require('../config/supabase');

const resumeController = {
  // GET /api/resumes/:userId - Get all resumes for user
  getAllResumes: async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('resumes')
        .select('id, user_id, name, data, is_master, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
      console.error('Error fetching resumes:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch resumes'
      });
    }
  },

  // POST /api/resumes - Create new resume
  createResume: async (req, res) => {
    try {
      const { user_id, name, data, is_master = false } = req.body;

      // If this resume is marked as master, unset other master resumes first
      if (is_master) {
        const { error: updateError } = await supabase
          .from('resumes')
          .update({ is_master: false })
          .eq('user_id', user_id);

        if (updateError) {
          console.error('Error unsetting master resumes:', updateError);
          // Continue anyway - this is not critical
        }
      }

      // Insert the new resume
      const { data: insertedData, error: insertError } = await supabase
        .from('resumes')
        .insert([
          {
            user_id,
            name,
            data,
            is_master
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
        message: 'Resume created successfully',
        data: insertedData
      });
    } catch (error) {
      console.error('Error creating resume:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create resume'
      });
    }
  },

  // GET /api/resumes/:userId/master - Get master resume
  getMasterResume: async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('resumes')
        .select('id, user_id, name, data, is_master, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_master', true)
        .limit(1)
        .single();

      if (error) {
        // If no rows found, return 404
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'No master resume found'
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
        data: data
      });
    } catch (error) {
      console.error('Error fetching master resume:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch master resume'
      });
    }
  }
};

module.exports = resumeController;