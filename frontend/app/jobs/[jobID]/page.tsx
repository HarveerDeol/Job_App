"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CircleUser } from "lucide-react";
import Link from "next/link";

type Job = {
  jobID: string;
  Title: string;
  Company: string;
  Location: string;
  Description: string;
};



export default function JobDetailPage() {
    const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/jobs/${params.jobID}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data);
        setLoading(false);
      });
  }, [params.jobID]);

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  const MotionLink = motion(Link);
  const links = [
  { label: "← Back to listings", href: "/" },
  { label: "Resume", href: "/resume" },
  { label: "Applications", href: "/applications" },
  { label: "About", href: "/about" },
  ];
  

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100 text-black flex flex-col">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between">
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

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-12 flex-1">
        {loading && <p className="text-center">Loading job details…</p>}

        {!loading && job && (
          <motion.article
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-xl bg-white/80 p-12 shadow-lg mx-auto max-w-3xl"
          >
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl font-serif font-bold">{job.Title}</h1>
                <p className="text-2xl mt-3 text-gray-700">{job.Company}</p>
                <p className="mt-2 text-lg text-gray-500">{job.Location}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {job.Description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                   onClick={() => {router.push(`/apply?jobID=${job.jobID}`)}}
                  className="rounded-md bg-black px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  Apply now
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-md border border-black px-8 py-3 text-sm font-semibold hover:bg-black/5"
                >
                  Back to listings
                </button>
              </div>
            </div>
          </motion.article>
        )}

        {!loading && !job && (
          <p className="text-center text-red-600">Job not found</p>
        )}
      </section>
    </main>
  );
}

