const FormData = require('form-data');
const fetch = require('node-fetch');

const compileLatex = async (req, res) => {
  try {
    const { latex: latexSource } = req.body;

    if (!latexSource) {
      return res.status(400).json({
        success: false,
        message: 'LaTeX source is required'
      });
    }

    const form = new FormData();
    form.append('file', Buffer.from(latexSource), {
      filename: 'document.tex',
      contentType: 'text/plain'
    });

    const response = await fetch('https://latexonline.cc/compile?command=pdflatex', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LaTeX compilation failed: ${errorText}`);
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

module.exports = { compileLatex };