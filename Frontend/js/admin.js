// ============================================
// ADMIN DASHBOARD
// ============================================

const token = localStorage.getItem('token');
const adminContent = document.getElementById('adminContent');

// Check if user is logged in
if (!token) {
    window.location.href = 'index.html';
}

// Check if user is an admin
try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (tokenPayload.role !== 'admin') {
        alert('You do not have admin access.');
        window.location.href = 'dashboard.html';
    }
} catch (err) {
    window.location.href = 'index.html';
}

// Display admin name
const adminNameSpan = document.getElementById('adminName');
const user = JSON.parse(localStorage.getItem('user'));
if (adminNameSpan && user) {
    adminNameSpan.textContent = `Welcome, ${user.name}`;
}

// ============================================
// LOAD ALL STUDENTS
// ============================================
async function loadStudents() {
    adminContent.innerHTML = '<p>Loading students...</p>';

    try {
        const res = await fetch(`${API_BASE}/admin/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            displayStudents(data);
        } else {
            adminContent.innerHTML = `<p class="error-text">${data.message || 'Failed to load students.'}</p>`;
        }
    } catch (err) {
        console.error('Load students error:', err);
        adminContent.innerHTML = '<p class="error-text">Server error. Please try again later.</p>';
    }
}

// ============================================
// DISPLAY STUDENTS
// ============================================
function displayStudents(data) {
    if (!data.students || data.students.length === 0) {
        adminContent.innerHTML = '<p>No students found.</p>';
        return;
    }

    let html = `<p class="student-count">Total students: ${data.count}</p>`;
    html += `
        <div class="table-wrapper">
            <table class="student-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Student ID</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.students.forEach(student => {
        const status = student.verification_status || 'pending';
        const statusClass = status === 'verified' ? 'status-verified' : status === 'suspended' ? 'status-suspended' : 'status-pending';

        html += `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.student_id_number}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    ${status === 'pending' ? `<button class="action-btn verify-btn" data-id="${student.student_id}">Verify</button>` : ''}
                    ${status !== 'suspended' ? `<button class="action-btn suspend-btn" data-id="${student.student_id}">Suspend</button>` : ''}
                    <button class="action-btn delete-btn" data-id="${student.student_id}">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    adminContent.innerHTML = html;

    // Add event listeners to buttons
    document.querySelectorAll('.verify-btn').forEach(btn => {
        btn.addEventListener('click', () => verifyStudent(btn.dataset.id));
    });

    document.querySelectorAll('.suspend-btn').forEach(btn => {
        btn.addEventListener('click', () => suspendStudent(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
    });
}

// ============================================
// VERIFY STUDENT
// ============================================
async function verifyStudent(studentId) {
    if (!confirm(`Verify student ID ${studentId}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/verify/${studentId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || 'Student verified successfully.');
            loadStudents(); // Refresh the list
        } else {
            alert(data.message || 'Failed to verify student.');
        }
    } catch (err) {
        console.error('Verify error:', err);
        alert('Server error. Please try again later.');
    }
}

// ============================================
// SUSPEND STUDENT
// ============================================
async function suspendStudent(studentId) {
    if (!confirm(`Suspend student ID ${studentId}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/suspend/${studentId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || 'Student suspended successfully.');
            loadStudents(); // Refresh the list
        } else {
            alert(data.message || 'Failed to suspend student.');
        }
    } catch (err) {
        console.error('Suspend error:', err);
        alert('Server error. Please try again later.');
    }
}

// ============================================
// DELETE STUDENT
// ============================================
async function deleteStudent(studentId) {
    if (!confirm(`⚠️ Permanently delete student ID ${studentId}? This cannot be undone.`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/delete/${studentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || 'Student deleted successfully.');
            loadStudents(); // Refresh the list
        } else {
            alert(data.message || 'Failed to delete student.');
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert('Server error. Please try again later.');
    }
}

// ============================================
// LOAD ACTIVITY LOGS
// ============================================
async function loadLogs() {
    adminContent.innerHTML = '<p>Loading logs...</p>';

    try {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            displayLogs(data);
        } else {
            adminContent.innerHTML = `<p class="error-text">${data.message || 'Failed to load logs.'}</p>`;
        }
    } catch (err) {
        console.error('Load logs error:', err);
        adminContent.innerHTML = '<p class="error-text">Server error. Please try again later.</p>';
    }
}

// ============================================
// DISPLAY LOGS
// ============================================
function displayLogs(data) {
    if (!data.logs || data.logs.length === 0) {
        adminContent.innerHTML = '<p>No logs found.</p>';
        return;
    }

    let html = `<p class="log-count">Recent admin actions: ${data.count}</p>`;
    html += `
        <div class="table-wrapper">
            <table class="log-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.logs.forEach(log => {
        html += `
            <tr>
                <td>${log.log_id}</td>
                <td>${log.admin_name || 'Unknown'}</td>
                <td>${log.action}</td>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    adminContent.innerHTML = html;
}

// ============================================
// BUTTON EVENT LISTENERS
// ============================================
document.getElementById('loadStudentsBtn')?.addEventListener('click', loadStudents);
document.getElementById('loadLogsBtn')?.addEventListener('click', loadLogs);

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', logout);

// Load students by default
loadStudents();