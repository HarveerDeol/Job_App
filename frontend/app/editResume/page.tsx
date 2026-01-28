"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CircleUser, Plus, Trash2, Eye, EyeOff, FileText, Code, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Job = {
  id: string;
  position: string;
  company_name: string;
  description: string;
  resume_id:string;
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState<"form" | "latex">("form");
  const [latexSource, setLatexSource] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [compilationError, setCompilationError] = useState(null);
  const [isAITailoring, setIsAITailoring] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const getCurrentUser = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      try {
        const response = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
          }
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchStages = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      try {
        const response = await fetch(`${BASE_URL}/api/stages`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch stages');
        }
        
        const result = await response.json();
        setStages(result.data || []);
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    };
    
    fetchStages();
  }, []);

  const handleApply = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!user?.id) {
      alert('Please log in to apply for this job');
      router.push('/login');
      return;
    }

    if (!job) {
      alert('Job information not found');
      return;
    }

    setIsSubmitting(true);

    try {
      const resumeData = {
        user_id: user.id,
        name: `${job.company_name} - ${job.position}`,
        data: {
          contactInfo,
          summary,
          experiences,
          education,
          skills,
          latexSource
        },
        is_master: false
      };

      const resumeResponse = await fetch(`${BASE_URL}/api/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resumeData)
      });

      if (!resumeResponse.ok) {
        throw new Error('Failed to save resume');
      }

      const resumeResult = await resumeResponse.json();
      const resumeId = resumeResult.data?.id;

      const appliedStage = stages.find(s => s.name === 'Applied');
      
      if (!appliedStage) {
        throw new Error('Application stage not found');
      }

      const applicationData = {
        user_id: user.id,
        resume_id: job.resume_id,
        company_name: job.company_name,
        position: job.position,
        description : job.description,
        date_applied: new Date().toISOString().split('T')[0],
        stage_id: appliedStage.id,
      };

      const applicationResponse = await fetch(`${BASE_URL}/api/applications/${jobID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      if (!applicationResponse.ok) {
        throw new Error('Failed to submit application');
      }

      alert('Application submitted successfully!');
      router.push('/applications');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAITailorResume = async () => {
  if (!job || !latexSource) return;

  setIsAITailoring(true);
  setAiConfidence(null);

  try {
    const res = await fetch(`${BASE_URL}/api/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_tex: latexSource,
        job_title: job.position,
        job_description: job.description,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to tailor resume");
    }

    const data = await res.json();

    if (!data.tailored_resume_tex) {
      throw new Error("Invalid AI response");
    }

    setLatexSource(data.tailored_resume_tex);
    setEditMode("latex");

    setAiConfidence(data.confidence ?? null);
  } catch (err) {
    console.error("AI tailoring error:", err);
    alert("Failed to tailor resume. Please try again.");
  } finally {
    setIsAITailoring(false);
  }
};


  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    location: ""
  });

  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState([
    { company: "", title: "", startDate: "", endDate: "", description: "" }
  ]);
  const [education, setEducation] = useState([
    { school: "", degree: "", field: "", graduationDate: "" }
  ]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [showJob, setShowJob] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [jobWidth, setJobWidth] = useState(25);
  const [formWidth, setFormWidth] = useState(35);
  const searchParams = useSearchParams();
  const jobID = searchParams.get("jobID");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'job' | 'form' | null>(null);


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

  const downloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "resume.pdf";
      a.click();
    }
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

useEffect(() => {
  if (!user?.id || !jobID) return; 
  
  fetch(`${BASE_URL}/api/applications/${user.id}/${jobID}`)
    .then((res) => res.json())
    .then((data) => {
      setJob(data.data || data); // Adjust based on your API response structure
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching application:', error);
      setLoading(false);
    });
}, [jobID, user, BASE_URL]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const relativeX = e.clientX - containerRect.left;
      const percentage = (relativeX / containerWidth) * 100;

      if (isDragging === 'job') {
        setJobWidth(Math.max(10, Math.min(60, percentage)));
      } else if (isDragging === 'form') {
        const jobWidthActual = showJob ? jobWidth : 0;
        const adjustedPercentage = percentage - jobWidthActual;
        setFormWidth(Math.max(10, Math.min(70, adjustedPercentage)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, jobWidth, showJob, showForm, showPreview]);

  const MotionLink = motion(Link);
  const links = [
    { label: "← Back to listings", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

  const addExperience = () => {
    setExperiences([...experiences, { company: "", title: "", startDate: "", endDate: "", description: "" }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experiences];
    updated[index][field as keyof typeof updated[0]] = value;
    setExperiences(updated);
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", field: "", graduationDate: "" }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index][field as keyof typeof updated[0]] = value;
    setEducation(updated);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const visibleCards = [showJob, showForm, showPreview].filter(Boolean).length;
  const getActualWidth = (cardWidth: number, isVisible: boolean) => {
    if (!isVisible) return 0;
    if (visibleCards === 1) return 100;
    return cardWidth;
  };

  const actualJobWidth = getActualWidth(jobWidth, showJob);
  const actualFormWidth = getActualWidth(formWidth, showForm);
  const actualPreviewWidth = 100 - actualJobWidth - actualFormWidth;


  useEffect(() => {
    if (!user?.id) return;

    const fetchResume = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

      try {
        if (!user?.id || !job) return; 
        const res = await fetch(
          
          `${BASE_URL}/api/resumes/${job.resume_id}`);

        if (!res.ok) {
          if (res.status === 404) return;
          throw new Error("Failed to fetch master resume");
        }

        const result = await res.json();
        const resumeData = result.data?.data;

        if (!resumeData) return;

        setContactInfo(resumeData.contactInfo || {});
        setSummary(resumeData.summary || "");
        setExperiences(resumeData.experiences || []);
        setEducation(resumeData.education || []);
        setSkills(resumeData.skills || []);
        
        if (resumeData.latexSource) {
          setLatexSource(resumeData.latexSource);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchResume();
  }, [user, job]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100">
      <header className="mx-auto max-w-[98%] px-6 pt-6 flex items-center justify-between">
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

      <section className="mx-auto max-w-[98%] px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-5xl">Tailor Your Resume</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowJob(!showJob)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showJob 
                  ? 'bg-black text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {showJob ? <Eye size={16} /> : <EyeOff size={16} />}
              Job
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showForm 
                  ? 'bg-black text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {showForm ? <Eye size={16} /> : <EyeOff size={16} />}
              Edit
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPreview 
                  ? 'bg-black text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
              Preview
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Customize your resume for this specific job posting
        </p>

        <div className="flex justify-center gap-4 mb-6">
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

        <div ref={containerRef} className="flex gap-0 h-[calc(100vh-340px)] relative">
          {showJob && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ width: `${actualJobWidth}%` }}
              className="flex flex-col relative"
            >
              <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md overflow-y-auto flex-1 mr-2">
                <h2 className="text-lg font-semibold mb-4">Job Posting</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{job.position}</h3>
                    <p className="text-lg text-gray-700">{job.company_name}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-600">
                      Description
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                </div>
              </div>

              {showForm && (
                <div
                  onMouseDown={() => setIsDragging('job')}
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-pink-300/50 transition-colors group"
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded group-hover:bg-pink-400 transition-colors" />
                </div>
              )}
            </motion.div>
          )}

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ width: `${actualFormWidth}%` }}
              className="flex flex-col relative"
            >
              <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md overflow-y-auto flex-1 mx-2 space-y-6">
                <h2 className="text-lg font-semibold">
                  {editMode === "form" ? "Edit Resume" : "LaTeX Source"}
                </h2>

                {editMode === "latex" ? (
                  <textarea
                    value={latexSource}
                    onChange={(e) => setLatexSource(e.target.value)}
                    className="w-full h-[calc(100%-80px)] rounded-md border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                    spellCheck={false}
                  />
                ) : (
                  <>
                    <div>
                      <h3 className="text-md font-semibold mb-3">Contact Information</h3>
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
                    </div>

                    <div>
                      <h3 className="text-md font-semibold mb-3">Professional Summary</h3>
                      <textarea
                        placeholder="Write a brief professional summary..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-semibold">Work Experience</h3>
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
                                  onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                              </div>
                              <textarea
                                placeholder="Description (use bullet points)"
                                value={exp.description}
                                onChange={(e) => updateExperience(index, "description", e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-semibold">Education</h3>
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
                    </div>

                    <div>
                      <h3 className="text-md font-semibold mb-3">Skills</h3>
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
                    </div>
                  </>
                )}
              </div>

              {showPreview && (
                <div
                  onMouseDown={() => setIsDragging('form')}
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-pink-300/50 transition-colors group"
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded group-hover:bg-pink-400 transition-colors" />
                </div>
              )}
            </motion.div>
          )}

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ width: `${actualPreviewWidth}%` }}
              className="flex flex-col"
            >
              <div className="rounded-xl bg-white shadow-2xl overflow-hidden flex-1 ml-2">
                <div className="bg-gray-100 px-6 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">PDF Preview</h3>
                  {isCompiling && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Compiling...</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 flex items-center justify-center overflow-y-auto" style={{ height: 'calc(100% - 53px)' }}>
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
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            disabled={isSubmitting}
            className="rounded-xl bg-black px-8 py-4 text-sm font-semibold text-white hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Resume'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAITailorResume}
            disabled={isAITailoring}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              isAITailoring
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-pink-500 to-amber-500 text-white hover:opacity-90"
            }`}
          >
            {isAITailoring ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Tailoring…
              </>
            ) : (
              <>
                ✨ AI Tailor Resume
              </>
            )}
          </motion.button>

        </div>
      </section>
    </main>
  );
}
