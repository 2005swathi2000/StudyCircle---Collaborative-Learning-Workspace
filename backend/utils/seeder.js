const { 
  User, 
  Group, 
  GroupMember, 
  Note, 
  Session, 
  DiscussionTopic, 
  DiscussionMessage, 
  Progress 
} = require('../models');

const seedDatabase = async () => {
  try {
    // Check if seeding is already done (e.g. if we have users)
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping database seed.');
      return;
    }

    console.log('Seeding database with updated evaluator demo content...');

    // 1. Create Demo Users
    const studentUser = await User.create({
      fullName: 'Swathi (VIT-AP University)',
      username: 'student.demo@studycircle.com',
      password: 'Demo@123',
      role: 'student',
      streakCount: 15,
      totalStudyHours: 120.0,
      bio: 'B.Tech CSE student preparing for placements. Completed Sessions: 48, Notes Shared: 23',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    });

    const mentorUser = await User.create({
      fullName: 'Dr. Prasad (Aditya University)',
      username: 'mentor.demo@studycircle.com',
      password: 'Demo@123',
      role: 'admin', // admin role maps to Mentor / Admin in workspace
      streakCount: 5,
      totalStudyHours: 42.0,
      bio: 'Placement Mentor. Students Mentored: 85, Sessions Conducted: 42, Avg Rating: 4.8/5, Notes Published: 31',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    });

    const adminUser = await User.create({
      fullName: 'System Admin (StudyCircle)',
      username: 'admin.demo@studycircle.com',
      password: 'Demo@123',
      role: 'admin',
      streakCount: 12,
      totalStudyHours: 100.0,
      bio: 'System Administrator dashboard controller. Total Users: 500+, Active Rooms: 40+, Study Sessions: 1000+, Notes Shared: 2500+',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    });

    console.log('Demo accounts seeded.');

    // 2. Create the 4 Joined Rooms (Groups)
    const dsaGroup = await Group.create({
      name: 'DSA Preparation',
      description: 'Dynamic programming, recursion, binary trees, and mock interview preparations.',
      subject: 'Data Structures & Algorithms',
      inviteCode: 'dsaprep1',
      isPublic: true
    });

    const javaGroup = await Group.create({
      name: 'Java Development',
      description: 'Core Java, OOP principles, multi-threading, Spring Boot microservices, and backend layouts.',
      subject: 'Java OOP & Backend',
      inviteCode: 'javadev2',
      isPublic: true
    });

    const dbmsGroup = await Group.create({
      name: 'DBMS Revision',
      description: 'Relational algebra, SQL queries, database normalization (1NF to BCNF), and transaction concurrency.',
      subject: 'Database Systems',
      inviteCode: 'dbmsrev3',
      isPublic: true
    });

    const aptitudeGroup = await Group.create({
      name: 'Aptitude Practice',
      description: 'Quantitative aptitude shortcuts, logical reasoning, and puzzle-solving groups.',
      subject: 'Aptitude & Reasoning',
      inviteCode: 'aptitude',
      isPublic: true
    });

    console.log('4 Rooms seeded.');

    // 3. Add Members to Group
    const groups = [dsaGroup, javaGroup, dbmsGroup, aptitudeGroup];
    for (const g of groups) {
      await GroupMember.create({
        userId: studentUser.id,
        groupId: g.id,
        role: 'student'
      });

      await GroupMember.create({
        userId: mentorUser.id,
        groupId: g.id,
        role: 'mentor'
      });

      await GroupMember.create({
        userId: adminUser.id,
        groupId: g.id,
        role: 'admin'
      });
    }

    console.log('Group memberships created.');

    // 4. Preloaded Notes
    // Java OOP Notes
    await Note.create({
      groupId: javaGroup.id,
      title: 'Java OOP Notes',
      content: `# Java OOP Notes: Core Pillars

## 1. Inheritance
Reusability mechanism where a subclass inherits fields and methods of a superclass.
- Uses the \`extends\` keyword.
- Java does not support multiple inheritance with classes to avoid the diamond problem (use Interfaces instead).

## 2. Polymorphism
Ability of an object to take on many forms.
* **Compile-time (Overloading)**: Same method name with different signatures.
* **Runtime (Overriding)**: Subclass provides specific implementation of a superclass method.

## 3. Encapsulation
Wrapping code and data together into a single unit. Private variables accessed via public getters/setters.

## 4. Abstraction
Hiding implementation details and showing only functionality. Achieved using abstract classes or interfaces.`,
      createdBy: mentorUser.id,
      isPinned: true
    });

    // DBMS Interview Questions
    await Note.create({
      groupId: dbmsGroup.id,
      title: 'DBMS Interview Questions',
      content: `# DBMS Interview Questions: Revision Guide

## 1. What is ACID property?
- **Atomicity**: Entire transaction completes or none does.
- **Consistency**: Database remains in a valid state before and after.
- **Isolation**: Concurrent transactions execute without interference.
- **Durability**: Committed changes survive crashes.

## 2. What is database normalization?
Process of organizing fields and tables to minimize redundancy and dependency.
- **1NF**: Atomic values.
- **2NF**: Remove partial dependencies.
- **3NF**: Remove transitive dependencies.
- **BCNF**: X must be a super key for every FD X -> A.`,
      createdBy: studentUser.id,
      isPinned: true
    });

    // Operating Systems Cheat Sheet
    await Note.create({
      groupId: dsaGroup.id, // Put in DSA room or general
      title: 'Operating Systems Cheat Sheet',
      content: `# Operating Systems Cheat Sheet: Placement Prep

## 1. Process vs Thread
- **Process**: Active program instance with independent memory space.
- **Thread**: Light-weight unit of execution sharing memory space with parent process.

## 2. CPU Scheduling Algorithms
- First-Come, First-Served (FCFS)
- Shortest Job First (SJF)
- Round Robin (RR)
- Priority Scheduling

## 3. Deadlock Conditions
All four Coffman conditions must hold:
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait`,
      createdBy: mentorUser.id,
      isPinned: false
    });

    console.log('Notes seeded.');

    // 5. Scheduled Sessions
    // DSA Mock Interview
    await Session.create({
      groupId: dsaGroup.id,
      title: 'DSA Mock Interview',
      description: 'Mock session reviewing Two Sum, reverse arrays, and binary search patterns.',
      createdBy: mentorUser.id,
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      durationMinutes: 65,
      status: 'upcoming',
      meetingLink: 'https://zoom.us/dsa-mock-interview'
    });

    // Java Backend Guidance
    await Session.create({
      groupId: javaGroup.id,
      title: 'Java Backend Guidance',
      description: 'Coaching session for Spring Boot architectures, JPA repositories, and REST API conventions.',
      createdBy: mentorUser.id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      durationMinutes: 90,
      status: 'upcoming',
      meetingLink: 'https://zoom.us/java-backend-guide'
    });

    // Resume Review Session
    await Session.create({
      groupId: dbmsGroup.id,
      title: 'Resume Review Session',
      description: 'Reviewing SQL project entries and placement resumes.',
      createdBy: mentorUser.id,
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      durationMinutes: 60,
      status: 'upcoming',
      meetingLink: 'https://zoom.us/resume-review'
    });

    console.log('Sessions seeded.');

    // 6. Discussion questions (Requests & Interactions)
    const topic1 = await DiscussionTopic.create({
      groupId: dsaGroup.id,
      title: 'Optimal Solution for Two Sum complexity checks',
      createdBy: studentUser.id
    });
    await DiscussionMessage.create({
      topicId: topic1.id,
      userId: studentUser.id,
      content: 'Is there any way to solve Two Sum without using a Hash Map in O(N) time?'
    });
    await DiscussionMessage.create({
      topicId: topic1.id,
      userId: mentorUser.id,
      content: 'If the array is sorted, you can use the two-pointer technique to solve it in O(N) time and O(1) space! Otherwise, a Hash Map is required for O(N) time.'
    });

    const topic2 = await DiscussionTopic.create({
      groupId: javaGroup.id,
      title: 'Spring Boot JPA relational mappings',
      createdBy: studentUser.id
    });
    await DiscussionMessage.create({
      topicId: topic2.id,
      userId: studentUser.id,
      content: 'Should we always use @ManyToMany or decompose it manually with a join entity?'
    });

    const topic3 = await DiscussionTopic.create({
      groupId: dbmsGroup.id,
      title: 'Normalization practice problems',
      createdBy: studentUser.id
    });

    console.log('Discussions seeded.');

    // 7. Seed progress logs for student trend chart (120 hours total, 15 days streak)
    // 120 hours = 7200 minutes. Over 15 logs, let's log ~400-500 minutes per day.
    const today = new Date();
    const formatDate = (dateOffset) => {
      const d = new Date();
      d.setDate(today.getDate() - dateOffset);
      return d.toISOString().split('T')[0];
    };

    for (let i = 0; i < 15; i++) {
      await Progress.create({
        userId: studentUser.id,
        groupId: dsaGroup.id,
        studyMinutes: 480, // 8 hours per log * 15 logs = 120 hours total
        notesCreated: i % 3 === 0 ? 1 : 0,
        tasksCompleted: 3,
        loggedDate: formatDate(i)
      });
    }

    // Mentor progress logs
    for (let i = 0; i < 7; i++) {
      await Progress.create({
        userId: mentorUser.id,
        groupId: dsaGroup.id,
        studyMinutes: 360,
        notesCreated: 2,
        tasksCompleted: 4,
        loggedDate: formatDate(i)
      });
    }

    console.log('Student and mentor progress logs seeded.');
    console.log('Database Seeding Completed Successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = { seedDatabase };
