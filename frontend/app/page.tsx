
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, CircleUser, TrendingUp, Clock, Target, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sankey,
  Rectangle
} from "recharts";


type User = {
  id: string;
  fullName: string;
  email?: string;
};

type Notification = {
  id: string;
  application_id: string;
  notification_date: string;
  message: string;
  is_completed: boolean;
};

type Application = {
  id: string;
  status: any;
  applied_date: string;
  job_title: string;
  application_stages?: {
    name: string;
  };
};

const COLORS = ['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function DashboardPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);

  const [user, setUser] = useState<User | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [hasLoadedNotifs, setHasLoadedNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const MotionLink = motion(Link);
  const links = [
    { label: "Home", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Applications", href: "/applications" },
    { label: "About", href: "/about" },
  ];

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const parseNotifDate = (d: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day).getTime();
    }
    return new Date(d).getTime();
  };

  const isDue = (notificationDate: string) => {
    const due = parseNotifDate(notificationDate);
    const now = Date.now();
    return due <= now;
  };

  const visibleNotifications = useMemo(() => {
    return notifications.filter((n) => !n.is_completed && isDue(n.notification_date));
  }, [notifications]);

  useEffect(() => {
    setUnreadCount(visibleNotifications.length);
  }, [visibleNotifications.length]);

  // Fetch applications for metrics
  useEffect(() => {
    const fetchApplications = async () => {
      if (!BASE_URL || !user?.id) return;

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/api/applications/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch applications");

        const response = await res.json();
        
        // DEBUG: Log the raw data to see its structure
        console.log("Applications response:", response);
        
        // Extract the actual applications array from the response
        const data = response.data || response;
        console.log("Applications data:", data);
        console.log("First application:", data[0]);
        
        setApplications(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchApplications();
  }, [BASE_URL, user]);

  // Calculate metrics
  const metrics = useMemo(() => {
     if (!Array.isArray(applications)) {
      return {
        totalApps: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
        pending: 0,
        successRate: "0",
        statusDistribution: [],
        weeklyData: [],
        sankeyData: { nodes: [], links: [] }
      };
    }

    const totalApps = applications.length;
    
    // DEBUG: Log to see what we're working with
    console.log("Total applications:", totalApps);
    
    const statusCounts = applications.reduce((acc, app) => {
      // Try multiple possible status locations in the API response
      const status = 
        app.application_stages?.name || 
        app.status?.name || 
        app.status || 
        'Unknown';
      
      // DEBUG: Log each app's status
      console.log("App status:", status, "Full app:", app);
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Status counts:", statusCounts);

    const interviews = statusCounts['Interview Scheduled'] || 0;
    const offers = statusCounts['Offer'] || 0;
    const rejected = statusCounts['Rejected'] || 0;
    const pending = statusCounts['Applied'] || 0;

    // Calculate success rate
    const successRate = totalApps > 0 ? ((interviews + offers) / totalApps * 100).toFixed(1) : "0";

    // Status distribution for pie chart
    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Applications over time (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentApps = applications.filter(app => new Date(app.applied_date) >= thirtyDaysAgo);
    
    const weeklyData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const count = recentApps.filter(app => {
        const date = new Date(app.applied_date);
        return date >= weekStart && date < weekEnd;
      }).length;
      return {
        week: `Week ${i + 1}`,
        applications: count
      };
    });

    // Sankey data for application flow
    const sankeyData = {
      nodes: [
        { name: 'Total Applications' },
        { name: 'Applied' },
        { name: 'Interview' },
        { name: 'Offer' },
        { name: 'Rejected' },
        { name: 'Accepted' }
      ],
      links: [
        { source: 0, target: 1, value: pending },
        { source: 0, target: 2, value: interviews },
        { source: 0, target: 4, value: rejected },
        { source: 2, target: 3, value: offers },
        { source: 3, target: 5, value: Math.floor(offers * 0.8) }, // Assume 80% acceptance
      ].filter(link => link.value > 0)
    };

    return {
      totalApps,
      interviews,
      offers,
      rejected,
      pending,
      successRate,
      statusDistribution,
      weeklyData,
      sankeyData
    };
  }, [applications]);

  // DEBUG: Log metrics whenever they change
  useEffect(() => {
    console.log("Calculated metrics:", metrics);
  }, [metrics]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!BASE_URL) return;

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    getCurrentUser();
  }, [BASE_URL]);

  const fetchNotifications = async (userId: string) => {
    if (!BASE_URL) return;

    try {
      setNotifLoading(true);
      setNotifError("");

      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${BASE_URL}/api/notifications/${userId}/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const result = await res.json();
      const list: Notification[] = result.data || [];

      setNotifications(list);
      setHasLoadedNotifs(true);
    } catch (e) {
      console.error(e);
      setNotifError("Failed to load notifications");
    } finally {
      setNotifLoading(false);
    }
  };

  const markNotificationComplete = async (notificationId: string) => {
    if (!BASE_URL) return;

    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error("Failed to complete notification");

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (e) {
      console.error(e);
      alert("Failed to mark notification as completed.");
    }
  };
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100 text-black">
      {/* Nav */}
      <header className="relative mx-auto max-w-7xl px-6 pt-6 flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <motion.button
            onClick={async () => {
              const next = !showNotifications;
              setShowNotifications(next);

              if (next && user?.id && !hasLoadedNotifs) {
                await fetchNotifications(user.id);
              }
            }}
            className="relative p-2 hover:bg-black/5 rounded-full"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.1, opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="cursor-pointer"
            onClick={() => router.push("/login")}
          >
            <CircleUser />
          </motion.div>
        </div>

        {showNotifications && (
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
        )}

        {showNotifications && (
          <div className="absolute right-6 top-16 w-96 max-w-[90vw] rounded-xl bg-white shadow-2xl border border-black/10 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <p className="font-semibold text-sm">Notifications</p>
              <button
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifLoading && <p className="p-4 text-sm">Loading…</p>}
              {notifError && <p className="p-4 text-sm text-red-600">{notifError}</p>}

              {!notifLoading && !notifError && visibleNotifications.length === 0 && (
                <p className="p-4 text-sm text-gray-600">
                  No due reminders right now
                </p>
              )}

              {!notifLoading &&
                !notifError &&
                visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 border-b border-black/5 cursor-pointer hover:bg-black/5"
                    onClick={async () => {
                      await markNotificationComplete(n.id);
                      setShowNotifications(false);
                      router.push("/applications");
                    }}
                  >
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(parseNotifDate(n.notification_date)).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </header>

      {/* Dashboard Content */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-center font-serif text-6xl mb-2">
          {user ? `${user.fullName}'s ` : ""}Dashboard
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Track your job search progress and metrics
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Total Applications</p>
                <p className="text-3xl font-bold mt-2">{metrics.totalApps}</p>
              </div>
              <Target className="w-10 h-10 text-pink-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Interviews</p>
                <p className="text-3xl font-bold mt-2">{metrics.interviews}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Offers</p>
                <p className="text-3xl font-bold mt-2">{metrics.offers}</p>
              </div>
              <Award className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Success Rate</p>
                <p className="text-3xl font-bold mt-2">{metrics.successRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Application Flow Sankey */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <h2 className="text-lg font-semibold mb-4">Application Flow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <Sankey
                data={metrics.sankeyData}
                node={<Rectangle fill="#ec4899" />}
                link={{ stroke: '#ec4899', strokeOpacity: 0.3 }}
                nodePadding={50}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <Tooltip />
              </Sankey>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md"
          >
            <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Weekly Applications Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Applications (Last 4 Weeks)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Add Job Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-10 text-center shadow-lg backdrop-blur-md"
        >
          <h2 className="text-3xl font-serif mb-4">
            Add your next job application
          </h2>

          <p className="text-sm text-gray-600 mb-8">
            Track progress, interviews, and offers by adding a job you’ve applied to.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => router.push("/newjob")}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            + Add Job Application
          </motion.button>

          <p className="mt-6 text-xs text-gray-500">
            You can edit status, notes, and reminders later.
          </p>
        </motion.div>

      </section>
    </main>
  );
}