const express = require('express');
const supabase = require('../config/database');
const app = express()

app.get('/api/jobs', async (req , res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*');

    // Check if Supabase returned an error
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // express returns 200 by default
    return res.json(data);

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/jobs/:jobID', async (req , res) => {
  try {
    const jobID = req.params.jobID;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('jobID', jobID)
      .single();

    // Check if Supabase returned an error
    if (error) {
        // PGRST116 is the code for "No rows found"
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job not found' });
        }
        return res.status(500).json({ error: error.message });
    }
    
    // express returns 200 by default
    return res.json(data);

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/jobs', async (req, res) => {
    try{
        const { title, company, location, description } = req.body;

        const { data, error } = await supabase
            .from('jobs')
            .insert([{ title, company, location, description, tags}])
            .select();

        if (error) {
            return res.status(500).json({error: error.message})
        }

        return res.status(201).json(data);

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({error: 'Internal Server Error'});
}});

app.delete('/api/jobs/:jobID', async (req, res) => {
    try {
        const jobID = req.params.jobID;

        const { data, error } = await supabase
            .from('jobs')
            .delete()
            .eq('jobID', jobID)
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }   

        // make the sure the job was found and deleted
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        return res.json({ message: 'Job deleted successfully', data }); 
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
}});

app.put('/api/jobs/:jobID', async (req, res) => {
    try {
        const jobID = req.params.jobID;

        const allowedUpdates = {};
        if (req.body.title !== undefined) allowedUpdates.title = req.body.title;
        if (req.body.company !== undefined) allowedUpdates.company = req.body.company;
        if (req.body.location !== undefined) allowedUpdates.location = req.body.location;
        if (req.body.description !== undefined) allowedUpdates.description = req.body.description;

        // If nothing to update, return early
        if (Object.keys(allowedUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await supabase
            .from('jobs')
            .update(allowedUpdates)
            .eq('jobID', jobID)
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({error: 'job not found'});
        }
        return res.json(data);

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
}});

module.exports = app;
