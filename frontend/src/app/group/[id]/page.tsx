'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getUserInfo } from '../../utils/api';
import { useToast } from '../../components/ToastProvider';
import { getSocket, disconnectSocket } from '../../utils/socket';
import { 
  BookOpen, 
  ArrowLeft, 
  Copy, 
  Check, 
  Users, 
  BookMarked, 
  MessageSquare, 
  Calendar, 
  LineChart, 
  Plus, 
  User, 
  ExternalLink,
  Save, 
  Trash2, 
  Send, 
  Clock, 
  Flame, 
  ShieldAlert,
  Radio,
  FileText
} from 'lucide-react';

interface Member {
  userId: string;
  role: 'admin' | 'student';
  User: {
    fullName: string;
    username: string;
    streakCount: number;
    totalStudyHours: number;
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: string;
  lastEditedBy: string;
  Creator: {
    fullName: string;
    username: string;
  };
  updatedAt: string;
}

interface Topic {
  id: string;
  title: string;
  createdBy: string;
  Creator: {
    fullName: string;
    username: string;
  };
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  User: {
    fullName: string;
    username: string;
  };
}

interface Session {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdBy: string;
  Creator: {
    fullName: string;
    username: string;
  };
}

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  username: string;
  role: string;
  totalStudyHours: number;
  totalStudyMinutes: number;
}

interface PresenceUser {
  id: string;
  username: string;
  fullName: string;
  socketId: string;
}

