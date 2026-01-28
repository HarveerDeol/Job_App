const express = require('express');
const supabase = require('../config/supabase');
const app = express();

app.get('/api/users', async (req, res) => {
    // Try to get all users, throws error if doesn't work?
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        // Check if Supabase returned an error
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // express returns 200 by default
        return res.json(data);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Gets all user info not just userID => all columns (I think??)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userID)
            .single();

        // Check if Supabase returned an error
        if (error) {
            // PGRST116 is the code for no rows found
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(500).json({ error: error.message });
        }

        // 200 by default
        return res.json(data);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/users/:id/jobs/:jobID', async (req, res) => {
    try {
        const { id, jobID } = req.params;
        const { status } = req.body;

        // Validate status
        // Side note, gets statuses as numbers not as strings initially
        if (![0, 1, 2].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({
                jobs: `"${jobID}"=>"${String(status)}"`
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({error: 'user not found'});
        }

        return res.json(data);
    }
    catch (error) {
        console.error('Error updating job status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;