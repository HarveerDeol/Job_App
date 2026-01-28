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

    // Create a buffer to collect the PDF data
    const chunks = [];
    let errorOutput = '';

    // Compile LaTeX to PDF
    const output = latex(latexSource, {
      cmd: 'pdflatex',
      passes: 2,
    });

    output.on('data', (chunk) => {
      chunks.push(chunk);
    });

    output.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      // Set headers for PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    });

    output.on('error', (err) => {
      console.error('LaTeX compilation error:', err);
      
      // Parse error message for better user feedback
      let userFriendlyMessage = 'Failed to compile LaTeX';
      let errorDetails = err.message;
      
      if (err.message.includes('Undefined control sequence')) {
        userFriendlyMessage = 'LaTeX syntax error: Undefined command found';
        const match = err.message.match(/\\(\w+)/);
        if (match) {
          errorDetails = `The command \\${match[1]} is not recognized. Check for typos or missing packages.`;
        }
      } else if (err.message.includes('Missing \\begin{document}')) {
        userFriendlyMessage = 'Missing \\begin{document} command';
        errorDetails = 'Your LaTeX document must include \\begin{document} before the content.';
      } else if (err.message.includes('File') && err.message.includes('not found')) {
        userFriendlyMessage = 'Missing LaTeX package';
        errorDetails = 'A required LaTeX package is not installed. Please check your document packages.';
      } else if (err.message.includes('! LaTeX Error')) {
        userFriendlyMessage = 'LaTeX compilation error';
        const match = err.message.match(/! LaTeX Error: (.+)/);
        if (match) {
          errorDetails = match[1];
        }
      } else if (err.message.includes('Emergency stop')) {
        userFriendlyMessage = 'Critical LaTeX error';
        errorDetails = 'The LaTeX compiler encountered a critical error. Please check your syntax.';
      }
      
      res.status(422).json({
        success: false,
        message: userFriendlyMessage,
        error: errorDetails,
        fullError: err.message
      });
    });

  } catch (error) {
    console.error('LaTeX compilation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during LaTeX compilation',
      error: error.message
    });
  }
};

module.exports = {
  compileLatex
};