const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

router.get('/', async (req , res) => {
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

router.get('/:jobID', async (req , res) => {
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

router.post('/', async (req, res) => {
    try{
        const { Title, Description, Location, Company } = req.body;

        const { data, error } = await supabase
            .from('jobs')
            .insert([{ Title, Description, Location, Company}])
            .select();

        if (error) {
            return res.status(500).json({error: error.message})
        }

        return res.status(201).json(data);

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({error: 'Internal Server Error'});
}});

router.delete('/:jobID', async (req, res) => {
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

router.put('/:jobID', async (req, res) => {
    try {
        const jobID = req.params.jobID;

        const allowedUpdates = {};
        if (req.body.Title !== undefined) allowedUpdates.Title = req.body.Title;
        if (req.body.Company !== undefined) allowedUpdates.Company = req.body.Company;
        if (req.body.Location !== undefined) allowedUpdates.Location = req.body.Location;
        if (req.body.Description !== undefined) allowedUpdates.Description = req.body.Description;

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

module.exports = router;