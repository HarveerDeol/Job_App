"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CircleUser } from "lucide-react";

type Resume = {
  id: string;
  name: string;
  data: any;
};

export default function CreateApplicationPage() {
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stages, setStages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [masterResume, setMasterResume] = useState<Resume | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    position: "",
    date_applied: new Date().toISOString().split("T")[0],
    stage_name: "Applied",
    notes: "",
    description: "",
  });

  const MotionLink = motion(Link);
  const links = [
    { label: "← Back to listings", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* Get the User */
  useEffect(() => {
    const getCurrentUser = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };

    getCurrentUser();
  }, []);

  /* Get the Master Resume */
  useEffect(() => {
    if (!user?.id) return;

    const fetchMasterResume = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/resumes/${user.id}/master`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("No master resume found. Please create one first.");
            return;
          }
          throw new Error("Failed to fetch master resume");
        }

        const result = await res.json();
        setMasterResume(result.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load master resume");
      }
    };

    fetchMasterResume();
  }, [user, BASE_URL]);

  /* Get Stages */
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/stages`);

        if (!response.ok) {
          throw new Error("Failed to fetch stages");
        }

        const result = await response.json();
        setStages(result.data || []);
      } catch (error) {
        console.error("Error fetching stages:", error);
      }
    };

    fetchStages();
  }, [BASE_URL]);

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!BASE_URL || !user?.id || !masterResume) {
      setError("Missing required data");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create a copy of the master resume
      const resumeCopy = {
        user_id: user.id,
        name: `${form.company_name} - ${form.position}`,
        data: masterResume.data,
        is_master: false,
      };

      const resumeRes = await fetch(`${BASE_URL}/api/resumes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resumeCopy),
      });

      if (!resumeRes.ok) throw new Error("Failed to create resume copy");

      const resumeResult = await resumeRes.json();
      const newResumeId = resumeResult.data.id;

      // Find the stage ID
      const appliedStage = stages.find((s) => s.name === form.stage_name);
      if (!appliedStage) throw new Error("Stage not found");

      // Create the job application
      const payload = {
        user_id: user.id,
        company_name: form.company_name,
        position: form.position,
        date_applied: form.date_applied,
        notes: form.notes || null,
        description: form.description || null,
        resume_id: newResumeId,
        stage_id: appliedStage.id,
      };

      const res = await fetch(`${BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create application");

      router.push("/applications");
    } catch (err) {
      console.error(err);
      setError("Could not save application. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="mx-auto max-w-5xl px-6 pt-6 flex items-center justify-between">
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
      <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100 px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-xl rounded-2xl bg-white/80 p-10 shadow-xl backdrop-blur-md"
        >
          <h1 className="text-center font-serif text-4xl mb-2">
            Add Job Application
          </h1>

          <p className="text-center text-sm text-gray-600 mb-8">
            Track a job you've applied to
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Company Name
              </label>
              <input
                name="company_name"
                required
                value={form.company_name}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Stripe"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Position
              </label>
              <input
                name="position"
                required
                value={form.position}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Frontend Engineer"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Application Stage
              </label>
              <select
                name="stage_name"
                value={form.stage_name}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option>Applied</option>
                <option>Interview</option>
                <option>Offer</option>
                <option>Rejected</option>
              </select>
            </div>

            {/* Applied Date */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Date Applied
              </label>
              <input
                type="date"
                name="date_applied"
                value={form.date_applied}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Job Description (optional)
              </label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Key requirements, stack, recruiter notes…"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Referral, follow-up date, impressions…"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || !masterResume}
                className="rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Saving…" : "Add Application"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </>
  );
}