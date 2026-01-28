// routes/resumeRoutes.js
const express = require('express');
const supabase = require('../config/supabase');
const PDFDocument = require('pdfkit');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

router.get('/:userId/master', resumeController.getMasterResume);

router.get('/:userId', resumeController.getAllResumes);

router.post('/', resumeController.createResume);

router.get('/:id/pdf', async (req , res) => {
  try {
    const id = req.params.id;

    const { data, error } = await supabase
      .from('resume')
      .select('*')
      .eq('id', id)
      .single();

    // Check if Supabase returned an error
    if (error) {
        // PGRST116 is the code for "No rows found"
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Resume not found' });
        }
        return res.status(500).json({ error: error.message });
    }

        const { data: user_data, error: error2 } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user_id)
        .single();

      if (error2) {
        console.error('Error fetching user:', error2);
        // Continue with default values or handle error
      }
      // Set the response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"'); // 'inline' shows in browser
      
      // Create and pipe the PDF to the response
      const doc = new PDFDocument();
      doc.pipe(res); 
  
      // Add some content
      doc.fontSize(15).font('Helvetica-Bold').text(`${user_data.name || 'Unknown'}`, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${user_data.email || 'Unknown'}`, { align: 'center' });
      
      doc.moveDown(2);
      doc.fontSize(10);
      // Iterate all fields safely
      Object.entries(data).forEach(([key, value]) => {
        if (key === "id" || key === "created_at" || key === "user_id") {
          return;
        }
        doc.font('Helvetica-Bold').text(`${key.toUpperCase()}: `, { continued: false }); 
        doc.moveDown(0.01);
        doc.font('Helvetica').text(`${value ?? 'N/A'}`);
        doc.moveDown(0.5);
      });
  
      // Finalize PDF
      doc.end();
  
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
});

module.exports = router;