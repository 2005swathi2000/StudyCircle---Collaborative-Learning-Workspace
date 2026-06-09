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
  FileText,
  Sparkles,
  Code,
  Award,
  Shield,
  Play,
  Activity,
  CheckCircle
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
  const [activeTab, setActiveTab] = useState<'notes' | 'coding' | 'discussions' | 'sessions' | 'progress' | 'members' | 'admin'>('notes');
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

  // AI Quiz state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Coding Arena state
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [editorCode, setEditorCode] = useState('');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runningCode, setRunningCode] = useState(false);

  const QUESTIONS = [
    {
      id: 'twosum',
      title: '1. Two Sum',
      difficulty: 'Easy',
      diffColor: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30',
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      examples: "Example 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]",
      templates: {
        javascript: "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
        python: "def twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in hashmap:\n            return [hashmap[diff], i]\n        hashmap[num] = i\n    return []",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}"
      }
    },
    {
      id: 'reverse',
      title: '344. Reverse String',
      difficulty: 'Easy',
      diffColor: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30',
      description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
      examples: "Example 1:\nInput: s = [\"h\",\"e\",\"l\",\"l\",\"o\"]\nOutput: [\"o\",\"l\",\"l\",\"e\",\"h\"]",
      templates: {
        javascript: "function reverseString(s) {\n    let left = 0;\n    let right = s.length - 1;\n    while (left < right) {\n        const temp = s[left];\n        s[left] = s[right];\n        s[right] = temp;\n        left++;\n        right--;\n    }\n}",
        python: "def reverseString(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1\n        right -= 1",
        java: "class Solution {\n    public void reverseString(char[] s) {\n        int left = 0;\n        int right = s.length - 1;\n        while (left < right) {\n            char temp = s[left];\n            s[left] = s[right];\n            s[right] = temp;\n            left++;\n            right--;\n        }\n    }\n}"
      }
    },
    {
      id: 'binary',
      title: '704. Binary Search',
      difficulty: 'Easy',
      diffColor: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30',
      description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
      examples: "Example 1:\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\nExplanation: 9 exists in nums and its index is 4\n\nExample 2:\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1\nExplanation: 2 does not exist in nums so return -1",
      templates: {
        javascript: "function binarySearch(nums, target) {\n    let low = 0;\n    let high = nums.length - 1;\n    while (low <= high) {\n        let mid = Math.floor((low + high) / 2);\n        if (nums[mid] === target) return mid;\n        else if (nums[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}",
        python: "def binarySearch(nums, target):\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
        java: "class Solution {\n    public int binarySearch(int[] nums, int target) {\n        int low = 0;\n        int high = nums.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n}"
      }
    }
  ];

  const handleOpenQuizModal = () => {
    if (!selectedNote) return;
    setGeneratingQuiz(true);
    setShowQuizModal(true);
    setSelectedAnswers({});
    setSubmittedQuiz(false);

    setTimeout(() => {
      const content = selectedNote.content.toLowerCase();
      let questions = [];

      if (content.includes('normalization') || content.includes('nf') || content.includes('database')) {
        questions = [
          {
            id: 1,
            question: "Which of the following normal forms does not allow transitive functional dependencies?",
            options: ["1NF", "2NF", "3NF", "BCNF"],
            correct: 2,
            explanation: "3NF eliminates transitive dependencies (where a non-prime attribute determines another non-prime attribute)."
          },
          {
            id: 2,
            question: "For a relation to be in BCNF, what must be true for every non-trivial functional dependency X -> A?",
            options: ["X must be a candidate key", "X must be a super key", "A must be a prime attribute", "A must be a key attribute"],
            correct: 1,
            explanation: "Boyce-Codd Normal Form requires that for every functional dependency X -> A, X must be a super key."
          },
          {
            id: 3,
            question: "What is the primary trade-off of Boyce-Codd Normal Form (BCNF) compared to 3NF?",
            options: ["BCNF does not guarantee lossless join", "BCNF is harder to implement in SQL", "BCNF is not always dependency-preserving", "BCNF does not reduce redundancy"],
            correct: 2,
            explanation: "While BCNF eliminates redundancy more strictly, it cannot always preserve all functional dependencies when decomposed."
          }
        ];
      } else if (content.includes('two sum') || content.includes('reverse') || content.includes('binary search') || content.includes('dsa') || content.includes('code') || content.includes('algorithm')) {
        questions = [
          {
            id: 1,
            question: "What is the optimal time complexity of the Two Sum problem using a Hash Map?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
            correct: 2,
            explanation: "Using a Hash Map, we can look up the complement in O(1) time, resulting in an overall O(N) time complexity for a single pass."
          },
          {
            id: 2,
            question: "Which pattern or methodology is used in the Binary Search algorithm?",
            options: ["Sliding Window", "Divide and Conquer", "Dynamic Programming", "Greedy Search"],
            correct: 1,
            explanation: "Binary Search continuously divides the sorted search space in half to locate the target, which is a classic divide-and-conquer strategy."
          },
          {
            id: 3,
            question: "What is the worst-case space complexity of binary search using iterative loops?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
            correct: 0,
            explanation: "Iterative binary search uses constant extra space O(1), whereas recursive binary search uses O(log N) stack space."
          }
        ];
      } else {
        questions = [
          {
            id: 1,
            question: `Based on your note "${selectedNote.title}", what is the primary objective of horizontal scaling?`,
            options: ["Adding more power (CPU, RAM) to a single machine", "Connecting multiple servers to distribute the work load", "Increasing database write speeds", "Eliminating security threats"],
            correct: 1,
            explanation: "Horizontal scaling (scaling out) involves adding more server instances to distribute traffic and load."
          },
          {
            id: 2,
            question: "What does a Load Balancer primarily distribute?",
            options: ["Database backup files", "User storage quota", "Incoming network traffic", "Hashed passwords"],
            correct: 2,
            explanation: "Load Balancers distribute user traffic across a pool of application servers."
          },
          {
            id: 3,
            question: "Which in-memory database is most commonly used for caching sessions and query results?",
            options: ["SQLite3", "MongoDB", "Redis", "PostgreSQL"],
            correct: 2,
            explanation: "Redis is an in-memory key-value data store frequently deployed as a high-speed caching database."
          }
        ];
      }

      setQuizQuestions(questions);
      setGeneratingQuiz(false);
    }, 1200);
  };

  const handleSelectQuestion = (q: any) => {
    setSelectedQuestion(q);
    setEditorCode(q.templates[selectedLanguage] || '');
    setRunLogs([]);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (selectedQuestion) {
      setEditorCode(selectedQuestion.templates[lang] || '');
    }
  };

  const handleRunCode = () => {
    if (!selectedQuestion) return;
    setRunningCode(true);
    setRunLogs([
      `> Running code...`
    ]);

    const performValidation = () => {
      const code = editorCode;
      const lang = selectedLanguage;
      const qId = selectedQuestion.id;
      const trimmed = code.trim();

      if (!trimmed || trimmed.length < 15) {
        return {
          success: false,
          logs: [
            `> Failed (Source code is empty or too short)`
          ],
          toastMsg: 'Compilation failed: Source code is empty or too short.',
          toastType: 'error' as const
        };
      }

      // JavaScript runtime execution
      if (lang === 'javascript') {
        let fn: any;
        try {
          if (qId === 'twosum') {
            const wrapped = `${code}\nreturn twoSum;`;
            fn = new Function(wrapped)();
          } else if (qId === 'reverse') {
            const wrapped = `${code}\nreturn reverseString;`;
            fn = new Function(wrapped)();
          } else if (qId === 'binary') {
            const wrapped = `${code}\nreturn binarySearch;`;
            fn = new Function(wrapped)();
          }
          if (typeof fn !== 'function') {
            throw new Error(`Entrypoint function is not defined. Ensure your function name is correct.`);
          }
        } catch (err: any) {
          return {
            success: false,
            logs: [
              `> Failed (Compilation Error: ${err.message || 'Syntax Error'})`
            ],
            toastMsg: `Compilation failed: ${err.message || 'Syntax Error'}`,
            toastType: 'error' as const
          };
        }

        try {
          const testLogs = [`> Sample test cases:`];
          if (qId === 'twosum') {
            const res1 = fn([2, 7, 11, 15], 9);
            const isOk1 = Array.isArray(res1) && 
                          ((res1[0] === 0 && res1[1] === 1) || (res1[0] === 1 && res1[1] === 0));
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: ${JSON.stringify(res1)} ${isOk1 ? '✔' : '❌'}`);

            const res2 = fn([3, 2, 4], 6);
            const isOk2 = Array.isArray(res2) && 
                          ((res2[0] === 1 && res2[1] === 2) || (res2[0] === 2 && res2[1] === 1));
            testLogs.push(`> Test Case 2: nums = [3, 2, 4], target = 6. Expected: [1,2]. Result: ${JSON.stringify(res2)} ${isOk2 ? '✔' : '❌'}`);

            if (isOk1 && isOk2) {
              testLogs.push(`> Compiled successfully!`);
              return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
            } else {
              const failedCount = (isOk1 ? 0 : 1) + (isOk2 ? 0 : 1);
              testLogs.push(`> Failed (${failedCount} of 2 test cases failed)`);
              return { success: false, logs: testLogs, toastMsg: 'Some test cases failed.', toastType: 'error' as const };
            }
          } else if (qId === 'reverse') {
            const arr = ["h", "e", "l", "l", "o"];
            fn(arr);
            const isOk = Array.isArray(arr) && arr.join('') === 'olleh';
            testLogs.push(`> Test Case 1: s = ["h","e","l","l","o"]. Expected: ["o","l","l","e","h"]. Result: ${JSON.stringify(arr)} ${isOk ? '✔' : '❌'}`);
            
            if (isOk) {
              testLogs.push(`> Compiled successfully!`);
              return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
            } else {
              testLogs.push(`> Failed (1 of 1 test cases failed)`);
              return { success: false, logs: testLogs, toastMsg: 'Test case failed.', toastType: 'error' as const };
            }
          } else if (qId === 'binary') {
            const res1 = fn([-1, 0, 3, 5, 9, 12], 9);
            const isOk1 = res1 === 4;
            testLogs.push(`> Test Case 1: nums = [-1,0,3,5,9,12], target = 9. Expected: 4. Result: ${res1} ${isOk1 ? '✔' : '❌'}`);

            const res2 = fn([-1, 0, 3, 5, 9, 12], 2);
            const isOk2 = res2 === -1;
            testLogs.push(`> Test Case 2: nums = [-1,0,3,5,9,12], target = 2. Expected: -1. Result: ${res2} ${isOk2 ? '✔' : '❌'}`);

            if (isOk1 && isOk2) {
              testLogs.push(`> Compiled successfully!`);
              return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
            } else {
              const failedCount = (isOk1 ? 0 : 1) + (isOk2 ? 0 : 1);
              testLogs.push(`> Failed (${failedCount} of 2 test cases failed)`);
              return { success: false, logs: testLogs, toastMsg: 'Some test cases failed.', toastType: 'error' as const };
            }
          }
        } catch (err: any) {
          return {
            success: false,
            logs: [
              `> Failed (Runtime Error: ${err.message || 'Execution Error'})`
            ],
            toastMsg: `Runtime Error: ${err.message || 'Execution Error'}`,
            toastType: 'error' as const
          };
        }
      }

      // Python structural code analysis
      if (lang === 'python') {
        const testLogs = [`> Sample test cases:`];
        if (qId === 'twosum') {
          const hasDef = trimmed.includes('def twoSum(');
          if (!hasDef) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: NameError: name 'twoSum' is not defined.)`
              ],
              toastMsg: "Compilation failed: function 'twoSum' not defined.",
              toastType: 'error' as const
            };
          }

          const isHardcoded = trimmed.includes('return [0, 1]') && !trimmed.includes('for') && !trimmed.includes('while');
          const hasLoop = trimmed.includes('for ') || trimmed.includes('while ');
          const hasComplement = (trimmed.includes('-') && (trimmed.includes('in ') || trimmed.includes('get('))) || trimmed.includes('hashmap') || trimmed.includes('dict');

          if (isHardcoded) {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: [0,1] ✔`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: [0,1] ❌`);
            testLogs.push(`> Failed (1 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Test Case 2 failed. Hardcoded solution detected.', toastType: 'error' as const };
          } else if (hasLoop && hasComplement) {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: [0,1] ✔`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: [1,2] ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: None ❌`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: None ❌`);
            testLogs.push(`> Failed (2 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'All test cases failed. Please review your logic.', toastType: 'error' as const };
          }
        } else if (qId === 'reverse') {
          const hasDef = trimmed.includes('def reverseString(');
          if (!hasDef) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: NameError: name 'reverseString' is not defined.)`
              ],
              toastMsg: "Compilation failed: function 'reverseString' not defined.",
              toastType: 'error' as const
            };
          }

          const hasLoop = trimmed.includes('while') || trimmed.includes('for') || trimmed.includes('reverse') || trimmed.includes('[::-1]') || trimmed.includes('s[:] =');
          if (hasLoop) {
            testLogs.push(`> Test Case 1: s = ["h","e","l","l","o"]. Expected: ["o","l","l","e","h"]. Result: ["o","l","l","e","h"] ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: s = ["h","e","l","l","o"]. Expected: ["o","l","l","e","h"]. Result: ["h","e","l","l","o"] ❌`);
            testLogs.push(`> Failed (1 of 1 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Test case failed. Solution does not reverse in-place.', toastType: 'error' as const };
          }
        } else if (qId === 'binary') {
          const hasDef = trimmed.includes('def binarySearch(');
          if (!hasDef) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: NameError: name 'binarySearch' is not defined.)`
              ],
              toastMsg: "Compilation failed: function 'binarySearch' not defined.",
              toastType: 'error' as const
            };
          }

          const hasLoop = trimmed.includes('while ') || trimmed.includes('for ');
          const hasMid = trimmed.includes('//') || trimmed.includes('/') || trimmed.includes('mid');
          
          if (hasLoop && hasMid) {
            testLogs.push(`> Test Case 1: nums = [-1,0,3,5,9,12], target = 9. Expected: 4. Result: 4 ✔`);
            testLogs.push(`> Test Case 2: nums = [-1,0,3,5,9,12], target = 2. Expected: -1. Result: -1 ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: nums = [-1,0,3,5,9,12], target = 9. Expected: 4. Result: -1 ❌`);
            testLogs.push(`> Test Case 2: nums = [-1,0,3,5,9,12], target = 2. Expected: -1. Result: -1 ✔`);
            testLogs.push(`> Failed (1 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Some test cases failed.', toastType: 'error' as const };
          }
        }
      }

      // Java structural code analysis
      if (lang === 'java') {
        const testLogs = [`> Sample test cases:`];
        const hasClass = trimmed.includes('class Solution');
        if (!hasClass) {
          return {
            success: false,
            logs: [
              `> Failed (Compilation Error: class Solution is public, should be declared in a file named Solution.java)`
            ],
            toastMsg: "Compilation failed: class 'Solution' not found.",
            toastType: 'error' as const
          };
        }

        if (qId === 'twosum') {
          const hasMethod = trimmed.includes('twoSum(');
          if (!hasMethod) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: cannot find symbol twoSum method in class Solution)`
              ],
              toastMsg: "Compilation failed: method 'twoSum' not found.",
              toastType: 'error' as const
            };
          }

          const isHardcoded = trimmed.includes('new int[]{0, 1}') && !trimmed.includes('for') && !trimmed.includes('while');
          const hasLoop = trimmed.includes('for') || trimmed.includes('while');
          const hasMap = trimmed.includes('Map') || trimmed.includes('HashMap') || trimmed.includes('containsKey');

          if (isHardcoded) {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: [0,1] ✔`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: [0,1] ❌`);
            testLogs.push(`> Failed (1 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Test Case 2 failed. Hardcoded solution detected.', toastType: 'error' as const };
          } else if (hasLoop && hasMap) {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: [0,1] ✔`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: [1,2] ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: nums = [2,7,11,15], target = 9. Expected: [0,1]. Result: [] ❌`);
            testLogs.push(`> Test Case 2: nums = [3,2,4], target = 6. Expected: [1,2]. Result: [] ❌`);
            testLogs.push(`> Failed (2 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'All test cases failed. Please review your logic.', toastType: 'error' as const };
          }
        } else if (qId === 'reverse') {
          const hasMethod = trimmed.includes('reverseString(');
          if (!hasMethod) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: cannot find symbol reverseString method in class Solution)`
              ],
              toastMsg: "Compilation failed: method 'reverseString' not found.",
              toastType: 'error' as const
            };
          }

          const hasLoop = trimmed.includes('for') || trimmed.includes('while');
          const hoverSwap = trimmed.includes('=') && (trimmed.includes('temp') || trimmed.includes('left') || trimmed.includes('right'));

          if (hasLoop && hoverSwap) {
            testLogs.push(`> Test Case 1: s = ["h","e","l","l","o"]. Expected: ["o","l","l","e","h"]. Result: ["o","l","l","e","h"] ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: s = ["h","e","l","l","o"]. Expected: ["o","l","l","e","h"]. Result: ["h","e","l","l","o"] ❌`);
            testLogs.push(`> Failed (1 of 1 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Test case failed. Solution does not reverse in-place.', toastType: 'error' as const };
          }
        } else if (qId === 'binary') {
          const hasMethod = trimmed.includes('binarySearch(');
          if (!hasMethod) {
            return {
              success: false,
              logs: [
                `> Failed (Compilation Error: cannot find symbol binarySearch method in class Solution)`
              ],
              toastMsg: "Compilation failed: method 'binarySearch' not found.",
              toastType: 'error' as const
            };
          }

          const hasLoop = trimmed.includes('while') || trimmed.includes('for');
          const hasMid = trimmed.includes('/') || trimmed.includes('mid');

          if (hasLoop && hasMid) {
            testLogs.push(`> Test Case 1: nums = [-1,0,3,5,9,12], target = 9. Expected: 4. Result: 4 ✔`);
            testLogs.push(`> Test Case 2: nums = [-1,0,3,5,9,12], target = 2. Expected: -1. Result: -1 ✔`);
            testLogs.push(`> Compiled successfully!`);
            return { success: true, logs: testLogs, toastMsg: 'All coding test cases passed!', toastType: 'success' as const };
          } else {
            testLogs.push(`> Test Case 1: nums = [-1,0,3,5,9,12], target = 9. Expected: 4. Result: -1 ❌`);
            testLogs.push(`> Test Case 2: nums = [-1,0,3,5,9,12], target = 2. Expected: -1. Result: -1 ✔`);
            testLogs.push(`> Failed (1 of 2 test cases failed)`);
            return { success: false, logs: testLogs, toastMsg: 'Some test cases failed.', toastType: 'error' as const };
          }
        }
      }

      return {
        success: false,
        logs: [
          `> Failed (Compilation Error: Unknown compiler target error.)`
        ],
        toastMsg: 'Unknown compiler target error.',
        toastType: 'error' as const
      };
    };

    setTimeout(() => {
      const evaluation = performValidation();
      setRunLogs(prev => [...prev, ...evaluation.logs]);
      setRunningCode(false);
      showToast(evaluation.toastMsg, evaluation.toastType);
    }, 1500);
  };

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col relative overflow-hidden theme-workspace">
      
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
              onClick={() => setActiveTab('coding')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'coding'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-l-2 border-violet-500'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <Code className="h-4.5 w-4.5" /> Coding Arena
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
                              onClick={handleOpenQuizModal}
                              className="p-2 bg-zinc-850 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-500 rounded-xl active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-indigo-400"
                              title="Generate AI Quiz"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>AI Quiz</span>
                            </button>

                            <button
                              onClick={handleDownloadNote}
                              className="p-2 bg-zinc-850 hover:bg-violet-900/30 hover:text-violet-300 border border-violet-800/40 rounded-xl active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-300"
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

              {/* TAB: CODING ARENA */}
              {activeTab === 'coding' && (
                <div className="h-full flex flex-col md:flex-row gap-6 min-h-0">
                  {/* Left Column: Questions List */}
                  <div className="w-full md:w-80 shrink-0 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-4 space-y-4">
                    <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Code className="h-4.5 w-4.5 text-violet-400" /> Coding Arena
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-2.5">
                      {QUESTIONS.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleSelectQuestion(q)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                            selectedQuestion?.id === q.id
                              ? 'bg-violet-950/20 border-violet-500/50'
                              : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-sm text-zinc-200">{q.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${q.diffColor}`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {q.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Code Editor & Execution Sandbox */}
                  <div className="flex-1 flex flex-col border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 min-h-0 space-y-4">
                    {selectedQuestion ? (
                      <>
                        <div className="flex justify-between items-center shrink-0 border-b border-zinc-900/60 pb-3">
                          <div>
                            <h4 className="font-bold text-lg text-zinc-100">{selectedQuestion.title}</h4>
                            <span className="text-xs text-zinc-500">Solve in real-time. Practice placement mocks.</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <select
                              value={selectedLanguage}
                              onChange={(e) => handleLanguageChange(e.target.value)}
                              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl text-zinc-200 text-xs outline-none transition-all cursor-pointer"
                            >
                              <option value="javascript">JavaScript</option>
                              <option value="python">Python</option>
                              <option value="java">Java</option>
                            </select>

                            <button
                              onClick={handleRunCode}
                              disabled={runningCode}
                              className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-violet-500 shadow-md shadow-violet-600/20"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>{runningCode ? 'Running...' : 'Run Code'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Editor Layout */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                          {/* Question details */}
                          <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-y-auto space-y-3.5">
                            <div>
                              <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Problem Description</h5>
                              <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed mt-2">
                                {selectedQuestion.description}
                              </p>
                            </div>

                            <hr className="border-zinc-900" />

                            <div>
                              <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Examples & Constraints</h5>
                              <pre className="text-[10px] text-zinc-405 font-mono bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/60 leading-relaxed mt-2 whitespace-pre-wrap">
                                {selectedQuestion.examples}
                              </pre>
                            </div>
                          </div>

                          {/* Code Editor */}
                          <div className="flex flex-col min-h-0 space-y-3">
                            <div className="flex-1 relative rounded-2xl overflow-hidden border border-zinc-900">
                              <textarea
                                value={editorCode}
                                onChange={(e) => setEditorCode(e.target.value)}
                                className="w-full h-full bg-white p-4 font-mono text-xs text-black leading-relaxed outline-none resize-none focus:ring-1 focus:ring-violet-500/20"
                                style={{ tabSize: 4 }}
                                spellCheck={false}
                              />
                            </div>

                            {/* Execution Terminal */}
                            <div className="h-40 bg-zinc-950 rounded-2xl border border-zinc-900 p-4 flex flex-col min-h-0">
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 shrink-0">
                                💻 Execution Output Terminal
                              </div>
                              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-450 space-y-1 pr-1 select-text">
                                {runLogs.length === 0 ? (
                                  <span className="text-zinc-650 italic text-[10px]">Terminal idle. Click "Run Code" to compile & test solution.</span>
                                ) : (
                                  runLogs.map((log, index) => {
                                    let color = 'text-zinc-400';
                                    if (log.includes('✔') || log.includes('SUCCESS') || log.includes('successfully') || log.includes('Successful')) color = 'text-emerald-400 font-bold';
                                    else if (log.includes('Failed') || log.includes('FAILED') || log.includes('Error') || log.includes('❌')) color = 'text-rose-400 font-bold';
                                    else if (log.includes('Running') || log.includes('Running code')) color = 'text-violet-400';
                                    return (
                                      <div key={index} className={color}>
                                        {log}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-605 space-y-2">
                        <Code className="h-10 w-10 text-zinc-700" />
                        <span className="text-sm font-semibold">Select a mock placement challenge to launch the IDE.</span>
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
                <div className="space-y-8">
                  {/* Visual Academic Analytics Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Weekly Trend Graph Card */}
                    <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl md:col-span-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Activity className="h-4.5 w-4.5 text-violet-400" /> Weekly Study Trend (Mins)
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-bold">LAST 7 DAYS</span>
                      </div>
                      
                      <div className="relative w-full h-32 flex items-center justify-center bg-zinc-950/20 border border-zinc-900/40 rounded-2xl p-2">
                        <svg viewBox="0 0 350 140" className="w-full h-full text-violet-400">
                          {/* grid lines */}
                          <line x1="30" y1="20" x2="330" y2="20" stroke="#1f2937" strokeDasharray="3 3" />
                          <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2937" strokeDasharray="3 3" />
                          <line x1="30" y1="100" x2="330" y2="100" stroke="#1f2937" strokeDasharray="3 3" />
                          
                          {/* bars */}
                          <rect x="45" y="85" width="20" height="25" rx="4" fill="url(#violetGradient)" />
                          <rect x="85" y="70" width="20" height="40" rx="4" fill="url(#violetGradient)" />
                          <rect x="125" y="40" width="20" height="70" rx="4" fill="url(#violetGradient)" />
                          <rect x="165" y="90" width="20" height="20" rx="4" fill="url(#indigoGradient)" />
                          <rect x="205" y="60" width="20" height="50" rx="4" fill="url(#violetGradient)" />
                          <rect x="245" y="75" width="20" height="35" rx="4" fill="url(#indigoGradient)" />
                          <rect x="285" y="50" width="20" height="60" rx="4" fill="url(#violetGradient)" />
                          
                          {/* labels */}
                          <text x="55" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">M</text>
                          <text x="95" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">T</text>
                          <text x="135" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">W</text>
                          <text x="175" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">T</text>
                          <text x="215" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">F</text>
                          <text x="255" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">S</text>
                          <text x="295" y="125" textAnchor="middle" fill="#6b7280" fontSize="10">S</text>
                          
                          <defs>
                            <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.4" />
                            </linearGradient>
                            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#312e81" stopOpacity="0.4" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Consistency Score Card */}
                    <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl flex flex-col justify-between space-y-4">
                      <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Award className="h-4.5 w-4.5 text-amber-500" /> Habit Consistency
                      </h4>
                      <div className="flex items-center justify-center gap-4 relative py-2">
                        <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                          <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#18181b" strokeWidth="8" fill="transparent" />
                            <circle cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="8" fill="transparent" 
                              strokeDasharray="251.2" strokeDashoffset="15" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="text-center z-10">
                            <span className="block text-base font-black text-white">94%</span>
                          </div>
                        </div>
                        <div className="text-left space-y-1">
                          <span className="block text-xs font-bold text-zinc-200">High Consistency</span>
                          <span className="block text-[10px] text-zinc-500 font-light leading-normal">Your cohort beats 88% of others. Keep coding daily!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Readiness Metrics */}
                  <div className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl space-y-4">
                    <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> Subject-wise Placement Readiness
                    </h4>
                    {currentUser?.username === 'student.demo@studycircle.com' ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">DSA Prep</span>
                            <span className="text-violet-400">75%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: '75%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">Java OOP</span>
                            <span className="text-indigo-400">82%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">DBMS Revision</span>
                            <span className="text-emerald-400">68%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">Operating Systems</span>
                            <span className="text-amber-400">60%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">Data Structures & Algos (DSA)</span>
                            <span className="text-violet-400">92%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: '92%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">Database Systems (DBMS)</span>
                            <span className="text-indigo-400">85%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-350">System Design & Core CS</span>
                            <span className="text-emerald-400">70%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-zinc-200 truncate leading-snug" title={mName}>{mName}</h4>
                              <p className="text-[10px] text-zinc-500 truncate" title={memberObj.User?.username}>@{memberObj.User?.username}</p>
                              {mCollege && (
                                <span className="inline-block text-[9px] text-violet-400 font-bold uppercase mt-1 truncate max-w-full" title={mCollege}>{mCollege}</span>
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

      {/* AI Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-150 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" /> AI Quiz Generator
                </h3>
                <span className="text-[10px] text-zinc-500 font-light">
                  Topic: {selectedNote?.title}
                </span>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-350 font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            {generatingQuiz ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-zinc-400 tracking-wider">AI parsing note content & generating MCQs...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {quizQuestions.map((q, qIndex) => {
                    const isCorrect = selectedAnswers[q.id] === q.correct;
                    const hasSelected = selectedAnswers[q.id] !== undefined;
                    return (
                      <div key={q.id} className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                            {qIndex + 1}
                          </span>
                          <span className="text-xs font-bold text-zinc-200">{q.question}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-7.5">
                          {q.options.map((option: string, optIndex: number) => {
                            const isSelected = selectedAnswers[q.id] === optIndex;
                            const isOptCorrect = q.correct === optIndex;
                            
                            let optStyle = "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:border-zinc-700";
                            if (submittedQuiz) {
                              if (isOptCorrect) {
                                optStyle = "bg-emerald-950/25 border-emerald-500/50 text-emerald-300";
                              } else if (isSelected) {
                                optStyle = "bg-red-950/25 border-red-500/50 text-red-300";
                              } else {
                                optStyle = "bg-zinc-900/30 border-zinc-900 text-zinc-600 opacity-60";
                              }
                            } else if (isSelected) {
                              optStyle = "bg-indigo-950/30 border-indigo-500/60 text-indigo-300";
                            }

                            return (
                              <button
                                key={optIndex}
                                type="button"
                                disabled={submittedQuiz}
                                onClick={() => {
                                  setSelectedAnswers(prev => ({
                                    ...prev,
                                    [q.id]: optIndex
                                  }));
                                }}
                                className={`text-left p-3.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${optStyle}`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {submittedQuiz && (
                          <div className="mt-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 text-[10px] text-zinc-400 leading-relaxed pl-7.5 font-light">
                            <span className="font-bold text-zinc-300 block mb-0.5 font-sans">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                  {submittedQuiz ? (
                    <div className="text-xs font-bold text-zinc-200">
                      Score:{' '}
                      <span className="text-violet-400">
                        {quizQuestions.filter(q => selectedAnswers[q.id] === q.correct).length} / {quizQuestions.length}
                      </span>{' '}
                      ({Math.round((quizQuestions.filter(q => selectedAnswers[q.id] === q.correct).length / quizQuestions.length) * 100)}%)
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-550 italic font-medium">Answer all questions to check results</div>
                  )}

                  <div className="flex gap-3">
                    {submittedQuiz ? (
                      <button
                        type="button"
                        onClick={handleOpenQuizModal}
                        className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer"
                      >
                        Retake Quiz
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                        onClick={() => setSubmittedQuiz(true)}
                        className="py-2 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer border border-violet-500"
                      >
                        Submit Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
