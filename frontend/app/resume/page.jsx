"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CircleUser, Plus, Trash2, Save, FileText, Code, Download, Loader2, AlertCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MasterResumePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [editMode, setEditMode] = useState("form");
  const [latexSource, setLatexSource] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState(null);

  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    location: ""
  });

  const MotionLink = motion(Link);
  const links = [
    { label: "← Back to listings", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState([
    { company: "", title: "", startDate: "", endDate: "", description: "" }
  ]);
  const [education, setEducation] = useState([
    { school: "", degree: "", field: "", graduationDate: "" }
  ]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const getDefaultLatexTemplate = () => {
    return `%-------------------------
% Resume in Latex
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
  \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
    \\textit{\\small#3} & \\textit{\\small #4} \\\\
  \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
  \\item
  \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\small#1 & #2 \\\\
  \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
  \\textbf{\\Huge \\scshape ${contactInfo.fullName || "Your Name"}} \\\\ \\vspace{1pt}
  \\small ${contactInfo.phone || "000-000-0000"} $|$ ${contactInfo.location || "City, State"} $|$
  \\href{mailto:${contactInfo.email || "email@example.com"}}{${contactInfo.email || "email@example.com"}} $|$
  \\href{${contactInfo.portfolio || "https://yourwebsite.com"}}{${contactInfo.portfolio || "yourwebsite.com"}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
${education.map(edu => `  \\resumeSubheading
    {${edu.school || "University Name"}}{${edu.graduationDate || "Sep. 2020 -- Present"}}
    {${edu.degree || "Bachelor of Science"}${edu.field ? ` in ${edu.field}` : ""}}{${edu.location || "City, State"}}`).join('\n')}
\\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
\\resumeSubHeadingListStart

${experiences.map(exp => {
  const bullets = exp.description
    .split('\n')
    .filter(line => line.trim())
    .map(line => `  \\resumeItem{${line.replace(/^[-•]\s*/, '')}}`)
    .join('\n');
  
  return `\\resumeSubheading
  {${exp.title || "Job Title"}}{${exp.startDate || "Jan. 2020"} -- ${exp.endDate || "Present"}}
  {${exp.company || "Company Name"}}{${exp.location || "City, State"}}
\\resumeItemListStart
${bullets || '  \\resumeItem{Add your accomplishments and responsibilities here}'}
\\resumeItemListEnd`;
}).join('\n\n')}

\\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
\\small{\\item{
  \\textbf{Skills}: ${skills.join(', ') || 'Add your skills here'} \\\\
}}
\\end{itemize}

\\end{document}`;
  };

  const generateLatex = () => {
    // Use the professional template instead of simple one
    return getDefaultLatexTemplate();
  };

  const compilePDF = async (latex) => {
    setIsCompiling(true);
    setCompilationError(null);
    
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${BASE_URL}/api/latex/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
      }

      const blob = await res.blob();
      
      // Revoke old URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setCompilationError(null);
    } catch (err) {
      console.error("PDF compilation error:", err);
      
      try {
        const errorData = JSON.parse(err.message);
        setCompilationError({
          message: errorData.message || 'Failed to compile PDF',
          details: errorData.error || 'Please check your LaTeX syntax',
          fullError: errorData.fullError
        });
      } catch {
        setCompilationError({
          message: 'Failed to compile PDF',
          details: 'Please check your LaTeX syntax',
          fullError: err.message
        });
      }
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    if (editMode === "form") {
      const newLatex = generateLatex();
      setLatexSource(newLatex);
    }
  }, [contactInfo, summary, experiences, education, skills, editMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (latexSource) {
        compilePDF(latexSource);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [latexSource]);

  const addExperience = () => {
    setExperiences([...experiences, { company: "", title: "", startDate: "", endDate: "", description: "" }]);
  };

  const removeExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experiences];
    updated[index][field] = value;
    setExperiences(updated);
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", field: "", graduationDate: "" }]);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const downloadLatex = () => {
    const blob = new Blob([latexSource], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const downloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "resume.pdf";
      a.click();
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMasterResume = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

      try {
        const response = await fetch(`${BASE_URL}/api/resumes/${user.id}/master`);

        if (!response.ok) {
          if (response.status === 404) return;
          throw new Error('Failed to fetch master resume');
        }

        const result = await response.json();
        const resumeData = result.data?.data;

        if (!resumeData) return;

        setContactInfo({
          fullName: resumeData.contactInfo?.fullName || "",
          email: resumeData.contactInfo?.email || "",
          phone: resumeData.contactInfo?.phone || "",
          linkedin: resumeData.contactInfo?.linkedin || "",
          portfolio: resumeData.contactInfo?.portfolio || "",
          location: resumeData.contactInfo?.location || ""
        });

        setSummary(resumeData.summary || "");

        if (Array.isArray(resumeData.experiences)) {
          setExperiences(resumeData.experiences);
        }

        if (Array.isArray(resumeData.education)) {
          setEducation(resumeData.education);
        }

        if (Array.isArray(resumeData.skills)) {
          setSkills(resumeData.skills);
        }

        if (resumeData.latexSource) {
          setLatexSource(resumeData.latexSource);
        }

        setResumeId(result.data?.id);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMasterResume();
  }, [user]);

  const handleSave = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!user?.id) {
      alert('User not found. Please log in again.');
      return;
    }
    
    const resumeData = {
      user_id: user.id,
      name: "Master Resume",
      data: {
        contactInfo,
        summary,
        experiences,
        education,
        skills,
        latexSource
      },
      is_master: true
    };
    
    try {
      const response = await fetch(`${BASE_URL}/api/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resumeData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save resume');
      }
      
      const result = await response.json();
      setResumeId(result.data?.id);
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100">
      <header className="mx-auto max-w-7xl px-6 pt-6 flex items-center justify-between">
        <nav className="flex gap-6">
          {links.map(({ label, href }) => (
            <MotionLink
              key={label}
              href={href}
              className="cursor-pointer"
              whileHover={{ scale: 1.1, color: "#ec4899" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {label}
            </MotionLink>
          ))}
        </nav>
       
        <motion.div
          whileHover={{ scale: 1.1, opacity: 0.9 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="cursor-pointer"
          onClick={() => router.push("/login")}
        >
          <CircleUser />
        </motion.div>
      </header>

      {/* Error Toast */}
      {compilationError && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 max-w-md bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 z-50"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">{compilationError.message}</h3>
              <p className="text-sm text-red-700">{compilationError.details}</p>
              {compilationError.fullError && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                    View full error
                  </summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                    {compilationError.fullError}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => setCompilationError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}

      <section className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-center font-serif text-5xl mb-2">Master Resume</h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          Build your master resume once, then customize it for each job application
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditMode("form")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              editMode === "form" 
                ? "bg-black text-white" 
                : "bg-white text-black border border-gray-300"
            }`}
          >
            <FileText size={18} /> Form Editor
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditMode("latex")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              editMode === "latex" 
                ? "bg-black text-white" 
                : "bg-white text-black border border-gray-300"
            }`}
          >
            <Code size={18} /> LaTeX Editor
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            disabled={!pdfUrl}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
              pdfUrl 
                ? "bg-pink-500 text-white hover:bg-pink-600" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Download size={18} /> Download PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadLatex}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-amber-500 text-white"
          >
            <Code size={18} /> Download .tex
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
            
            {editMode === "latex" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
              >
                <h2 className="text-lg font-semibold mb-4">LaTeX Source</h2>
                <textarea
                  value={latexSource}
                  onChange={(e) => setLatexSource(e.target.value)}
                  className="w-full h-[calc(100vh-350px)] rounded-md border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                  spellCheck={false}
                />
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
                >
                  <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={contactInfo.fullName}
                      onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="text"
                      placeholder="LinkedIn URL"
                      value={contactInfo.linkedin}
                      onChange={(e) => setContactInfo({...contactInfo, linkedin: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="text"
                      placeholder="Portfolio/Website"
                      value={contactInfo.portfolio}
                      onChange={(e) => setContactInfo({...contactInfo, portfolio: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={contactInfo.location}
                      onChange={(e) => setContactInfo({...contactInfo, location: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Work Experience</h2>
                    <button
                      onClick={addExperience}
                      className="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {experiences.map((exp, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 p-4 relative">
                        {experiences.length > 1 && (
                          <button
                            onClick={() => removeExperience(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => updateExperience(index, "company", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateExperience(index, "title", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Start Date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <input
                              type="text"
                              placeholder="End Date (or Present)"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <textarea
                            placeholder="Description (one accomplishment per line)"
                            value={exp.description}
                            onChange={(e) => updateExperience(index, "description", e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Education</h2>
                    <button
                      onClick={addEducation}
                      className="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {education.map((edu, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 p-4 relative">
                        {education.length > 1 && (
                          <button
                            onClick={() => removeEducation(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="School/University"
                            value={edu.school}
                            onChange={(e) => updateEducation(index, "school", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, "degree", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            placeholder="Field of Study"
                            value={edu.field}
                            onChange={(e) => updateEducation(index, "field", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            placeholder="Graduation Date"
                            value={edu.graduationDate}
                            onChange={(e) => updateEducation(index, "graduationDate", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
                >
                  <h2 className="text-lg font-semibold mb-4">Skills</h2>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      onClick={addSkill}
                      className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-sm font-semibold text-white hover:opacity-90 shadow-lg"
            >
              <Save size={18} /> Save Master Resume
            </motion.button>
          </div>

          <div className="sticky top-6 h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl bg-white shadow-2xl overflow-hidden"
            >
              <div className="bg-gray-100 px-6 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">PDF Preview</h3>
                {isCompiling && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Compiling...</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 flex items-center justify-center" style={{ height: 'calc(100vh - 160px)' }}>
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Resume PDF Preview"
                  />
                ) : (
                  <div className="text-center text-gray-400 p-12">
                    <FileText size={64} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Your PDF preview will appear here</p>
                    <p className="text-xs mt-2">Start editing to see live updates</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
