/**
 * Automated test script to verify StudyCircle backend APIs.
 * Runs basic integration flows against the running local Express server.
 */
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const runTests = async () => {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');
  
  try {
    // 1. Create unique test credentials
    const timestamp = Date.now();
    const adminUsername = `admin_${timestamp}`;
    const studentUsername = `student_${timestamp}`;
    
    let adminToken, studentToken;
    let groupId, inviteCode;
    let noteId, topicId;

    // 2. Register Admin User
    console.log('\n[1] Registering Admin...');
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Swathi Admin',
        username: adminUsername,
        password: 'password123',
        role: 'admin'
      })
    });
    const regAdminData = await regAdminRes.json();
    if (!regAdminRes.ok) throw new Error(`Reg Admin failed: ${JSON.stringify(regAdminData)}`);
    console.log('✅ Admin registered successfully.');

    // 3. Login Admin User
    console.log('\n[2] Logging in Admin...');
    const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: adminUsername,
        password: 'password123'
      })
    });
    const loginAdminData = await loginAdminRes.json();
    if (!loginAdminRes.ok) throw new Error(`Login Admin failed: ${JSON.stringify(loginAdminData)}`);
    adminToken = loginAdminData.token;
    console.log('✅ Admin logged in. Token received.');

    // 4. Register Student User
    console.log('\n[3] Registering Student...');
    const regStudentRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bhagya Student',
        username: studentUsername,
        password: 'password123',
        role: 'student'
      })
    });
    const regStudentData = await regStudentRes.json();
    if (!regStudentRes.ok) throw new Error(`Reg Student failed: ${JSON.stringify(regStudentData)}`);
    console.log('✅ Student registered successfully.');

    // 5. Login Student User
    console.log('\n[4] Logging in Student...');
    const loginStudentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: studentUsername,
        password: 'password123'
      })
    });
    const loginStudentData = await loginStudentRes.json();
    if (!loginStudentRes.ok) throw new Error(`Login Student failed: ${JSON.stringify(loginStudentData)}`);
    studentToken = loginStudentData.token;
    console.log('✅ Student logged in. Token received.');

    // 6. Create Study Group (by Admin)
    console.log('\n[5] Creating Study Group...');
    const createGroupRes = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Guntur B.Tech Study Circle',
        description: 'Semester 6 exam prep and placement training.',
        subject: 'Computer Science',
        isPublic: true
      })
    });
    const createGroupData = await createGroupRes.json();
    if (!createGroupRes.ok) throw new Error(`Create group failed: ${JSON.stringify(createGroupData)}`);
    groupId = createGroupData.group.id;
    inviteCode = createGroupData.group.inviteCode;
    console.log(`✅ Group created. ID: ${groupId}, Invite Code: ${inviteCode}`);

    // 7. Join Study Group (by Student using Invite Code)
    console.log('\n[6] Joining Group using Invite Code...');
    const joinRes = await fetch(`${BASE_URL}/groups/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ inviteCode })
    });
    const joinData = await joinRes.json();
    if (!joinRes.ok) throw new Error(`Join group failed: ${JSON.stringify(joinData)}`);
    console.log('✅ Student joined the group successfully.');

    // 8. Fetch Group Members list
    console.log('\n[7] Retrieving Group Members...');
    const membersRes = await fetch(`${BASE_URL}/groups/${groupId}/members`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const membersData = await membersRes.json();
    if (!membersRes.ok) throw new Error(`Get members failed: ${JSON.stringify(membersData)}`);
    console.log(`✅ Members retrieved: ${membersData.members.length} members found.`);
    console.log(membersData.members.map(m => `- ${m.User.fullName} (${m.role})`).join('\n'));

    // 9. Notes: Create & Read
    console.log('\n[8] Testing Shared Notes...');
    const createNoteRes = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        groupId,
        title: 'React Hooks Overview',
        content: 'useState, useEffect, and custom hooks notes.'
      })
    });
    const createNoteData = await createNoteRes.json();
    if (!createNoteRes.ok) throw new Error(`Create note failed: ${JSON.stringify(createNoteData)}`);
    noteId = createNoteData.note.id;
    console.log('✅ Note created successfully.');

    const getNotesRes = await fetch(`${BASE_URL}/notes/group/${groupId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getNotesData = await getNotesRes.json();
    if (!getNotesRes.ok) throw new Error(`Get notes failed: ${JSON.stringify(getNotesData)}`);
    console.log(`✅ Note count retrieved: ${getNotesData.notes.length}`);

    // 10. Sessions: Schedule & Read
    console.log('\n[9] Testing Scheduled Sessions...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const createSessionRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        groupId,
        title: 'Mock Placement Interview Session',
        description: 'Resume review and DSA questions.',
        scheduledAt: tomorrow.toISOString(),
        durationMinutes: 90,
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      })
    });
    const createSessionData = await createSessionRes.json();
    if (!createSessionRes.ok) throw new Error(`Schedule session failed: ${JSON.stringify(createSessionData)}`);
    console.log('✅ Study session scheduled successfully.');

    // 11. Discussions: Create Topic & Message
    console.log('\n[10] Testing Async Discussion Board...');
    const createTopicRes = await fetch(`${BASE_URL}/discussions/topics`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        groupId,
        title: 'Doubts about Database Joins'
      })
    });
    const createTopicData = await createTopicRes.json();
    if (!createTopicRes.ok) throw new Error(`Create discussion topic failed: ${JSON.stringify(createTopicData)}`);
    topicId = createTopicData.topic.id;
    console.log('✅ Discussion topic created.');

    const createMsgRes = await fetch(`${BASE_URL}/discussions/topics/${topicId}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        content: 'You should look at INNER JOIN vs LEFT JOIN. Inner join returns matches only.'
      })
    });
    const createMsgData = await createMsgRes.json();
    if (!createMsgRes.ok) throw new Error(`Post message failed: ${JSON.stringify(createMsgData)}`);
    console.log('✅ Message reply posted in discussion thread.');

    // 12. Progress Logging & Streak Check
    console.log('\n[11] Testing Personal Progress logs...');
    const logProgressRes = await fetch(`${BASE_URL}/progress/log`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studyMinutes: 120,
        notesCreated: 1,
        tasksCompleted: 2,
        groupId
      })
    });
    const logProgressData = await logProgressRes.json();
    if (!logProgressRes.ok) throw new Error(`Log progress failed: ${JSON.stringify(logProgressData)}`);
    console.log(`✅ Progress logged. Updated student streak: ${logProgressData.user.streakCount}, total study hours: ${logProgressData.user.totalStudyHours}`);

    const getMeRes = await fetch(`${BASE_URL}/progress/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const getMeData = await getMeRes.json();
    if (!getMeRes.ok) throw new Error(`Get profile progress failed: ${JSON.stringify(getMeData)}`);
    console.log(`✅ Student profile stats confirmed. Total hours: ${getMeData.totalStudyHours}, Streak: ${getMeData.streakCount}`);

    // 13. Leaderboard check
    console.log('\n[12] Checking Group Leaderboard...');
    const leaderboardRes = await fetch(`${BASE_URL}/progress/group/${groupId}/leaderboard`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const leaderboardData = await leaderboardRes.json();
    if (!leaderboardRes.ok) throw new Error(`Get leaderboard failed: ${JSON.stringify(leaderboardData)}`);
    console.log('✅ Group Leaderboard retrieved:');
    console.log(leaderboardData.leaderboard.map((u, i) => `#${i+1} ${u.fullName} - ${u.totalStudyHours} hrs (${u.role})`).join('\n'));

    console.log('\n🌟 ALL BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY! 🌟');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE:', error.message);
    process.exit(1);
  }
};

runTests();
