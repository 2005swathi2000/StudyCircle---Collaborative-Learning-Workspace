'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, clearAuthToken, clearUserInfo, getUserInfo } from '../utils/api';
import { 
  BookOpen, 
  LogOut, 
  Flame, 
  Clock, 
  Plus, 
  Hash, 
  FolderPlus, 
  Search, 
  Users, 
  ChevronRight, 
  BookMarked,
  LayoutDashboard,
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Award,
  Shield,
  Bell,
  FileText,
  Star,
  MessageSquare,
  ArrowUpRight,
  Download,
  Radio
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  inviteCode: string;
  isPublic: boolean;
  GroupMember: {
    role: 'admin' | 'student';
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ streakCount: 0, totalStudyHours: 0.0 });
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Join Group state
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Group state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupSubject, setGroupSubject] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = getUserInfo();
    if (!cachedUser) {
      router.replace('/login');
      return;
    }
    setUser(cachedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsData = await apiRequest('/progress/me');
      setStats({
        streakCount: statsData.streakCount,
        totalStudyHours: statsData.totalStudyHours,
      });

      // Fetch groups
      const groupsData = await apiRequest('/groups');
      setGroups(groupsData.groups || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (err.message.includes('token') || err.message.includes('auth')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    clearUserInfo();
    router.replace('/login');
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    
    if (!inviteCode.trim()) return;
    
    setJoining(true);
    try {
      const data = await apiRequest('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      setJoinSuccess(`Successfully joined ${data.group.name}!`);
      setInviteCode('');
      // Refresh groups list
      const groupsData = await apiRequest('/groups');
      setGroups(groupsData.groups || []);
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join group.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    
    if (!groupName.trim()) {
      setCreateError('Group name is required.');
      return;
    }

    setCreating(true);
    try {
      await apiRequest('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDesc.trim(),
          subject: groupSubject.trim(),
          isPublic: true,
        }),
      });
      
      setGroupName('');
      setGroupDesc('');
      setGroupSubject('');
      setShowCreateModal(false);
      
      // Refresh groups list
      const groupsData = await apiRequest('/groups');
      setGroups(groupsData.groups || []);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  // Helper to strip college tagging for clean display in UI
  const formatNameAndCollege = (fullName: string) => {
    if (!fullName) return { name: '', college: '' };
    const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { name: match[1], college: match[2] };
    }
    return { name: fullName, college: '' };
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const { name: cleanName, college } = formatNameAndCollege(user?.fullName || '');

  const isStudentDemo = user?.username === 'student.demo@studycircle.com';
  const isMentorDemo = user?.username === 'mentor.demo@studycircle.com';
  const isAdminDemo = user?.username === 'admin.demo@studycircle.com';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden pb-12">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px]" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px]" />

      {/* Nav bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-white bg-clip-text text-transparent">
            StudyCircle
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-sm font-semibold">{cleanName}</span>
            <span className="text-xs text-zinc-500 capitalize">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-950 hover:bg-red-950/20 active:scale-95 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Dashboard container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Stats and Info */}
        <section className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-lg uppercase shrink-0">
                {cleanName.substring(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-zinc-100 truncate">{cleanName}</h3>
                <p className="text-sm text-zinc-500">@{user?.username}</p>
                {college && (
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/40 border border-violet-900/50 text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
                    <GraduationCap className="h-3 w-3 shrink-0" /> {college}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-zinc-800/60" />

            {isStudentDemo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-amber-500 mb-1">
                    <Flame className="h-5 w-5 fill-amber-500/20" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">15 days</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Study Streak</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-violet-400 mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">120 hrs</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Study Hours</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-indigo-400 mb-1">
                    <Radio className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">48</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Completed Sessions</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-emerald-400 mb-1">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">23</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Notes Shared</span>
                </div>
              </div>
            )}

            {isMentorDemo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-violet-400 mb-1">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">85</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Students Mentored</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-indigo-400 mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">42</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Sessions Conducted</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-amber-500 mb-1">
                    <Star className="h-5 w-5 fill-amber-500/25" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">4.8/5</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Avg Rating</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-emerald-400 mb-1">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">31</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Notes Published</span>
                </div>
              </div>
            )}

            {isAdminDemo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-violet-400 mb-1">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">500+</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Total Users</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-indigo-400 mb-1">
                    <Radio className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">40+</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Active Rooms</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-amber-500 mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">1000+</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Study Sessions</span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-emerald-400 mb-1">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">2500+</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Notes Shared</span>
                </div>
              </div>
            )}

            {!isStudentDemo && !isMentorDemo && !isAdminDemo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-amber-500 mb-1">
                    <Flame className="h-5 w-5 fill-amber-500/20" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">{stats.streakCount}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                    {user?.role === 'admin' ? 'Active Days' : 'Day Streak'}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-900 text-center">
                  <div className="flex justify-center text-violet-400 mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="block text-xl font-extrabold text-zinc-100">{stats.totalStudyHours}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                    {user?.role === 'admin' ? 'Coaching Hrs' : 'Study Hrs'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Achievements Badge Panel */}
          <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-400" /> Unlocked Accolades
              </h4>
              <span className="text-[10px] font-semibold text-violet-400 px-2 py-0.5 rounded-full bg-violet-950/40 border border-violet-900/50">
                Level {(stats.streakCount >= 5 || stats.totalStudyHours >= 15) ? 'Scholar' : 'Novice'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Badge 1: Early Bird */}
              <div className={`p-3 rounded-2xl border flex items-center gap-3.5 transition-all ${
                stats.streakCount >= 3 
                  ? 'bg-amber-950/25 border-amber-500/35 text-amber-200 shadow-md shadow-amber-500/[0.02]' 
                  : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 opacity-50'
              }`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  stats.streakCount >= 3 
                    ? 'bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10' 
                    : 'bg-zinc-900 text-zinc-600'
                }`}>
                  <Flame className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Early Bird</span>
                    <span className="text-[9px] font-semibold uppercase">{stats.streakCount >= 3 ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5 font-light">Maintain a 3+ day streak</p>
                </div>
              </div>

              {/* Badge 2: Warrior */}
              <div className={`p-3 rounded-2xl border flex items-center gap-3.5 transition-all ${
                stats.totalStudyHours >= 10 
                  ? 'bg-violet-950/25 border-violet-500/35 text-violet-200 shadow-md shadow-violet-500/[0.02]' 
                  : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 opacity-50'
              }`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  stats.totalStudyHours >= 10 
                    ? 'bg-violet-500/20 text-violet-400 shadow-md shadow-violet-500/10' 
                    : 'bg-zinc-900 text-zinc-600'
                }`}>
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Warrior</span>
                    <span className="text-[9px] font-semibold uppercase">{stats.totalStudyHours >= 10 ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5 font-light">Log 10+ hours study time</p>
                </div>
              </div>

              {/* Badge 3: Scholar */}
              <div className={`p-3 rounded-2xl border flex items-center gap-3.5 transition-all ${
                stats.totalStudyHours >= 15 
                  ? 'bg-indigo-950/25 border-indigo-500/35 text-indigo-200 shadow-md shadow-indigo-500/[0.02]' 
                  : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 opacity-50'
              }`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  stats.totalStudyHours >= 15 
                    ? 'bg-indigo-500/20 text-indigo-400 shadow-md shadow-indigo-500/10' 
                    : 'bg-zinc-900 text-zinc-650'
                }`}>
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Scholar Badge</span>
                    <span className="text-[9px] font-semibold uppercase">{stats.totalStudyHours >= 15 ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5 font-light">Write 3+ shared study notes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Layout for Admin vs Student */}
          {user?.role === 'admin' ? (
            <>
              {/* Primary Admin CTA: Create Circle */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-violet-500/30 rounded-3xl space-y-4 shadow-lg shadow-violet-600/[0.02]">
                <h4 className="font-bold text-violet-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <FolderPlus className="h-4.5 w-4.5" /> Initialize Workspace
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Start a new study circle, syllabus prep group, or mock interview cohort for your students.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer border border-violet-500 shadow-md shadow-violet-600/15"
                >
                  Create Study Circle
                </button>
              </div>

              {/* Secondary Admin CTA: Join Circle */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
                <h4 className="font-bold text-zinc-200 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Hash className="h-4 w-4 text-zinc-500" /> Join via Code
                </h4>
                <form onSubmit={handleJoinGroup} className="space-y-3">
                  <input
                    type="text"
                    maxLength={8}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter 8-digit code"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-700 text-sm outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={joining || !inviteCode.trim()}
                    className="w-full py-2 px-3 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-50 text-zinc-300 text-sm font-medium rounded-xl border border-zinc-850 transition-all cursor-pointer"
                  >
                    {joining ? 'Joining...' : 'Join Circle'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Primary Student CTA: Join Circle */}
              <div className="p-6 bg-gradient-to-tr from-zinc-900/40 to-indigo-950/20 backdrop-blur-md border border-indigo-500/30 rounded-3xl space-y-4 shadow-lg shadow-indigo-600/[0.02]">
                <h4 className="font-bold text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Hash className="h-4 w-4" /> Join Study Circle
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Have an invite code from a classmate? Enter it below to join their workspace immediately.
                </p>
                <form onSubmit={handleJoinGroup} className="space-y-3">
                  <input
                    type="text"
                    maxLength={8}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. olcp7i8b"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-zinc-100 placeholder-zinc-700 text-sm outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={joining || !inviteCode.trim()}
                    className="w-full py-2.5 px-3 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer border border-indigo-500"
                  >
                    {joining ? 'Joining...' : 'Join Workspace'}
                  </button>
                </form>
              </div>

              {/* Secondary Student CTA: Create Circle */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full p-4 bg-zinc-900/45 hover:bg-zinc-850/60 border border-zinc-850/80 text-zinc-300 text-sm font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Study Circle
              </button>
            </>
          )}

          {joinError && <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/30">{joinError}</p>}
          {joinSuccess && <p className="text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30">{joinSuccess}</p>}
        </section>

        {/* Right Side: Active Groups & Main Workspace Feed */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
              <LayoutDashboard className="h-5 w-5 text-indigo-400" /> My Study Circles
            </h3>
            <span className="text-xs text-zinc-500 font-medium px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              {groups.length} Circles joined
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              <span className="h-6 w-6 border-2 border-t-transparent border-zinc-600 rounded-full animate-spin mr-3" />
              Loading your study circles...
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl space-y-4">
              <div className="inline-flex h-12 w-12 rounded-full bg-zinc-900 items-center justify-center text-zinc-500">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-300 text-lg">No circles found</h4>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  You aren't a member of any study groups yet. Create one or ask your classmates for an invite code.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 hover:border-violet-500/45 rounded-3xl flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-violet-600/[0.02]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-900/50 text-indigo-300">
                        {group.subject || 'General'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        Role: {group.GroupMember?.role || 'student'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg text-zinc-100 group-hover:text-violet-400 transition-colors">
                        {group.name}
                      </h4>
                      <p className="text-sm text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 select-all" title="Invite Code">
                        {group.inviteCode}
                      </span>
                    </div>

                    <Link 
                      href={`/group/${group.id}`}
                      className="px-4 py-2 bg-zinc-850 hover:bg-violet-600 hover:text-white font-semibold text-xs rounded-xl border border-zinc-800 hover:border-violet-500 active:scale-95 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      Workspace <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Section for Demo Accounts */}
          {isStudentDemo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fadeIn">
              {/* Notifications Card */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
                <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-400" /> Recent Notifications
                </h4>
                <div className="space-y-3.5">
                  <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-zinc-200">Mentor feedback received</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                        Dr. Prasad left feedback on your DBMS normalization assignment: "Excellent work on Boyce-Codd Normal Form conversions. 10/10!"
                      </p>
                      <span className="text-[9px] text-zinc-650 block mt-1">10 minutes ago</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-zinc-200">Upcoming study session</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                        "DSA Mock Interview" with Dr. Prasad is scheduled to start tomorrow at 2:00 PM. Review Two Sum patterns.
                      </p>
                      <span className="text-[9px] text-zinc-650 block mt-1">2 hours ago</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 flex items-start gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 shrink-0 mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-zinc-200">New note shared in room</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                        Dr. Prasad published "Java OOP Notes" in the Java Development workspace room.
                      </p>
                      <span className="text-[9px] text-zinc-650 block mt-1">5 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
                <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> Syllabus Progress & Readiness
                </h4>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Data Structures & Algorithms (DSA)</span>
                      <span className="text-violet-400">75%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: '75%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Java OOP & Backend Development</span>
                      <span className="text-indigo-400">82%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: '82%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Database Management Systems (DBMS)</span>
                      <span className="text-emerald-400">68%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Operating Systems (OS)</span>
                      <span className="text-amber-400">60%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMentorDemo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fadeIn">
              {/* Requests and Questions Card */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
                <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" /> Pending Student Tasks & Requests
                </h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-900/40">
                      5 Mentorship Requests
                    </span>
                    <ul className="mt-2 text-xs text-zinc-400 space-y-1 list-disc pl-4 font-light">
                      <li>Swathi (VITAP) requested DBMS normal form reviews.</li>
                      <li>Teja (VRSEC) requested a 1-on-1 DSA placement mock test.</li>
                      <li>Charan (RVRJC) requested review on SQL normalization.</li>
                      <li>Bhagya (RVRJC) and Karthik (VITAP) requested resume reviews.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/40">
                      3 Pending Discussion Threads
                    </span>
                    <ul className="mt-2 text-xs text-zinc-400 space-y-1.5 font-light">
                      <li className="flex justify-between items-center border-b border-zinc-900/60 pb-1">
                        <span>"Optimal Solution for Two Sum complexity checks"</span>
                        <span className="text-[9px] text-violet-400 font-bold">Reply needed</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-zinc-900/60 pb-1">
                        <span>"Spring Boot Relational Database Mappings"</span>
                        <span className="text-[9px] text-violet-400 font-bold">Reply needed</span>
                      </li>
                      <li className="flex justify-between items-center pb-0.5">
                        <span>"DBMS Normalization Practice Exercises"</span>
                        <span className="text-[9px] text-violet-400 font-bold">Reply needed</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Shared Resources & Student Feedback */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-5">
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-emerald-400" /> Active Placement Resources
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 text-center flex flex-col items-center justify-center gap-1 group cursor-pointer hover:border-violet-500/40 transition-colors">
                      <FileText className="h-4 w-4 text-violet-400" />
                      <span className="text-[9px] font-bold text-zinc-200">Placement Roadmap</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 text-center flex flex-col items-center justify-center gap-1 group cursor-pointer hover:border-violet-500/40 transition-colors">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span className="text-[9px] font-bold text-zinc-200">Java Interview Guide</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 text-center flex flex-col items-center justify-center gap-1 group cursor-pointer hover:border-violet-500/40 transition-colors">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <span className="text-[9px] font-bold text-zinc-200">System Design Basics</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" /> Student Feedback
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-200">Swathi (VITAP)</span>
                        <div className="flex text-amber-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                      </div>
                      <p className="text-[10px] text-zinc-400 italic font-light">"The normal form revision sessions were amazing. It cleared up all confusion with transitive dependencies before exams!"</p>
                    </div>

                    <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-200">Teja (VRSEC)</span>
                        <div className="flex text-amber-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                      </div>
                      <p className="text-[10px] text-zinc-400 italic font-light">"Excellent explanation of Spring microservices architectures and database pooling settings. Got some great resume tips too."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAdminDemo && (
            <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl mt-8 space-y-4 animate-fadeIn">
              <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-400" /> Admin Workspace Activity Log & Control Panel
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 space-y-1 text-center">
                  <span className="text-xs text-zinc-500 block font-bold">CPU LOAD</span>
                  <span className="text-base font-black text-emerald-400">12% Normal</span>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 space-y-1 text-center">
                  <span className="text-xs text-zinc-500 block font-bold">DATABASE CONNECTIVITY</span>
                  <span className="text-base font-black text-emerald-400">Online (SQLite3)</span>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-900 space-y-1 text-center">
                  <span className="text-xs text-zinc-500 block font-bold">API HEALTH INDEX</span>
                  <span className="text-base font-black text-emerald-400">100% (2ms response)</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl font-mono text-[9px] text-zinc-500 leading-normal max-h-36 overflow-y-auto space-y-1">
                <div>[2026-06-08 10:52:11] [INFO] Database tables auto-synced. SQLite initialization complete.</div>
                <div>[2026-06-08 10:52:12] [INFO] Seeder loaded student.demo@studycircle.com with streakCount 15, studyHours 120.0.</div>
                <div>[2026-06-08 10:52:12] [INFO] Seeder loaded mentor.demo@studycircle.com with streakCount 5, studyHours 42.0.</div>
                <div>[2026-06-08 10:52:13] [INFO] Seeder loaded admin.demo@studycircle.com with streakCount 12, studyHours 100.0.</div>
                <div>[2026-06-08 10:53:05] [INFO] CORS enabled for development sandbox. Listening on port 5000...</div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative space-y-5">
            <div>
              <h3 className="text-xl font-bold text-zinc-100">Create Study Circle</h3>
              <p className="text-xs text-zinc-500 mt-1">Initialize a collaborative space for exam prep or placement batches</p>
            </div>

            {createError && (
              <p className="text-xs text-red-400 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30">{createError}</p>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Circle Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. B.Tech Semester 6 Prep"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-700 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Subject / Branch</label>
                <input
                  type="text"
                  value={groupSubject}
                  onChange={(e) => setGroupSubject(e.target.value)}
                  placeholder="e.g. Computer Science / ECE"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-700 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</label>
                <textarea
                  rows={3}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Goals, schedules, guidelines..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-700 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl border border-zinc-700 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !groupName.trim()}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all cursor-pointer text-center"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
