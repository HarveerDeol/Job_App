// controllers/stagesController.js
const supabase = require('../config/supabase');

const stagesController = {
  // GET /api/stages - Get all application stages
  getAllStages: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('application_stages')
        .select('id, name')
        .order('name', { ascending: true });

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
      console.error('Error fetching stages:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch stages'
      });
    }
  },

  // GET /api/stages/:stageName - Get stage by name
  getStageByName: async (req, res) => {
    try {
      const { stageName } = req.params;

      const { data, error } = await supabase
        .from('application_stages')
        .select('id, name')
        .eq('name', stageName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Stage not found'
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
      console.error('Error fetching stage:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch stage'
      });
    }
  },

  // POST /api/stages - Create new stage (admin only)
  createStage: async (req, res) => {
    try {
      const { name } = req.body;

      const { data: insertedData, error: insertError } = await supabase
        .from('application_stages')
        .insert([{ name }])
        .select()
        .single();

      if (insertError) {
        // Check for unique constraint violation
        if (insertError.code === '23505') {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Stage already exists'
          });
        }

        console.error('Supabase insert error:', insertError);
        return res.status(500).json({
          error: 'Database Error',
          message: insertError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Stage created successfully',
        data: insertedData
      });
    } catch (error) {
      console.error('Error creating stage:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create stage'
      });
    }
  }
};

module.exports = stagesController;


