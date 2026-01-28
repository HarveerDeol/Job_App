"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CircleUser, Calendar, FileText, X, Bell, Eye, Plus, EllipsisVertical, Trash2 } from "lucide-react";
import Link from "next/link";

type Application = {
  id: string;
  company_name: string;
  position: string;
  date_applied: string;
  stage_id: string;
  stage_name: string;
  notes?: string;
  descripiton: string;
  resume_id?: string;
  resumeData?: {
    contactInfo: {
      fullName: string;
      email: string;
      phone: string;
      linkedin?: string;
      portfolio?: string;
      location?: string;
    };
    summary: string;
    experiences: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate: string;
      description?: string;
    }>;
    education: Array<{
      school: string;
      degree: string;
      field?: string;
      graduationDate?: string;
    }>;
    skills: string[];
  };
};

type Stage = {
  id: string;
  name: string;
};

type Notification = {
  id: string;
  notification_date: string;
  message: string;
  is_completed: boolean;
};

const STAGE_COLORS: { [key: string]: string } = {
  'Applied': "bg-blue-50 border-blue-200",
  'Interview': "bg-purple-50 border-purple-200",
  'Offer': "bg-green-50 border-green-200",
  'Rejected': "bg-red-50 border-red-200",
};

const STAGE_HEADER_COLORS: { [key: string]: string } = {
  'Applied': "bg-blue-100 text-blue-800",
  'Interview': "bg-purple-100 text-purple-800",
  'Offer': "bg-green-100 text-green-800",
  'Rejected': "bg-red-100 text-red-800",
};

