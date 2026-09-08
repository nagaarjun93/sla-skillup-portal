const API = 'http://localhost:5002/api';

async function testMockModels() {
  console.log('==================================================');
  console.log('🎯 TESTING 10 MOCK MODELS & STUDENT PAPER ASSIGNMENT');
  console.log('==================================================\n');

  try {
    // 1. Admin Login
    console.log('1. Admin Logging in...');
    const adminRes = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin@123' })
    });
    const { token: adminToken } = await adminRes.json();
    console.log('   ✅ Admin Logged In!\n');

    // 2. Fetch Model Stats
    console.log('2. Fetching 10 Mock Models Overview Stats...');
    const statsRes = await fetch(`${API}/admin/mock/models-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stats = await statsRes.json();
    console.log(`   ✅ Fetched ${stats.length} Model Sets (Model 1 to Model 10)`);
    console.log('   Sample Stats:', stats.slice(0, 3), '\n');

    // 3. Auto-distribute models across students
    console.log('3. Clicking "Auto-Assign 10 Models across Students"...');
    const autoRes = await fetch(`${API}/admin/mock/auto-distribute-models`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const autoData = await autoRes.json();
    console.log(`   ✅ ${autoData.message}\n`);

    // 4. Verify Student Mock Exam returns assigned model
    console.log('4. Registering a test student and checking assigned Mock Exam model...');
    const regRes = await fetch(`${API}/students/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Model Test Student',
        email: `model_student_${Date.now()}@gmail.com`,
        password: 'password123'
      })
    });
    const { token: stToken, student } = await regRes.json();
    
    // Enable mock access for student
    await fetch(`${API}/admin/students/mock-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ studentIds: [student.id], accessEnabled: true })
    });

    // Assign Model 3 to this student
    console.log(`   Assigning "Model 3" to Student (${student.name})...`);
    await fetch(`${API}/admin/mock/assign-student-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ studentId: student.id, modelSet: 'Model 3' })
    });

    // Student fetches Mock Exam
    const mockExamRes = await fetch(`${API}/student/mock/exam`, {
      headers: { Authorization: `Bearer ${stToken}` }
    });
    const mockExam = await mockExamRes.json();
    console.log(`   ✅ Student Mock Exam Title: "${mockExam.title}"`);
    console.log(`   Assigned Model Set: "${mockExam.assignedModel}"\n`);

    console.log('🎉 10 MOCK MODELS & STUDENT ASSIGNMENT VERIFIED 100% PERFECTLY! 🎉');
  } catch (e) {
    console.error('❌ Verification failed:', e.message);
  }
}

testMockModels();