export default function GroupWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Unwrap params using React.use (needed for Next.js 15+)
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'discussions' | 'sessions' | 'progress' | 'members' | 'admin'>('notes');
  const [loading, setLoading] = useState(true);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  // Copied indicator
  const [copied, setCopied] = useState(false);

  // Socket state
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const socketRef = useRef<any>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  // Discussions state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [sessionLink, setSessionLink] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Progress Log state
  const [logMins, setLogMins] = useState('');
  const [logTasks, setLogTasks] = useState('');
  const [logNotesCount, setLogNotesCount] = useState('');
  const [loggingProgress, setLoggingProgress] = useState(false);
  const [logError, setLogError] = useState('');
  const [logSuccess, setLogSuccess] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    const cachedUser = getUserInfo();
    if (!cachedUser) {
      router.replace('/login');
      return;
    }
    setCurrentUser(cachedUser);
    
    // Initial fetch of workspace details
    fetchWorkspaceData();

    // Clean up socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        disconnectSocket();
      }
    };
  }, [groupId, router]);

  // Handle Socket connection for Real-Time Presence
  useEffect(() => {
    if (!currentUser || !groupId) return;

    // Initialize Socket
    const socket = getSocket();
    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      // Join room presence
      socket.emit('join-room', {
        groupId,
        user: {
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName
        }
      });
    });

    socket.on('room-presence-update', (users: PresenceUser[]) => {
      setPresenceUsers(users);
    });

    return () => {
      socket.off('room-presence-update');
      socket.emit('leave-room');
      socket.disconnect();
    };
  }, [currentUser, groupId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      // Fetch user groups to find current group metadata
      const groupsData = await apiRequest('/groups');
      const foundGroup = groupsData.groups?.find((g: any) => g.id === groupId);
      if (!foundGroup) {
        throw new Error('Group not found or you are not a member.');
      }
      setGroup(foundGroup);

      // Fetch group members
      const membersData = await apiRequest(`/groups/${groupId}/members`);
      setMembers(membersData.members || []);

      // Fetch notes
      const notesData = await apiRequest(`/notes/group/${groupId}`);
      setNotes(notesData.notes || []);
      if (notesData.notes?.length > 0) {
        handleSelectNote(notesData.notes[0]);
      }

      // Fetch topics
      const topicsData = await apiRequest(`/discussions/group/${groupId}`);
      setTopics(topicsData.topics || []);

      // Fetch sessions
      const sessionsData = await apiRequest(`/sessions/group/${groupId}`);
      setSessions(sessionsData.sessions || []);

      // Fetch leaderboard
      const leaderboardData = await apiRequest(`/progress/group/${groupId}/leaderboard`);
      setLeaderboard(leaderboardData.leaderboard || []);

      // Fetch group progress activity logs
      const logsData = await apiRequest(`/progress/group/${groupId}/logs`);
      setActivityLogs(logsData.logs || []);

    } catch (err: any) {
      console.error('Error fetching workspace data:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    showToast('Invite code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadNote = () => {
    if (!selectedNote) return;
    try {
      const text = `Title: ${noteTitle}\nGroup: ${group?.name || ''}\nLast Edited: ${new Date(selectedNote.updatedAt).toLocaleString()}\n\nContent:\n----------------------------------------\n${noteContent}`;
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${noteTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Note downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download note.', 'error');
    }
  };

  // ----------------------------------------------------
  // NOTES LOGIC
  // ----------------------------------------------------
  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleCreateNote = async () => {
    setCreatingNote(true);
    try {
      const data = await apiRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          title: 'Untitled Note',
          content: ''
        })
      });
      // Refresh notes list
      const notesData = await apiRequest(`/notes/group/${groupId}`);
      setNotes(notesData.notes || []);
      // Select new note
      const newNote = notesData.notes.find((n: Note) => n.id === data.note.id);
      if (newNote) {
        handleSelectNote(newNote);
      }
      showToast('New note created!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create note.', 'error');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSavingNote(true);
    try {
      await apiRequest(`/notes/${selectedNote.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent
        })
      });
      // Refresh notes
      const notesData = await apiRequest(`/notes/group/${groupId}`);
      setNotes(notesData.notes || []);
      
      // Keep note selected but updated
      const updated = notesData.notes.find((n: Note) => n.id === selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
      }
      showToast('Note saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save note.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiRequest(`/notes/${id}`, { method: 'DELETE' });
      // Refresh
      const notesData = await apiRequest(`/notes/group/${groupId}`);
      setNotes(notesData.notes || []);
      if (selectedNote?.id === id) {
        if (notesData.notes?.length > 0) {
          handleSelectNote(notesData.notes[0]);
        } else {
          setSelectedNote(null);
          setNoteTitle('');
          setNoteContent('');
        }
      }
      showToast('Note deleted successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete note.', 'error');
    }
  };

  // ----------------------------------------------------
  // DISCUSSIONS LOGIC
  // ----------------------------------------------------
  const handleSelectTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    setNewMessageContent('');
    try {
      const data = await apiRequest(`/discussions/topics/${topic.id}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    setCreatingTopic(true);
    try {
      await apiRequest('/discussions/topics', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          title: newTopicTitle.trim()
        })
      });
      setNewTopicTitle('');
      showToast('Discussion topic created!', 'success');
      // Refresh topics
      const topicsData = await apiRequest(`/discussions/group/${groupId}`);
      setTopics(topicsData.topics || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to create topic.', 'error');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !newMessageContent.trim()) return;
    setSendingMessage(true);
    try {
      await apiRequest(`/discussions/topics/${selectedTopic.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessageContent.trim() })
      });
      setNewMessageContent('');
      showToast('Message sent!', 'success');
      // Refresh messages
      const data = await apiRequest(`/discussions/topics/${selectedTopic.id}/messages`);
      setMessages(data.messages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to post message.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // ----------------------------------------------------
  // SESSIONS LOGIC
  // ----------------------------------------------------
  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;
    setScheduling(true);
    try {
      await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          title: sessionTitle.trim(),
          description: sessionDesc.trim(),
          scheduledAt: new Date(sessionDate).toISOString(),
          durationMinutes: parseInt(sessionDuration) || 60,
          meetingLink: sessionLink.trim()
        })
      });
      setSessionTitle('');
      setSessionDesc('');
      setSessionDate('');
      setSessionLink('');
      showToast('Study session scheduled!', 'success');
      
      // Refresh sessions
      const sessionsData = await apiRequest(`/sessions/group/${groupId}`);
      setSessions(sessionsData.sessions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule session.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      await apiRequest(`/sessions/${sessionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Session status updated to ${newStatus}.`, 'success');
      // Refresh
      const sessionsData = await apiRequest(`/sessions/group/${groupId}`);
      setSessions(sessionsData.sessions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to update session status', 'error');
    }
  };

  // ----------------------------------------------------
  // PROGRESS / LEADERBOARD LOGIC
  // ----------------------------------------------------
  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogError('');
    setLogSuccess('');
    
    const minutes = parseInt(logMins) || 0;
    const tasks = parseInt(logTasks) || 0;
    const notes = parseInt(logNotesCount) || 0;

    if (minutes <= 0 && tasks <= 0 && notes <= 0) {
      const errVal = 'Please enter a value greater than 0 for at least one metric.';
      setLogError(errVal);
      showToast(errVal, 'warning');
      return;
    }

    setLoggingProgress(true);
    try {
      await apiRequest('/progress/log', {
        method: 'POST',
        body: JSON.stringify({
          studyMinutes: minutes,
          tasksCompleted: tasks,
          notesCreated: notes,
          groupId
        })
      });
      
      setLogMins('');
      setLogTasks('');
      setLogNotesCount('');
      const succVal = 'Progress logged! Check out the updated leaderboard.';
      setLogSuccess(succVal);
      showToast(succVal, 'success');
      
      // Refresh leaderboard
      const leaderboardData = await apiRequest(`/progress/group/${groupId}/leaderboard`);
      setLeaderboard(leaderboardData.leaderboard || []);

      // Refresh logs
      const logsData = await apiRequest(`/progress/group/${groupId}/logs`);
      setActivityLogs(logsData.logs || []);
      
    } catch (err: any) {
      const errVal = err.message || 'Failed to log progress.';
      setLogError(errVal);
      showToast(errVal, 'error');
    } finally {
      setLoggingProgress(false);
    }
  };

  // Helper to split name and college tag
  const formatNameAndCollege = (fullName: string) => {
    if (!fullName) return { name: '', college: '' };
    const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { name: match[1], college: match[2] };
    }
    return { name: fullName, college: '' };
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Connecting to Study Circle Room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      
      {/* Glow decorative items */}
      <div className="absolute top-[-30%] left-[20%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none" />

      {/* Header bar */}
      <header className="w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-100">{group?.name}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/60 text-indigo-300">
                {group?.subject || 'General'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-1 max-w-xl hidden sm:block">{group?.description}</p>
          </div>
        </div>

        {/* Copy Invite Code button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden md:inline font-medium uppercase tracking-wider">Invite Code:</span>
          <button
            onClick={handleCopyInviteCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-violet-500/60 text-xs font-semibold rounded-xl text-zinc-300 transition-all cursor-pointer active:scale-95"
          >
            <span className="font-mono">{group?.inviteCode}</span>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      {/* Main workspace layout: Left sidebar for presence + active tabs, center main view */}
      <div className="flex flex-1 min-h-0 relative z-10">
        
        {/* Workspace Sidebar: Presence List + Tab Selectors */}
        <aside className="w-64 border-r border-zinc-900 bg-zinc-900/10 backdrop-blur-md flex flex-col shrink-0">
          {/* Navigation/Tabs */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <BookMarked className="h-4.5 w-4.5" /> Shared Notes
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'discussions'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Discussions
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" /> Study Sessions
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <LineChart className="h-4.5 w-4.5" /> Progress Logs
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <Users className="h-4.5 w-4.5" /> Circle Members
            </button>
            {(currentUser?.role === 'admin' || group?.GroupMember?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className="h-4.5 w-4.5 text-violet-400" /> Admin Panel
              </button>
            )}
          </nav>

          <hr className="border-zinc-900 mx-4" />

          {/* Real-time Presence list */}
          <div className="flex-1 min-h-0 flex flex-col p-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 px-2">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Live Study Room ({presenceUsers.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto mt-3 space-y-2 px-1">
              {presenceUsers.length === 0 ? (
                <p className="text-[11px] text-zinc-600 px-2 italic">Nobody in the room</p>
              ) : (
                presenceUsers.map((u) => {
                  const { name: pName, college: pCollege } = formatNameAndCollege(u.fullName);
                  return (
                    <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/30 border border-zinc-900/40">
                      <div className="relative shrink-0">
                        <div className="h-7 w-7 rounded-lg bg-violet-600/25 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300 uppercase">
                          {pName.substring(0, 2)}
                        </div>
                        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-zinc-950" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 truncate leading-none">{pName}</p>
                        {pCollege && (
                          <span className="text-[9px] text-violet-400 font-semibold uppercase">{pCollege}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Workspace Center Content panel */}
        <main className="flex-1 min-h-0 bg-zinc-950 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <span className="h-6 w-6 border-2 border-t-transparent border-zinc-600 rounded-full animate-spin mr-3" />
              Syncing workspace data...
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-6 relative">
              
              {/* TAB 1: SHARED NOTES */}
              {activeTab === 'notes' && (
                <div className="h-full flex flex-col md:flex-row gap-6 min-h-0">
                  {/* Notes List */}
                  <div className="w-full md:w-80 shrink-0 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-violet-400" /> Circle Notes
                      </h3>
                      <button
                        onClick={handleCreateNote}
                        disabled={creatingNote}
                        className="p-1.5 bg-zinc-800 hover:bg-violet-600 hover:text-white rounded-lg border border-zinc-700 hover:border-violet-500 active:scale-95 transition-all cursor-pointer"
                        title="New Note"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Search box for notes */}
                    <div className="relative shrink-0">
                      <input
                        type="text"
                        placeholder="Search notes..."
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-violet-500 rounded-xl text-xs text-zinc-200 placeholder-zinc-650 outline-none transition-all focus:ring-1 focus:ring-violet-500/20"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {notes.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center py-8 italic">No shared notes. Click '+' to start.</p>
                      ) : (
                        (() => {
                          const filtered = notes.filter(n => 
                            n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
                            n.content.toLowerCase().includes(noteSearchQuery.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return <p className="text-xs text-zinc-600 text-center py-8 italic">No notes match "{noteSearchQuery}"</p>;
                          }
                          return filtered.map((note) => (
                            <button
                              key={note.id}
                              onClick={() => handleSelectNote(note)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                                selectedNote?.id === note.id
                                  ? 'bg-violet-950/20 border-violet-500/50'
                                  : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                              }`}
                            >
                              <span className="font-bold text-sm text-zinc-200 truncate">{note.title}</span>
                              <span className="text-[10px] text-zinc-500">
                                By {formatNameAndCollege(note.Creator?.fullName).name}
                              </span>
                            </button>
                          ));
                        })()
                      )}
                    </div>
                  </div>

                  {/* Notes Editor */}
                  <div className="flex-1 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 min-h-0 space-y-4">
                    {selectedNote ? (
                      <>
                        <div className="flex items-center justify-between shrink-0">
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Note Title"
                            className="bg-transparent border-b border-transparent focus:border-zinc-800 text-xl font-bold text-zinc-100 placeholder-zinc-700 py-1 outline-none w-full mr-4 transition-all"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveNote}
                              disabled={savingNote || !noteTitle.trim()}
                              className="p-2 bg-zinc-850 hover:bg-emerald-600 hover:text-white border border-zinc-800 hover:border-emerald-500 rounded-xl active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-300"
                              title="Save Changes"
                            >
                              <Save className="h-4 w-4" />
                              <span>{savingNote ? 'Saving...' : 'Save'}</span>
                            </button>

                            <button
                              onClick={handleDownloadNote}
                              className="p-2 bg-zinc-850 hover:bg-violet-900/30 hover:text-violet-300 border border-zinc-800 hover:border-violet-800/40 rounded-xl active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-300"
                              title="Download Note (.txt)"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Download</span>
                            </button>

                            {(currentUser?.role === 'admin' || selectedNote.createdBy === currentUser?.id) && (
                              <button
                                onClick={() => handleDeleteNote(selectedNote.id)}
                                className="p-2 bg-zinc-850 hover:bg-red-950/30 hover:text-red-400 border border-zinc-800 hover:border-red-900/40 rounded-xl active:scale-95 transition-all text-xs font-semibold cursor-pointer text-zinc-550"
                                title="Delete Note"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-zinc-500 shrink-0">
                          Last edited by {formatNameAndCollege(selectedNote.Creator?.fullName).name} on {new Date(selectedNote.updatedAt).toLocaleDateString()}
                        </div>

                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Start typing notes here... Supports collaborative edits."
                          className="flex-1 bg-zinc-950/40 border border-zinc-900 focus:border-violet-500/50 rounded-2xl p-4 text-zinc-200 placeholder-zinc-800 text-sm outline-none resize-none transition-all leading-relaxed"
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-2">
                        <BookMarked className="h-10 w-10 text-zinc-700" />
                        <span className="text-sm font-semibold">No note selected or created.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DISCUSSIONS */}
              {activeTab === 'discussions' && (
                <div className="h-full flex flex-col md:flex-row gap-6 min-h-0">
                  {/* Topics List */}
                  <div className="w-full md:w-80 shrink-0 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-4 space-y-4">
                    <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-violet-400" /> Doubt Forum
                    </h3>
                    
                    <form onSubmit={handleCreateTopic} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="Ask a doubt/topic..."
                        className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={creatingTopic || !newTopicTitle.trim()}
                        className="p-2 bg-zinc-850 hover:bg-violet-600 hover:text-white rounded-xl border border-zinc-700 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {topics.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center py-8 italic">No discussions yet. Post a topic above.</p>
                      ) : (
                        topics.map((topic) => (
                          <button
                            key={topic.id}
                            onClick={() => handleSelectTopic(topic)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                              selectedTopic?.id === topic.id
                                ? 'bg-violet-950/20 border-violet-500/50'
                                : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                            }`}
                          >
                            <span className="font-bold text-sm text-zinc-200 leading-snug">{topic.title}</span>
                            <span className="text-[10px] text-zinc-500">
                              By {formatNameAndCollege(topic.Creator?.fullName).name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messages / Thread details */}
                  <div className="flex-1 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 min-h-0 space-y-4">
                    {selectedTopic ? (
                      <>
                        <div className="shrink-0 border-b border-zinc-900/60 pb-3">
                          <h4 className="font-bold text-lg text-zinc-100">{selectedTopic.title}</h4>
                          <span className="text-[10px] text-zinc-500">
                            Started by {formatNameAndCollege(selectedTopic.Creator?.fullName).name} on {new Date(selectedTopic.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Thread messages list */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                          {messages.length === 0 ? (
                            <p className="text-xs text-zinc-600 py-8 italic text-center">No replies yet. Be the first to answer!</p>
                          ) : (
                            messages.map((msg) => {
                              const isMe = msg.User?.username === currentUser?.username;
                              const { name: rName, college: rCollege } = formatNameAndCollege(msg.User?.fullName);
                              return (
                                <div 
                                  key={msg.id} 
                                  className={`flex flex-col max-w-[80%] rounded-2xl p-4 gap-1.5 ${
                                    isMe 
                                      ? 'bg-violet-950/15 border border-violet-900/30 self-end ml-auto' 
                                      : 'bg-zinc-900/50 border border-zinc-850 self-start'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-300">{rName}</span>
                                    {rCollege && (
                                      <span className="text-[9px] text-violet-400 font-semibold uppercase">{rCollege}</span>
                                    )}
                                    <span className="text-[9px] text-zinc-600">
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-200 leading-relaxed break-words">{msg.content}</p>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleSendMessage} className="flex gap-3 shrink-0 pt-2 border-t border-zinc-900/60">
                          <input
                            type="text"
                            required
                            value={newMessageContent}
                            onChange={(e) => setNewMessageContent(e.target.value)}
                            placeholder="Type your reply here..."
                            className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-violet-500/60 rounded-2xl text-zinc-200 placeholder-zinc-800 text-sm outline-none transition-all"
                          />
                          <button
                            type="submit"
                            disabled={sendingMessage || !newMessageContent.trim()}
                            className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            <Send className="h-4.5 w-4.5" />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-2">
                        <MessageSquare className="h-10 w-10 text-zinc-700" />
                        <span className="text-sm font-semibold">Select a discussion topic or doubt from the list.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: STUDY SESSIONS */}
              {activeTab === 'sessions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Sessions feed */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-violet-400" /> Upcoming Study Sessions
                    </h3>

                    {sessions.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-900/20 border border-zinc-900 rounded-3xl italic text-zinc-500 text-sm">
                        No scheduled sessions. Use the scheduler panel to book one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessions.map((sess) => {
                          const dateObj = new Date(sess.scheduledAt);
                          const isHost = sess.createdBy === currentUser?.id || group?.GroupMember?.role === 'admin';
                          return (
                            <div 
                              key={sess.id} 
                              className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                                sess.status === 'live'
                                  ? 'bg-red-950/10 border-red-900/50'
                                  : 'bg-zinc-900/35 border-zinc-900'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-base text-zinc-100">{sess.title}</h4>
                                  {sess.status === 'live' && (
                                    <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                                      ● LIVE
                                    </span>
                                  )}
                                  {sess.status === 'completed' && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed">{sess.description || 'No description.'}</p>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Clock className="h-3.5 w-3.5 text-zinc-500" /> {dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                  <span className="text-zinc-600">|</span>
                                  <span className="text-[11px]">{sess.durationMinutes} mins</span>
                                  <span className="text-zinc-600">|</span>
                                  <span className="text-[11px]">Host: {formatNameAndCollege(sess.Creator?.fullName).name}</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
                                {sess.meetingLink && sess.status !== 'completed' && (
                                  <a
                                    href={sess.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl active:scale-95 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-violet-500"
                                  >
                                    Join Room <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}

                                {isHost && (
                                  <div className="flex gap-2 justify-end">
                                    {sess.status === 'upcoming' && (
                                      <button
                                        onClick={() => handleUpdateSessionStatus(sess.id, 'live')}
                                        className="px-3 py-2 bg-red-950/30 border border-red-900/50 hover:bg-red-900 hover:text-white text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                      >
                                        Go Live
                                      </button>
                                    )}
                                    {sess.status === 'live' && (
                                      <button
                                        onClick={() => handleUpdateSessionStatus(sess.id, 'completed')}
                                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                      >
                                        End Session
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Schedule Session Panel */}
                  <div className="border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm uppercase tracking-wide">Schedule Session</h4>
                      <p className="text-xs text-zinc-500 mt-1">Organize study groups or mock exams for group members</p>
                    </div>

                    <form onSubmit={handleScheduleSession} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Session Title</label>
                        <input
                          type="text"
                          required
                          value={sessionTitle}
                          onChange={(e) => setSessionTitle(e.target.value)}
                          placeholder="e.g. Unit 3 DBMS Practice"
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                        <textarea
                          rows={2}
                          value={sessionDesc}
                          onChange={(e) => setSessionDesc(e.target.value)}
                          placeholder="Focus areas, instructions..."
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none resize-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scheduled Date/Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 text-xs outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration (Mins)</label>
                          <select
                            value={sessionDuration}
                            onChange={(e) => setSessionDuration(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 text-xs outline-none transition-all appearance-none"
                          >
                            <option value="30">30 Mins</option>
                            <option value="60">60 Mins</option>
                            <option value="90">90 Mins</option>
                            <option value="120">120 Mins</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Link</label>
                        <input
                          type="url"
                          value={sessionLink}
                          onChange={(e) => setSessionLink(e.target.value)}
                          placeholder="e.g. https://meet.google.com/abc"
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={scheduling || !sessionTitle.trim() || !sessionDate}
                        className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-violet-600 hover:text-white border border-zinc-700 hover:border-violet-500 active:scale-95 text-zinc-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {scheduling ? 'Scheduling...' : 'Schedule Session'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: PROGRESS LOGS & LEADERBOARD */}
              {activeTab === 'progress' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Leaderboard View */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                      <LineChart className="h-4.5 w-4.5 text-violet-400" /> Circle Leaderboard
                    </h3>

                    <div className="border border-zinc-900 bg-zinc-900/10 rounded-3xl overflow-hidden shadow-xl">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-3 px-4 text-center w-12">Rank</th>
                            <th className="py-3 px-4">Member Name</th>
                            <th className="py-3 px-4 text-center">Circle Role</th>
                            <th className="py-3 px-4 text-center">Study Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {leaderboard.map((u, i) => {
                            const { name: lName, college: lCollege } = formatNameAndCollege(u.fullName);
                            const isMe = u.username === currentUser?.username;
                            return (
                              <tr 
                                key={u.userId} 
                                className={`text-sm hover:bg-zinc-900/25 transition-colors ${
                                  isMe ? 'bg-violet-950/10' : ''
                                }`}
                              >
                                <td className="py-3 px-4 text-center font-extrabold text-zinc-400">
                                  {i === 0 ? '🏆' : i + 1}
                                </td>
                                <td className="py-3 px-4 font-bold text-zinc-200 flex items-center gap-2.5">
                                  <div className="h-6 w-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] uppercase font-extrabold">
                                    {lName.substring(0, 2)}
                                  </div>
                                  <div>
                                    <span className={isMe ? 'text-violet-300' : 'text-zinc-200'}>{lName}</span>
                                    {lCollege && (
                                      <span className="block text-[9px] text-zinc-600 font-semibold uppercase">{lCollege}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center text-xs text-zinc-500 capitalize">{u.role}</td>
                                <td className="py-3 px-4 text-center font-extrabold text-zinc-200">{u.totalStudyHours} hrs</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Accountability Activity Feed */}
                    <div className="space-y-4 pt-4">
                      <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-violet-400" /> Circle Activity Feed (Accountability Log)
                      </h3>
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-3xl p-5 space-y-3 max-h-96 overflow-y-auto">
                        {activityLogs.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic text-center py-6">No study logs registered in this circle yet.</p>
                        ) : (
                          activityLogs.map((log: any) => {
                            const { name: logName, college: logCollege } = formatNameAndCollege(log.User?.fullName);
                            return (
                              <div key={log.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center justify-between text-xs gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-zinc-200">{logName}</span>
                                    {logCollege && (
                                      <span className="px-2 py-0.5 rounded bg-violet-950/40 border border-violet-900/50 text-[9px] font-semibold text-violet-300 uppercase tracking-wide">
                                        {logCollege}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-zinc-400 leading-relaxed">
                                    Logged <span className="font-extrabold text-violet-300">{log.studyMinutes} mins</span>
                                    {log.tasksCompleted > 0 && <span>, finished <span className="font-bold text-zinc-300">{log.tasksCompleted} tasks</span></span>}
                                    {log.notesCreated > 0 && <span>, created <span className="font-bold text-zinc-300">{log.notesCreated} notes</span></span>}
                                  </p>
                                </div>
                                <span className="text-[10px] text-zinc-500 shrink-0">
                                  {new Date(log.loggedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Log Progress panel */}
                  <div className="border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm uppercase tracking-wide">Log Study Session</h4>
                      <p className="text-xs text-zinc-500 mt-1">Accumulate study minutes and build up your streak</p>
                    </div>

                    {logError && <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded-xl border border-red-900/30">{logError}</p>}
                    {logSuccess && <p className="text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded-xl border border-emerald-900/30">{logSuccess}</p>}

                    <form onSubmit={handleLogProgress} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" /> Study Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={logMins}
                          onChange={(e) => setLogMins(e.target.value)}
                          placeholder="e.g. 60"
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Plus className="h-3.5 w-3.5 text-zinc-500" /> Tasks Completed
                        </label>
                        <input
                          type="number"
                          value={logTasks}
                          onChange={(e) => setLogTasks(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-zinc-500" /> Notes Drafted
                        </label>
                        <input
                          type="number"
                          value={logNotesCount}
                          onChange={(e) => setLogNotesCount(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-violet-500 rounded-xl text-zinc-200 placeholder-zinc-800 text-xs outline-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loggingProgress}
                        className="w-full py-2.5 px-3 bg-zinc-850 hover:bg-violet-600 hover:text-white border border-zinc-700 hover:border-violet-500 active:scale-95 text-zinc-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {loggingProgress ? 'Submitting...' : 'Log Progress'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: MEMBERS TAB */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-violet-400" /> Study Group Members ({members.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((memberObj) => {
                      const { name: mName, college: mCollege } = formatNameAndCollege(memberObj.User?.fullName);
                      return (
                        <div 
                          key={memberObj.userId} 
                          className="p-5 bg-zinc-900/35 border border-zinc-900 hover:border-zinc-850 rounded-3xl flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600/15 to-indigo-600/15 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300 uppercase shrink-0">
                              {mName.substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-zinc-200 truncate leading-snug">{mName}</h4>
                              <p className="text-[10px] text-zinc-500">@{memberObj.User?.username}</p>
                              {mCollege && (
                                <span className="inline-block text-[9px] text-violet-400 font-bold uppercase mt-1">{mCollege}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-500">
                              {memberObj.role}
                            </span>
                            
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Flame className="h-3 w-3 fill-amber-500/20" /> {memberObj.User?.streakCount || 0}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span>
                                {memberObj.User ? parseFloat(memberObj.User.totalStudyHours.toFixed(1)) : 0} hrs
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: ADMIN ACCOUNTABILITY PANEL */}
              {activeTab === 'admin' && (
                <div className="space-y-8">
                  <div className="p-6 bg-violet-950/15 border border-violet-900/30 rounded-3xl flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-violet-300 flex items-center gap-2">
                        <ShieldAlert className="h-5.5 w-5.5" /> Circle Admin & Accountability Console
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Monitor member participation logs, track streaks, and review academic progress details.
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-violet-600 text-white px-3 py-1 rounded-full tracking-wider">
                      Mentor Access Only
                    </span>
                  </div>

                  {/* Summary Metric Widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-zinc-900/35 border border-zinc-900 rounded-3xl text-center space-y-1">
                      <Users className="h-5 w-5 text-indigo-400 mx-auto" />
                      <span className="block text-2xl font-extrabold text-zinc-100">
                        {members.filter(m => m.role === 'student').length}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Students</span>
                    </div>

                    <div className="p-5 bg-zinc-900/35 border border-zinc-900 rounded-3xl text-center space-y-1">
                      <Clock className="h-5 w-5 text-violet-400 mx-auto" />
                      <span className="block text-2xl font-extrabold text-zinc-100">
                        {parseFloat(members.reduce((sum, m) => sum + (m.User?.totalStudyHours || 0), 0).toFixed(1))} hrs
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Group Hours</span>
                    </div>

                    <div className="p-5 bg-zinc-900/35 border border-zinc-900 rounded-3xl text-center space-y-1">
                      <Flame className="h-5 w-5 text-amber-500 mx-auto" />
                      <span className="block text-2xl font-extrabold text-zinc-100">
                        {Math.max(...members.map(m => m.User?.streakCount || 0), 0)} Days
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Highest Streak</span>
                    </div>
                  </div>

                  {/* Detailed Student Participation Grid */}
                  <div className="border border-zinc-900 bg-zinc-900/10 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-zinc-900 bg-zinc-900/20">
                      <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider">Student Activity Ledger</h4>
                    </div>
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4 text-center">Streak</th>
                          <th className="py-3 px-4 text-center">Study Hours</th>
                          <th className="py-3 px-4 text-center">Participation Rating</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {members.map((memberObj) => {
                          const { name: mName, college: mCollege } = formatNameAndCollege(memberObj.User?.fullName);
                          const totalHrs = memberObj.User?.totalStudyHours || 0;
                          let rating = 'No logs yet';
                          let ratingColor = 'text-zinc-500 bg-zinc-950 border-zinc-900';
                          if (totalHrs >= 15) {
                            rating = 'Highly Active';
                            ratingColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
                          } else if (totalHrs > 0) {
                            rating = 'Active';
                            ratingColor = 'text-indigo-400 bg-indigo-950/20 border-indigo-900/30';
                          }
                          return (
                            <tr key={memberObj.userId} className="text-sm hover:bg-zinc-900/10 transition-colors">
                              <td className="py-3 px-4 font-bold text-zinc-200 flex items-center gap-2.5">
                                <div className="h-6 w-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] uppercase font-extrabold text-violet-400">
                                  {mName.substring(0, 2)}
                                </div>
                                <div>
                                  <span>{mName}</span>
                                  {mCollege && (
                                    <span className="block text-[9px] text-zinc-600 font-semibold uppercase">{mCollege}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-amber-500">
                                🔥 {memberObj.User?.streakCount || 0} Days
                              </td>
                              <td className="py-3 px-4 text-center font-extrabold text-zinc-300">
                                {totalHrs.toFixed(1)} hrs
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${ratingColor}`}>
                                  {rating}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => {
                                    showToast(`Sent accountability nudge notification to ${mName}!`, 'info');
                                  }}
                                  className="px-2.5 py-1 bg-zinc-900 hover:bg-violet-900/20 text-zinc-400 hover:text-violet-300 text-[10px] font-bold rounded-lg border border-zinc-800 hover:border-violet-800 transition-all cursor-pointer"
                                >
                                  Nudge Buddy
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