export default function KanbanBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<{ [key: string]: Notification }>({});
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const MotionLink = motion(Link);
  const links = [
    { label: "← Back to listings", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

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
        
        if (data.user?.id) {
          await Promise.all([
            fetchStages(),
            fetchApplications(data.user.id),
            fetchNotifications(data.user.id)
          ]);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, []);

  const fetchStages = async () => {
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

  const fetchApplications = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/applications/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const result = await response.json();
      
      const transformedApps = (result.data || []).map((app: any) => ({
        id: app.id,
        company_name: app.company_name,
        position: app.position,
        date_applied: app.date_applied,
        stage_id: app.stage_id,
        stage_name: app.application_stages?.name || 'Applied',
        notes: app.notes,
        description: app.description,
        resume_id: app.resume_id,
        resumeData: app.resumes?.data ? {
          contactInfo: app.resumes.data.contactInfo || {},
          summary: app.resumes.data.summary || '',
          experiences: app.resumes.data.experiences || [],
          education: app.resumes.data.education || [],
          skills: app.resumes.data.skills || []
        } : undefined
      }));
      
      setApplications(transformedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/${userId}/pending`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const result = await response.json();
      
      const notifMap: { [key: string]: Notification } = {};
      (result.data || []).forEach((notif: any) => {
        notifMap[notif.application_id] = notif;
      });
      
      setNotifications(notifMap);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateStatus = async (appId: string, newStageId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage_id: newStageId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      const newStageName = stages.find(s => s.id === newStageId)?.name || 'Applied';
      setApplications(applications.map(app =>
        app.id === appId ? { ...app, stage_id: newStageId, stage_name: newStageName } : app
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const deleteApplication = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`${BASE_URL}/api/applications/${selectedApplication.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      // Remove from local state
      setApplications(applications.filter(app => app.id !== selectedApplication.id));
      setShowDeleteModal(false);
      setSelectedApplication(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application. Please try again.');
    }
  };

  const handleDragStart = (appId: string) => {
    setDraggedCard(appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (draggedCard) {
      updateStatus(draggedCard, stageId);
      setDraggedCard(null);
    }
  };

  const openNotesModal = (app: Application) => {
    setSelectedApplication(app);
    setNotesDraft(app.notes ?? "");
    setShowNotesModal(true);
    setOpenMenuId(null);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setNotesDraft("");
    setSelectedApplication(null);
  };

  const saveNotes = async () => {
    if (!selectedApplication) return;

    try {
      setSavingNotes(true);

      const response = await fetch(`${BASE_URL}/api/applications/${selectedApplication.id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesDraft }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApplication.id ? { ...a, notes: notesDraft } : a
        )
      );

      closeNotesModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const setReminder = async () => {
    if (!selectedApplication || !reminderDate || !user) return;

    try {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          application_id: selectedApplication.id,
          notification_date: reminderDate,
          message: `Reminder: Follow up on your application for ${selectedApplication.position} at ${selectedApplication.company_name}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      setShowReminderModal(false);
      setReminderDate("");
      setOpenMenuId(null);
      alert("Reminder set successfully!");
    } catch (error) {
      console.error("Error setting reminder:", error);
      alert("Could not set reminder. Please try again.");
    }
  };

  const getApplicationsByStage = (stageName: string) => {
    return applications.filter(app => app.stage_name === stageName);
  };

  const toggleMenu = (appId: string) => {
    setOpenMenuId(openMenuId === appId ? null : appId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100 flex items-center justify-center">
        <p className="text-lg">Loading applications...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100">
      {/* Nav */}
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

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-center font-serif text-5xl mb-2">Application Board</h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Drag and drop applications between stages
        </p>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageApps = getApplicationsByStage(stage.name);
            
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Column Header */}
                <div className={`rounded-t-xl px-4 py-3 ${STAGE_HEADER_COLORS[stage.name] || 'bg-gray-100 text-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm uppercase tracking-wide">{stage.name}</h2>
                    <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Column Body */}
                <div className={`min-h-[500px] rounded-b-xl p-3 space-y-3 border-2 border-t-0 ${STAGE_COLORS[stage.name] || 'bg-gray-50 border-gray-200'}`}>
                  <AnimatePresence>
                    {stageApps.map((app) => {
                      const notification = notifications[app.id];
                      
                      return (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={() => handleDragStart(app.id)}
                          whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                          className="rounded-lg bg-white p-4 shadow-sm cursor-move border border-gray-200 relative"
                        >
                          {/* Notification Badge */}
                          {notification && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                              <Bell size={12} />
                              <span className="text-[10px]">
                                {new Date(notification.notification_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Company & Position with Menu */}
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm mb-1">{app.company_name}</h3>
                              <p className="text-xs text-gray-600 mb-3">{app.position}</p>
                            </div>
                            
                            {/* Menu Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(app.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <EllipsisVertical size={16} />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {openMenuId === app.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setShowDeleteModal(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Date Applied */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-3">
                            <Calendar size={10} />
                            {new Date(app.date_applied).toLocaleDateString()}
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowReminderModal(true);
                              }}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-black/5 hover:bg-black/10 text-[10px] font-medium transition-colors"
                            >
                              <Bell size={10} />
                              Remind
                            </button>
                            
                            {app.resumeData && (
                              <button
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowResumeModal(true);
                                }}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-black text-white hover:opacity-90 text-[10px] font-medium transition-all"
                              >
                                <Eye size={10} />
                                Resume
                              </button>
                            )}
                            
                            <button
                              onClick={() => openNotesModal(app)}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-black/5 hover:bg-black/10 text-[10px] font-medium transition-colors col-span-2"
                            >
                              <FileText size={10} />
                              {app.notes?.trim() ? "Edit Notes" : "Add Notes"}
                            </button>
                          </div>

                          {/* Notes Preview */}
                          {app.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] text-gray-500 line-clamp-2">
                                {app.notes}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty State */}
                  {stageApps.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Plus size={32} className="mb-2 opacity-30" />
                      <p className="text-xs">Drag applications here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resume Preview Modal */}
      <AnimatePresence>
        {showResumeModal && selectedApplication?.resumeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold">Resume for {selectedApplication.company_name}</h2>
                  <p className="text-sm text-gray-500">{selectedApplication.position}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300 }}
                   onClick={() => {router.push(`/editResume?jobID=${selectedApplication.id}`)}}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  Edit Resume
                </motion.button>
                </div>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8" style={{ fontFamily: "'Times New Roman', serif" }}>
                <div className="text-center mb-8 pb-6 border-b border-gray-300">
                  <h1 className="text-2xl font-bold mb-2 tracking-wide">
                    {selectedApplication.resumeData.contactInfo.fullName.toUpperCase()}
                  </h1>
                  <div className="text-xs text-gray-600 space-x-2">
                    <span>{selectedApplication.resumeData.contactInfo.email}</span>
                    <span>•</span>
                    <span>{selectedApplication.resumeData.contactInfo.phone}</span>
                  </div>
                </div>

                {selectedApplication.resumeData.summary && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-900 pb-1 mb-2">
                      Professional Summary
                    </h2>
                    <p className="text-xs text-gray-800 leading-relaxed">
                      {selectedApplication.resumeData.summary}
                    </p>
                  </div>
                )}

                {selectedApplication.resumeData.experiences.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-900 pb-1 mb-3">
                      Experience
                    </h2>
                    <div className="space-y-3">
                      {selectedApplication.resumeData.experiences.map((exp, idx) => (
                        <div key={idx} className="flex justify-between">
                          <div>
                            <h3 className="text-xs font-semibold">{exp.company}</h3>
                            <p className="text-xs italic">{exp.title}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p>{exp.startDate} - {exp.endDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.resumeData.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-900 pb-1 mb-3">
                      Education
                    </h2>
                    <div className="space-y-2">
                      {selectedApplication.resumeData.education.map((edu, idx) => (
                        <div key={idx}>
                          <h3 className="text-xs font-semibold">{edu.school}</h3>
                          <p className="text-xs italic">{edu.degree}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.resumeData.skills.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-900 pb-1 mb-2">
                      Skills
                    </h2>
                    <p className="text-xs text-gray-800">
                      {selectedApplication.resumeData.skills.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-600">Delete Application</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to delete your application for:
                </p>
                <p className="font-semibold text-gray-900">
                  {selectedApplication.position} at {selectedApplication.company_name}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  This action cannot be undone. All notes and reminders associated with this application will also be deleted.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={deleteApplication}
                  className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Delete Application
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowReminderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Set Follow-Up Reminder</h2>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Set a reminder for <span className="font-semibold">{selectedApplication.company_name}</span> - {selectedApplication.position}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={setReminder}
                  disabled={!reminderDate}
                  className="flex-1 rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Reminder
                </button>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={closeNotesModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Notes — {selectedApplication.company_name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedApplication.position}</p>
                </div>
                <button
                  onClick={closeNotesModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your notes
                </label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add interview details, recruiter name, follow-up plan, salary range, etc."
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Tip: Paste the job link, add key requirements, and track your follow-ups.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="flex-1 rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </button>
                <button
                  onClick={closeNotesModal}
                  className="flex-1 rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}