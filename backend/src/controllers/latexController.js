import fetch from 'node-fetch';

const compileLatex = async (req, res) => {
  try {
    const { latex: latexSource } = req.body;

    if (!latexSource) {
      return res.status(400).json({
        success: false,
        message: 'LaTeX source is required'
      });
    }

    // Send LaTeX to latexonline.cc API
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: latexSource
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(422).json({
        success: false,
        message: 'Failed to compile LaTeX',
        error: text
      });
    }

    // Get the PDF as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Send PDF back to frontend
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('LaTeX compilation error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during LaTeX compilation',
      error: err.message
    });
  }
};

export default compileLatex;
