const latex = require('node-latex');
const fs = require('fs');
const path = require('path');

// Using LaTeX.Online API (free, no auth required)
const compileLatex = async (req, res) => {
  try {
    const { latex: latexSource } = req.body;

    if (!latexSource) {
      return res.status(400).json({
        success: false,
        message: 'LaTeX source is required'
      });
    }

    // Send to LaTeX.Online API
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: latexSource,
        command: 'pdflatex'
      })
    });

    if (!response.ok) {
      throw new Error(`LaTeX compilation failed: ${response.statusText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('LaTeX compilation error:', error);
    res.status(422).json({
      success: false,
      message: 'Failed to compile LaTeX',
      error: error.message
    });
  }
};

module.exports = {
  compileLatex
};