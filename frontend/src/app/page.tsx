'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, setAuthToken, setUserInfo, getAuthToken } from './utils/api';
import { useToast } from './components/ToastProvider';
import { 
  BookOpen, 
  ArrowRight, 
  Flame, 
  Clock, 
  Check, 
  Radio, 
  FileText, 
  MessageSquare, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Lock,
  ChevronRight,
  Zap,
  Award,
  Key,
  User,
  AlertCircle,
  Shield
} from 'lucide-react';

const COLLEGES = [
  { code: 'VRSEC', name: 'VR Siddhartha Engineering College, Vijayawada' },
  { code: 'PVPSIT', name: 'PVPSIT, Vijayawada' },
  { code: 'RVRJC', name: 'RVR & JC College of Engineering, Guntur' },
  { code: 'VITAP', name: 'VIT-AP University, Amaravati' },
  { code: 'KLU', name: 'KL University, Vaddeswaram' },
  { code: 'GITAM', name: 'GITAM University, Visakhapatnam' },
  { code: 'SRKR', name: 'SRKR Engineering College, Bhimavaram' },
  { code: 'JNTUK', name: 'JNTU Kakinada (JNTUK)' },
  { code: 'JNTUA', name: 'JNTU Anantapur (JNTUA)' },
  { code: 'AU', name: 'Andhra University, Vizag' },
  { code: 'CBIT', name: 'CBIT, Hyderabad' },
  { code: 'ADITYA_UNI', name: 'Aditya University' },
  { code: 'AEC', name: 'Aditya Engineering College' },
  { code: 'ACET', name: 'Aditya College Of Engineering And Technology' },
  { code: 'ACOE', name: 'Aditya College Of Engineering' },
  { code: 'OTHER', name: 'Other College / University' }
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Onboarding Stepper state
  const [step, setStep] = useState<'purpose' | 'motivation' | 'auth'>('purpose');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [college, setCollege] = useState('');
  const [customCollege, setCustomCollege] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace('/dashboard');
      return;
    }

    let modeParam = 'login';
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      modeParam = searchParams.get('mode') || 'login';
    }

    if (modeParam === 'register') {
      setAuthMode('register');
    } else if (modeParam === 'forgot') {
      setAuthMode('forgot');
    } else {
      setAuthMode('login');
    }

    const hasCompletedOnboarding = typeof window !== 'undefined' && localStorage.getItem('has_completed_onboarding') === 'true';
    if (hasCompletedOnboarding) {
      setStep('auth');
    } else {
      setStep('purpose');
    }

    setIsGuest(true);
    setLoading(false);
  }, [router]);

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      setAuthToken(data.token);
      setUserInfo(data.user);
      localStorage.setItem('has_completed_onboarding', 'true');
      showToast('Welcome back to StudyCircle!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please check credentials.';
      setFormError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser: 'student' | 'mentor' | 'admin') => {
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    let u = 'student.demo@studycircle.com';
    if (demoUser === 'mentor') {
      u = 'mentor.demo@studycircle.com';
    } else if (demoUser === 'admin') {
      u = 'admin.demo@studycircle.com';
    }
    const p = 'Demo@123';
    
    setUsername(u);
    setPassword(p);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p }),
      });

      setAuthToken(data.token);
      setUserInfo(data.user);
      localStorage.setItem('has_completed_onboarding', 'true');
      showToast(`Logged in as Demo ${demoUser.charAt(0).toUpperCase() + demoUser.slice(1)}!`, 'success');
      router.push('/dashboard');
    } catch (err: any) {
      const errMsg = err.message || 'Demo login failed. Please ensure backend is running.';
      setFormError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(false);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (!role) {
      setFormError('Please select an account role.');
      return;
    }

    if (!college) {
      setFormError('Please select your college/institute.');
      return;
    }

    setFormLoading(true);

    const selectedCollege = college === 'OTHER' ? (customCollege || 'Other') : college;
    const finalFullName = `${name.trim()} (${selectedCollege})`;

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: finalFullName,
          username: username.trim().toLowerCase(),
          password,
          role
        }),
      });

      setAuthToken(data.token);
      setUserInfo(data.user);
      localStorage.setItem('has_completed_onboarding', 'true');
      showToast('Registration successful! Welcome to StudyCircle.', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Username might be taken.';
      setFormError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          newPassword,
          recoveryPin: recoveryPin.trim()
        }),
      });

      const successMsg = 'Password reset successfully! You can now log in.';
      setFormSuccess(successMsg);
      showToast(successMsg, 'success');
      setNewPassword('');
      setRecoveryPin('');
      setAuthMode('login');
    } catch (err: any) {
      const errMsg = err.message || 'Password reset failed. Verify details.';
      setFormError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading StudyCircle...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-955 text-zinc-100 font-sans relative overflow-x-hidden pb-12">
      {/* Decorative background glow spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />

      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900/60 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('purpose')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-white bg-clip-text text-transparent">
            StudyCircle
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#colleges" className="hover:text-zinc-100 transition-colors">Colleges</a>
          <a href="#testimonials" className="hover:text-zinc-100 transition-colors">Stories</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setStep('auth');
              setAuthMode('login');
              setFormError('');
              setFormSuccess('');
              localStorage.setItem('has_completed_onboarding', 'true');
            }}
            className="text-sm font-semibold text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => {
              setStep('auth');
              setAuthMode('register');
              setFormError('');
              setFormSuccess('');
              localStorage.setItem('has_completed_onboarding', 'true');
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer border border-violet-500"
          >
            Launch Workspace
          </button>
        </div>
      </header>

      {/* Main Stepper Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Onboarding Wizard / Stepper */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-900/60 text-[10px] font-extrabold text-violet-300 uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5 fill-violet-300/10" /> 
            {step === 'purpose' && '1. Our Purpose & warnings'}
            {step === 'motivation' && '2. Habit Consistency & Worth'}
            {step === 'auth' && '3. Access Workspace Portal'}
          </div>

          {step === 'purpose' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white">
                Where B.Tech students build habits and{' '}
                <span className="bg-gradient-to-r from-violet-400 via-indigo-200 to-white bg-clip-text text-transparent">
                  clear exams.
                </span>
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                StudyCircle is a collaborative workspace designed to help engineering students manage syllabus documents, share clear study notes, and resolve doubts together with peers.
              </p>

              {/* INFO BOX */}
              <div className="p-5 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                  💡 Why Traditional Chat Groups Fall Short
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  While chat groups are great for quick updates, files and schedules often get buried in the noise. StudyCircle keeps your study materials, notes, and discussions organized in one clean place so you can stay consistent without distractions.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <div>
                  <button
                    onClick={() => setStep('motivation')}
                    className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-violet-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-violet-500"
                  >
                    Next: Consistency & Worth <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="pt-4 border-t border-zinc-800/40 space-y-2 max-w-md">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-violet-400" /> Reviewers: Quick Demo Access
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickDemoLogin('student')}
                      className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-black/30"
                    >
                      <User className="h-4 w-4 text-violet-400" />
                      <span>Try Student Demo</span>
                    </button>
                    <button
                      onClick={() => handleQuickDemoLogin('mentor')}
                      className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-black/30"
                    >
                      <GraduationCap className="h-4 w-4 text-indigo-400" />
                      <span>Try Mentor Demo</span>
                    </button>
                    <button
                      onClick={() => handleQuickDemoLogin('admin')}
                      className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-200 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-black/30"
                    >
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <span>Try Admin Demo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'motivation' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white">
                Streaks build habit. <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-200 to-white bg-clip-text text-transparent">
                  Habits beat cramming.
                </span>
              </h2>
              
              <div className="space-y-4">
                {/* MOTIVATION CARD 1 */}
                <div className="p-5 bg-violet-950/20 border border-violet-900/30 rounded-2xl flex items-start gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                    4x
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-violet-300 uppercase tracking-wide">4x Retention Rate</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Consistent peer group discussions and shared note-taking increase concept retention by 400% compared to solo studying.
                    </p>
                  </div>
                </div>

                {/* MOTIVATION CARD 2 */}
                <div className="p-5 bg-violet-950/20 border border-violet-900/30 rounded-2xl flex items-start gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                    🔥
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-violet-300 uppercase tracking-wide">Leaderboard Accountability</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Students maintaining a 5+ day streak show 3x higher placement exam clearance rates. Logging hours daily keeps your cohort accountable.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setStep('purpose')}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs rounded-2xl border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] transition-all"
                >
                  ⬅ Back
                </button>
                <button
                  onClick={() => {
                    setStep('auth');
                    setAuthMode('register');
                    localStorage.setItem('has_completed_onboarding', 'true');
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-violet-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-violet-500"
                >
                  Get Started Free <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl space-y-6 animate-fadeIn max-w-lg">
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <h3 className="text-lg font-bold text-zinc-200 uppercase tracking-wide">
                  {authMode === 'login' && 'Sign In to Workspace'}
                  {authMode === 'register' && 'Create StudyCircle Account'}
                  {authMode === 'forgot' && 'Reset Workspace Password'}
                </h3>
                <button
                  onClick={() => setStep('motivation')}
                  className="text-xs text-zinc-500 hover:text-zinc-350 font-bold uppercase transition-colors"
                >
                  ⬅ Back to Info
                </button>
              </div>

              {formError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-3 text-xs animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 flex items-start gap-3 text-xs animate-fadeIn">
                  <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500"><User className="h-4.5 w-4.5" /></span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. charan_rvrjc"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-2xl text-zinc-100 placeholder-zinc-650 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormError('');
                          setFormSuccess('');
                          setAuthMode('forgot');
                        }}
                        className="text-[10px] text-zinc-550 hover:text-violet-400 font-bold transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500"><Lock className="h-4.5 w-4.5" /></span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-955 border border-zinc-800 focus:border-violet-500 rounded-2xl text-zinc-100 placeholder-zinc-650 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs"
                  >
                    {formLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                  </button>

                  {/* Quick Demo Login */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2 mt-3 text-center">
                    <p className="text-[10px] font-bold text-zinc-550 tracking-wider uppercase">Quick Demo Login</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('student')}
                        className="py-2 px-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-[9px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 animate-pulse"
                      >
                        <User className="h-4 w-4 text-violet-400" />
                        <span>Try Student Demo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('mentor')}
                        className="py-2 px-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-[9px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 animate-pulse"
                      >
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                        <span>Try Mentor Demo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('admin')}
                        className="py-2 px-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-[9px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                      >
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span>Try Admin Demo</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-center text-xs text-zinc-400 pt-2">
                    New to StudyCircle?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setFormError('');
                      }}
                      className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Create account
                    </button>
                  </p>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><User className="h-4 w-4" /></span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Swathi"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-650 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Username</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><User className="h-4 w-4" /></span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. swathi_v"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-650 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><Lock className="h-4 w-4" /></span>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-955 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-650 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Account Role</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><GraduationCap className="h-4 w-4" /></span>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-655 focus:ring-1 focus:ring-violet-500/20 outline-none text-xs appearance-none"
                        >
                          <option value="" className="bg-zinc-900 text-zinc-100">Select Role</option>
                          <option value="student" className="bg-zinc-900 text-zinc-100">Student (Study Buddy)</option>
                          <option value="admin" className="bg-zinc-900 text-zinc-100">Mentor / Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">College / Institute</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><Award className="h-4 w-4" /></span>
                      <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-650 focus:ring-1 focus:ring-violet-500/20 outline-none text-xs appearance-none"
                      >
                        <option value="" className="bg-zinc-900 text-zinc-100">Select College</option>
                        {COLLEGES.map((col) => (
                          <option key={col.code} value={col.code} className="bg-zinc-900 text-zinc-100">{col.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {college === 'OTHER' && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Custom College Name</label>
                      <input
                        type="text"
                        required
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        placeholder="Enter college name"
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-100 placeholder-zinc-655 focus:ring-1 focus:ring-violet-500/20 outline-none text-xs"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs"
                  >
                    {formLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Register Account <ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <p className="text-center text-xs text-zinc-400 pt-2">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setFormError('');
                      }}
                      className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              )}

              {authMode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500"><User className="h-4.5 w-4.5" /></span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. charan_rvrjc"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-2xl text-zinc-100 placeholder-zinc-650 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">Recovery PIN</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500"><Key className="h-4.5 w-4.5" /></span>
                      <input
                        type="text"
                        required
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value)}
                        placeholder="Enter recovery PIN (default: 2026)"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-955 border border-zinc-800 focus:border-violet-500 rounded-2xl text-zinc-100 placeholder-zinc-650 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-xs"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-500 px-1 pt-1">Default sandboxed recovery PIN: **2026**</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500"><Lock className="h-4.5 w-4.5" /></span>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-955 border border-zinc-800 focus:border-violet-500 rounded-2xl text-zinc-100 placeholder-zinc-650 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs"
                  >
                    {formLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setFormError('');
                      }}
                      className="text-xs text-zinc-550 hover:text-zinc-300 font-bold transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Right column: Interactive mock glassmorphic cards */}
        <div className="lg:col-span-5 relative flex flex-col gap-6 items-center lg:items-end justify-center min-h-[420px] w-full">
          
          {step === 'purpose' && (
            <div className="w-full max-w-sm space-y-6 animate-slideIn">
              {/* Typical Chat Group preview */}
              <div className="w-full p-5 bg-zinc-955/70 border border-zinc-800/60 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-zinc-950/5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    💬 Typical Study Chat Group
                  </span>
                </div>
                
                {/* Chat Feed */}
                <div className="space-y-2.5">
                  <div className="p-3 bg-zinc-900/40 border border-zinc-850/50 rounded-2xl">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-550 mb-0.5">
                      <span>CSE Sem-4 Chat</span>
                      <span>14:02</span>
                    </div>
                    <p className="text-[11px] text-zinc-350">"Hey, where is the updated syllabus copy?"</p>
                  </div>
                  
                  <div className="p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-2xl">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-550 mb-0.5">
                      <span>Group Member</span>
                      <span>14:03</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">💬 *Random forwarded videos & stickers sent*</p>
                  </div>

                  <div className="p-3 bg-zinc-900/40 border border-zinc-850/50 rounded-2xl">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-550 mb-0.5">
                      <span>Group Member</span>
                      <span>14:05</span>
                    </div>
                    <p className="text-[11px] text-zinc-350">"Anyone finished the compiler assignment?"</p>
                  </div>
                </div>
                <div className="mt-3.5 text-center">
                  <span className="inline-block text-[9px] font-bold text-amber-400/90 bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-900/30">
                    ⚡ 50+ unread messages from other chats...
                  </span>
                </div>
              </div>

              {/* Focused StudyCircle contrast panel */}
              <div className="w-full p-5 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-indigo-500/20 rounded-3xl shadow-xl shadow-indigo-950/20 relative animate-float">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">StudyCircle Organized Workspace</h4>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ✓ Focused learning environment
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-300">
                    <span>📚 Syllabus-specific resources</span>
                    <span className="text-[10px] text-indigo-400">Neatly Organized</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-300">
                    <span>💬 Topic-focused discussions</span>
                    <span className="text-[10px] text-emerald-400">Spam-Free</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'motivation' && (
            <div className="w-full max-w-sm space-y-6 animate-slideIn">
              {/* Gamified Habit and Streak Tracker Visual */}
              <div className="p-5.5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden self-center animate-float">
                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-zinc-200 uppercase tracking-wider">Accountability Tracker</h4>
                      <p className="text-[9px] text-zinc-500">Streak boosts concept retention</p>
                    </div>
                  </div>
                  
                  {/* Streak bubble */}
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl text-amber-500 animate-pulse">
                    <Flame className="h-4 w-4 fill-amber-500/10" />
                    <span className="text-xs font-black">5d+</span>
                  </div>
                </div>

                {/* Animated Streak Circle Meter */}
                <div className="flex items-center justify-center py-4 relative">
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="8" fill="transparent" 
                        strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="text-center z-10">
                      <span className="block text-2xl font-black text-white">75%</span>
                      <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-extrabold">Complete</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-3">
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-900 text-center">
                    <span className="block text-xs font-black text-zinc-200">18.5 hrs</span>
                    <span className="text-[8px] text-zinc-550 uppercase font-bold tracking-wider">Time Logged</span>
                  </div>
                  <div className="p-3 bg-zinc-955 rounded-2xl border border-zinc-900 text-center">
                    <span className="block text-xs font-black text-emerald-400">Level 4</span>
                    <span className="text-[8px] text-zinc-550 uppercase font-bold tracking-wider">Study Circle Rank</span>
                  </div>
                </div>
              </div>

              {/* Mini Leaderboard preview */}
              <div className="p-4 bg-zinc-950/70 border border-zinc-850/80 rounded-2xl shadow-xl space-y-2.5 animate-float-delayed">
                <h5 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">🏆 Cohort Leaderboard (Top Prep)</h5>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900/60">
                    <span className="text-zinc-300">1. Swathi (VITAP)</span>
                    <span className="font-bold text-violet-400">32 hrs (7d streak)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900/60">
                    <span className="text-zinc-300">2. Teja (VRSEC)</span>
                    <span className="font-bold text-zinc-400">24 hrs (5d streak)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">3. Charan (RVRJC)</span>
                    <span className="font-bold text-zinc-555">18.5 hrs (6d streak)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="w-full max-w-sm space-y-6 animate-slideIn">
              {/* Active Study Room Widget */}
              <div className="w-full p-5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl hover:translate-y-[-4px] transition-all duration-300 relative z-20 self-center animate-float">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/60 text-indigo-300 uppercase tracking-wide">
                    Artificial Intelligence
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white animate-pulse">
                    ● ACTIVE
                  </span>
                </div>
                <h4 className="font-bold text-sm text-zinc-200">Sem-4 Syllabus Sprint Group</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Reviewing unit-3 normalization notes</p>
                
                <hr className="border-zinc-800/60 my-3.5" />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> Active in Room:
                    </span>
                    <span className="font-semibold text-zinc-300">3 Studious Buddies</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    {['Teja (VRSEC)', 'Bhagya (RVRJC)', 'Swathi (VITAP)'].map((name, i) => (
                      <div key={i} className="h-6 px-2.5 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collaborative Notes Preview Widget */}
              <div className="w-full p-4.5 bg-zinc-950/70 border border-zinc-850/60 rounded-2xl shadow-xl animate-float-delayed">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 mb-2.5">
                  <span>📝 Shared Notes Editor</span>
                  <span className="text-[9px] text-indigo-400">Real-time Sync</span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850/80 font-mono text-[9px] text-zinc-400 leading-relaxed">
                  <p><span className="text-indigo-400"># DBMS Unit-3 Notes</span></p>
                  <p><span className="text-zinc-550">// Edited by Swathi 1 min ago</span></p>
                  <p>1. 3NF: No transitive dependencies allowed.</p>
                  <p>2. BCNF: For every X → Y, X must be a super key <span className="inline-block w-1.5 h-3 bg-indigo-500 animate-pulse" /></p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* College Showcase Banner */}
      <section id="colleges" className="border-y border-zinc-900/80 bg-zinc-900/10 backdrop-blur-sm py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">
            Trusted by students from AP & Telangana college cohorts
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-zinc-500 text-sm font-extrabold uppercase tracking-widest">
            <span className="hover:text-zinc-300 transition-colors">VR Siddhartha (VRSEC)</span>
            <span className="hover:text-zinc-300 transition-colors">RVR & JC College</span>
            <span className="hover:text-zinc-300 transition-colors">VIT-AP University</span>
            <span className="hover:text-zinc-300 transition-colors">PVPSIT Vijayawada</span>
            <span className="hover:text-zinc-300 transition-colors">KL University (KLU)</span>
            <span className="hover:text-zinc-300 transition-colors">GITAM University</span>
            <span className="hover:text-zinc-300 transition-colors">JNTUK / JNTUA</span>
            <span className="hover:text-zinc-300 transition-colors">Andhra University</span>
            <span className="hover:text-zinc-300 transition-colors">Aditya University</span>
            <span className="hover:text-zinc-300 transition-colors">Aditya Engineering College (AEC)</span>
            <span className="hover:text-zinc-300 transition-colors">ACET / ACOE</span>
          </div>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h3 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Syllabus, Mocks, and Doubts — Managed.
          </h3>
          <p className="text-zinc-400 text-sm sm:text-base">
            StudyCircle is structured around the core habits of top-performing engineering cohorts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="p-6 bg-zinc-900/30 border border-zinc-900 hover:border-violet-500/40 rounded-3xl transition-all group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
              <Radio className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lg text-zinc-100 group-hover:text-violet-400 transition-colors">Live Presence Rooms</h4>
            <p className="text-sm text-zinc-500 leading-relaxed mt-2.5">
              Enter the room, join the Socket channel, and automatically broadcast your presence to active study buddies. Work together in sprints.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-zinc-900/30 border border-zinc-900 hover:border-violet-500/40 rounded-3xl transition-all group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lg text-zinc-100 group-hover:text-violet-400 transition-colors">Shared Study Notes</h4>
            <p className="text-sm text-zinc-555 leading-relaxed mt-2.5">
              Collaboratively draft and view Markdown notes. Aggregate syllabus guides, DSA cheat sheets, and lecture summaries in a single directory.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-zinc-900/30 border border-zinc-900 hover:border-violet-500/40 rounded-3xl transition-all group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lg text-zinc-100 group-hover:text-violet-400 transition-colors">Interactive Doubt Board</h4>
            <p className="text-sm text-zinc-555 leading-relaxed mt-2.5">
              Stuck on database normalization or compiler construction? Post doubt threads and receive structured replies from study peers.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-zinc-900/30 border border-zinc-900 hover:border-violet-500/40 rounded-3xl transition-all group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
              <Flame className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lg text-zinc-100 group-hover:text-violet-400 transition-colors">Streak Accountability</h4>
            <p className="text-sm text-zinc-555 leading-relaxed mt-2.5">
              Log daily minutes, tasks, and notes to accumulate study hours, increment streak counts, and climb the study circle leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h3 className="text-2xl font-extrabold text-white">Student Stories</h3>
          <p className="text-sm text-zinc-500">Real feedback from local college batches</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-400 uppercase">
                TS
              </div>
              <div>
                <h5 className="text-xs font-bold text-zinc-200">Teja S.</h5>
                <span className="text-[9px] font-semibold text-violet-400 uppercase">VRSEC CSE</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              "We used StudyCircle to coordinate DSA mocks. The daily streak feature was extremely addictive, keeping us study buddies coding every day before placements."
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-400 uppercase">
                BS
              </div>
              <div>
                <h5 className="text-xs font-bold text-zinc-200">Bhagya Student</h5>
                <span className="text-[9px] font-semibold text-violet-400 uppercase">RVRJC ECE</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              "No more scrolling through infinite WhatsApp messages just to find a syllabus PDF or scheduled link. Having notes, discussions, and meeting links in one workspace is amazing."
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-400 uppercase">
                KV
              </div>
              <div>
                <h5 className="text-xs font-bold text-zinc-200">Karthik V.</h5>
                <span className="text-[9px] font-semibold text-violet-400 uppercase">VIT-AP University</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              "The Socket presence indicator showing who is in the room right now gives us the library group study vibe, even while learning remotely from Vizag or Guntur."
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-12 py-8 text-center text-xs text-zinc-650">
        <p>© 2026 StudyCircle Platform. Built for Vijayawada, Guntur, Vizag, and Hyderabad Engineering Cohorts.</p>
      </footer>
    </div>
  );
}
