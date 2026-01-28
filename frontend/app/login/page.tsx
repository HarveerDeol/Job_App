"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const MotionLink = motion(Link);
  const links = [
  { label: "← Back to listings", href: "/" },
  { label: "Resume", href: "/resume" },
  { label: "Applications", href: "/applications" },
  { label: "About", href: "/about" },
  ];

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), // add `name` only if signing up
    });

    const data = await res.json(); 

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    console.log("Login successful:", data);
    router.push("/");
    localStorage.setItem('accessToken', data.session.accessToken);
    localStorage.setItem('refreshToken', data.session.refreshToken);
  } catch (err: any) {
    setError(err.message);
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl bg-white/80 p-8 shadow-lg backdrop-blur-md"
      >
        <h1 className="mb-6 text-center font-serif text-3xl font-bold text-black">
          Login
        </h1>

        {error && <p className="mb-4 text-center text-red-600">{error}</p>}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-black placeholder-gray-400 focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-black placeholder-gray-400 focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/signup" className="font-semibold text-pink-600 hover:underline">
            Sign up
          </a>
        </p>
      </motion.div>
    </main>
    </>
  );
}
