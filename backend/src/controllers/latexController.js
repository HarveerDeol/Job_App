const latex = require('node-latex');
const fs = require('fs');
const path = require('path');

const compileLatex = async (req, res) => {
  try {
    const { latex: latexSource } = req.body;

    if (!latexSource) {
      return res.status(400).json({
        success: false,
        message: 'LaTeX source is required'
      });
    }

    // Method 1: Try LaTeX.Online with correct endpoint
    try {
      const formData = new FormData();
      formData.append('file', new Blob([latexSource], { type: 'text/plain' }), 'document.tex');
      
      const response = await fetch('https://latexonline.cc/compile?command=pdflatex', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
        return res.send(Buffer.from(pdfBuffer));
      }
    } catch (e) {
      console.log('LaTeX.Online failed, trying alternative...');
    }

    // Method 2: Try Texlive.net API
    try {
      const response = await fetch('https://texlive.net/cgi-bin/latexcgi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          filecontents: latexSource,
          filename: 'document.tex',
          engine: 'pdflatex',
          return: 'pdf'
        })
      });

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
        return res.send(Buffer.from(pdfBuffer));
      }
    } catch (e) {
      console.log('Texlive.net failed');
    }

    // If all methods fail
    throw new Error('All LaTeX compilation services are unavailable');

  } catch (error) {
    console.error('LaTeX compilation error:', error);
    res.status(422).json({
      success: false,
      message: 'Failed to compile LaTeX',
      error: error.message
    });
  }
};

module.exports = { compileLatex };
