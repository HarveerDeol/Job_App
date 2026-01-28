const supabase = require('../config/supabase');

const applicationsController = {
  getAllApplications: async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          user_id,
          resume_id,
          company_name,
          position,
          date_applied,
          notes,
          description,
          created_at,
          updated_at,
          application_stages(name),
          resumes(id, name, data)
        `)
        .eq('user_id', userId)
        .order('date_applied', { ascending: false });

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
      console.error('Error fetching applications:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch applications'
      });
    }
  },

  getApplicationById: async (req, res) => {
    try {
      const { userId, applicationId } = req.params;

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          user_id,
          resume_id,
          company_name,
          position,
          date_applied,
          notes,
          description,
          created_at,
          updated_at,
          application_stages(name),
          resumes(id, name, data)
        `)
        .eq('id', applicationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Application not found'
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
      console.error('Error fetching application:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch application'
      });
    }
  },

  createApplication: async (req, res) => {
    try {
      const { user_id, resume_id, company_name, position, date_applied, stage_id, notes, description } = req.body;

      const { data: insertedData, error: insertError } = await supabase
        .from('job_applications')
        .insert([
          {
            user_id,
            resume_id,
            company_name,
            position,
            date_applied,
            stage_id,
            notes,
            description
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
        message: 'Application created successfully',
        data: insertedData
      });
    } catch (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create application'
      });
    }
  },

  updateApplication: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { company_name, position, date_applied, stage_id, notes, resume_id , description} = req.body;

      const { data, error } = await supabase
        .from('job_applications')
        .update({
          company_name,
          position,
          date_applied,
          stage_id,
          notes,
          description,
          resume_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Application not found'
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
        message: 'Application updated successfully',
        data: data
      });
    } catch (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update application'
      });
    }
  },

  updateStage: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { stage_id } = req.body;

      const { data, error } = await supabase
        .from('job_applications')
        .update({
          stage_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Application not found'
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
        message: 'Stage updated successfully',
        data: data
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update stage'
      });
    }
  },

  deleteApplication: async (req, res) => {
    try {
      const { applicationId } = req.params;

      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Application deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to delete application'
      });
    }
  },

  getApplicationsByStage: async (req, res) => {
    try {
      const { userId, stageName } = req.params;

      // First get the stage_id
      const { data: stageData, error: stageError } = await supabase
        .from('application_stages')
        .select('id')
        .eq('name', stageName)
        .single();

      if (stageError) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Stage not found'
        });
      }

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          user_id,
          resume_id,
          company_name,
          position,
          date_applied,
          notes,
          description,
          created_at,
          updated_at,
          application_stages(name),
          resumes(id, name, data)
        `)
        .eq('user_id', userId)
        .eq('stage_id', stageData.id)
        .order('date_applied', { ascending: false });

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
      console.error('Error fetching applications by stage:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch applications'
      });
    }
  }, 

    updateApplicationNotes: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { notes } = req.body;

      // Basic validation
      if (notes === undefined) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Notes field is required"
        });
      }

      const { data, error } = await supabase
        .from("job_applications")
        .update({
          notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", applicationId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            error: "Not Found",
            message: "Application not found"
          });
        }

        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notes updated successfully",
        data
      });
    } catch (error) {
      console.error("Error updating application notes:", error);
      return res.status(500).json({
        error: "Server Error",
        message: "Failed to update notes"
      });
    }
  }
};

module.exports = applicationsController;