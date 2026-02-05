const express = require("express");
const { ChatGroq } = require("@langchain/groq");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { z } = require("zod");
const dotenv = require("dotenv");


dotenv.config();

const router = express.Router();

/* =========================
   Zod Schema
========================= */

const resumeTailorSchema = z.object({

  tailored_resume_tex: z
    .string()
    .describe("The fully tailored resume in valid LaTeX format"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence that the resume matches the job (0–1)"),
  changes_summary: z
    .array(z.string())
    .describe("Bullet list summary of major changes made")
});

const parser = StructuredOutputParser.fromZodSchema(resumeTailorSchema);

/* =========================
   LLM
========================= */

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

/* =========================
   Prompt
========================= */
const resumeTailorPrompt = new PromptTemplate({
  templateFormat: "mustache",
  template: `
You are an expert technical recruiter and LaTeX resume editor.

STRICT OUTPUT RULES:
- You MUST output valid JSON
- Do NOT include explanations
- Do NOT include markdown
- Do NOT wrap output in code fences
- Output MUST match the provided schema exactly

TASK:
You are given an existing resume in LaTeX and a job description.
Your job is to **only reword, reorder, or emphasize existing resume content** to make it more tailored to the job description.
- Do NOT add new work experience, education, or sections.
- Do NOT copy text from the job description into the resume.
- Make improvements by highlighting relevant skills, keywords, and achievements already present.

Job Title:
{{job_title}}

Job Description:
{{job_description}}

Original Resume (LaTeX):
{{resume_tex}}

{{format_instructions}}

  `,
  inputVariables: [
    "job_title",
    "job_description",
    "resume_tex",
    "format_instructions"
  ]
});

/* =========================
   Route
========================= */

router.post("/", async (req, res) => {
  const { resume_tex, job_title, job_description } = req.body || {};

  if (!resume_tex?.trim() || !job_title?.trim() || !job_description?.trim()) {
    return res.status(400).json({
      error: "resume_tex, job_title, and job_description are required"
    });
  }

  try {
    const chain = resumeTailorPrompt
      .pipe(llm)
      .pipe(parser);

    const result = await chain.invoke({
      resume_tex,
      job_title,
      job_description,
      format_instructions: parser.getFormatInstructions()
    });

    res.json({
      tailored_resume_tex: result.tailored_resume_tex,
      confidence: result.confidence,
      changes_summary: result.changes_summary,
      metadata: {
        model: "llama-3.3-70b-versatile",
        langchain_version: "0.3.x"
      }
    });

  } catch (err) {
    console.error("Resume tailoring error:", err);
    
    // Check if it's a parsing error with available output
    if (err.lc_error_code === 'OUTPUT_PARSING_FAILURE' && err.llmOutput) {
      return res.status(500).json({
        error: "output_truncated",
        details: "LLM response exceeded token limit. Increase maxTokens.",
        partial_output: err.llmOutput.substring(0, 500) // Preview
      });
    }
    
    res.status(500).json({
      error: "resume_tailoring_failed",
      details: err.message
    });
  }
});

module.exports = router;