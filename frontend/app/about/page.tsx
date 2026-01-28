"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CircleUser } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const MotionLink = motion(Link);
  const links = [
    { label: "← Back to listings", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

  // Fetch current user data
  useEffect(() => {
    const getCurrentUser = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
          throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    getCurrentUser();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100 text-black">
      {/* Navbar */}
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

      {/* About Content */}
      <section className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        <h1 className="text-center font-serif text-5xl">About This Hackathon</h1>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Goals</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Get to know each other</li>
            <li>Build a rapid prototype using web frameworks</li>
            <li>Learn the right way to use GitHub</li>
            <li>Develop something cool!</li>
          </ul>

          <h2 className="text-2xl font-semibold">Hackathon Theme (Winter 2026)</h2>
          <p className="ml-4">JOB APPLICATION ORGANIZER</p>

          <h2 className="text-2xl font-semibold">Problem Overview</h2>
          <p className="ml-4">
            The current job market can be challenging for job seekers. Individuals often find
            themselves applying to numerous companies, tailoring their resumes for each specific
            role, and struggling to keep track of all their applications.
          </p>

          <h2 className="text-2xl font-semibold">Your Task</h2>
          <p className="ml-4">
            Create software that assists job seekers in managing their job applications more
            efficiently. The system should allow users to:
          </p>
          <ul className="list-disc list-inside ml-8 space-y-2">
            <li>Monitor where they have applied</li>
            <li>Track the status of applications</li>
            <li>Customize resumes for different positions</li>
            <li>Keep all job-related information organized</li>
          </ul>

          <h2 className="text-2xl font-semibold">Key Features to Implement</h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Tracking Applications:</strong> Organize applications, categorize by stage
              (applied, interview, offer, rejection), and set reminders.
            </li>
            <li>
              <strong>Master Resume Management:</strong> Store a master resume and create tailored
              versions quickly.
            </li>
            <li>
              <strong>Response Tracking:</strong> Monitor communications and company responses.
            </li>
            <li>
              <strong>Ease of Use & Accessibility:</strong> Intuitive, simple, and mobile-friendly
              interface.
            </li>
            <li>
              <strong>Visual Design & Creativity:</strong> Attractive and engaging design elements.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold">Technology Uses</h2>
          <ul className="list-disc list-inside ml-8 space-y-2">
            <li>
              <strong>Backend:</strong>  Node Express PostgresSQL
            </li>
            <li>
              <strong>Frontend:</strong> React NextJS
            </li>
          </ul>

          <h2 className="text-2xl font-semibold">Evaluation Criteria</h2>
          <ul className="list-disc list-inside ml-8 space-y-2">
            <li>Effectiveness of application tracking</li>
            <li>Master resume management and customization</li>
            <li>Response management efficiency</li>
            <li>Ease of use and accessibility</li>
            <li>Visual design quality</li>
            <li>Creativity and unique features</li>
          </ul>

          <h2 className="text-2xl font-semibold">Hackathon Rules</h2>
          <ul className="list-disc list-inside ml-8 space-y-2">
            <li>You will know your project teams by Friday evening</li>
            <li>All work will be done within your project teams</li>
          </ul>

          <p className="mt-4">
            Be creative and make it your way! This hackathon is about learning, collaborating, and
            building something impactful.
          </p>
        </div>
      </section>
    </main>
  );
}
