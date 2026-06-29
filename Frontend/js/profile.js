// ============================================
// PROFILE – Manage Courses, Availability, Preferences
// ============================================

const token = localStorage.getItem('token');
const messageDiv = document.getElementById('message');

// Check if user is logged in
if (!token) {
    window.location.href = 'index.html';
}

function showMessage(msg, type) {
    if (!messageDiv) return;
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
}

// ============================================
// ADD COURSE
// ============================================
document.getElementById('addCourseBtn')?.addEventListener('click', () => {
    const select = document.getElementById('courseSelect');
    const course = select.value;
    if (!course) return;

    const list = document.getElementById('courseList');
    // Check if already added
    const existing = [...list.querySelectorAll('li')].some(li => li.dataset.course === course);
    if (existing) {
        showMessage('Course already added.', 'error');
        return;
    }

    const li = document.createElement('li');
    li.textContent = course;
    li.dataset.course = course;
    list.appendChild(li);
    select.value = '';
});

// ============================================
// ADD AVAILABILITY SLOT
// ============================================
document.getElementById('addSlotBtn')?.addEventListener('click', () => {
    const day = document.getElementById('daySelect').value;
    const start = document.getElementById('timeStart').value;
    const end = document.getElementById('timeEnd').value;

    if (!start || !end) {
        showMessage('Please select a start and end time.', 'error');
        return;
    }

    if (start >= end) {
        showMessage('Start time must be before end time.', 'error');
        return;
    }

    const list = document.getElementById('availabilityList');
    const li = document.createElement('li');
    li.textContent = `${day} ${start} – ${end}`;
    li.dataset.day = day;
    li.dataset.start = start;
    li.dataset.end = end;
    list.appendChild(li);
});

// ============================================
// REMOVE ITEMS (click to remove)
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI' && e.target.closest('.tag-list')) {
        e.target.remove();
    }
});

// ============================================
// SAVE PROFILE
// ============================================
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const courses = [...document.querySelectorAll('#courseList li')].map(li => li.dataset.course);
    const availability = [...document.querySelectorAll('#availabilityList li')].map(li => ({
        day: li.dataset.day,
        start: li.dataset.start,
        end: li.dataset.end
    }));
    const environment = document.getElementById('environment').value;
    const pace = document.getElementById('pace').value;

    if (courses.length === 0) {
        showMessage('Please add at least one course.', 'error');
        return;
    }

    if (availability.length === 0) {
        showMessage('Please add at least one availability slot.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                courses,
                availability,
                preferences: { environment, pace }
            })
        });

        const data = await res.json();

        if (res.ok) {
            showMessage('Profile saved successfully!', 'success');
        } else {
            showMessage(data.message || 'Failed to save profile.', 'error');
        }
    } catch (err) {
        console.error('Profile save error:', err);
        showMessage('Server error. Please try again later.', 'error');
    }
});

// ============================================
// LOAD EXISTING PROFILE
// ============================================
async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            // Populate courses
            if (data.courses && data.courses.length > 0) {
                const list = document.getElementById('courseList');
                list.innerHTML = '';
                data.courses.forEach(c => {
                    const li = document.createElement('li');
                    li.textContent = c;
                    li.dataset.course = c;
                    list.appendChild(li);
                });
            }

            // Populate availability
            if (data.availability && data.availability.length > 0) {
                const list = document.getElementById('availabilityList');
                list.innerHTML = '';
                data.availability.forEach(slot => {
                    const li = document.createElement('li');
                    li.textContent = `${slot.day_of_week} ${slot.time_start.slice(0,5)} – ${slot.time_end.slice(0,5)}`;
                    li.dataset.day = slot.day_of_week;
                    li.dataset.start = slot.time_start;
                    li.dataset.end = slot.time_end;
                    list.appendChild(li);
                });
            }

            // Populate preferences
            if (data.preferences) {
                document.getElementById('environment').value = data.preferences.study_environment || 'Quiet';
                document.getElementById('pace').value = data.preferences.study_pace || 'Medium';
            }
        }
    } catch (err) {
        console.error('Load profile error:', err);
    }
}

// Load profile on page load
loadProfile();