const fetch = require('node-fetch'); // Make sure to install: npm install node-fetch@2

const compileLatex = async (req, res) => {
  try {
    const { latex: latexSource } = req.body;

    if (!latexSource) {
      return res.status(400).json({
        success: false,
        message: 'LaTeX source is required'
      });
    }

    // Use LaTeX.Online API for compilation
    const response = await fetch('https://latex.ytotech.com/builds/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'pdflatex',
        resources: [
          {
            main: true,
            file: 'main.tex',
            content: latexSource
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LaTeX compilation error:', errorText);
      
      return res.status(422).json({
        success: false,
        message: 'Failed to compile LaTeX',
        error: 'The LaTeX compilation service returned an error',
        fullError: errorText
      });
    }

    // Get the PDF buffer
    const pdfBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(pdfBuffer);
    
    // Set headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);

  } catch (error) {
    console.error('LaTeX compilation error:', error);
    
    let userFriendlyMessage = 'Failed to compile LaTeX';
    let errorDetails = error.message;
    
    if (error.message.includes('fetch')) {
      userFriendlyMessage = 'Unable to reach LaTeX compilation service';
      errorDetails = 'Please check your internet connection and try again.';
    }
    
    res.status(500).json({
      success: false,
      message: userFriendlyMessage,
      error: errorDetails,
      fullError: error.message
    });
  }
};

module.exports = {
  compileLatex
};