// ============================================
// MATCHES – Find and request study partners
// ============================================

const token = localStorage.getItem('token');
const matchesContainer = document.getElementById('matchesContainer');

// Check if user is logged in
if (!token) {
    window.location.href = 'index.html';
}

// ============================================
// FETCH MATCHES
// ============================================
async function fetchMatches() {
    matchesContainer.innerHTML = '<p>Loading matches...</p>';

    try {
        const res = await fetch(`${API_BASE}/matches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            displayMatches(data);
        } else {
            matchesContainer.innerHTML = `<p class="error-text">${data.message || 'Failed to load matches.'}</p>`;
        }
    } catch (err) {
        console.error('Fetch matches error:', err);
        matchesContainer.innerHTML = '<p class="error-text">Server error. Please try again later.</p>';
    }
}

// ============================================
// DISPLAY MATCHES
// ============================================
function displayMatches(data) {
    if (!data.matches || data.matches.length === 0) {
        matchesContainer.innerHTML = `
            <div class="no-matches">
                <p>${data.message || 'No compatible study partners found yet.'}</p>
                <p class="hint">Make sure you have completed your profile and other students are verified.</p>
            </div>
        `;
        return;
    }

    let html = `<p class="match-count">Found ${data.matches.length} compatible study partner(s)</p>`;
    html += '<div class="match-list">';

    data.matches.forEach(match => {
        html += `
            <div class="match-card">
                <div class="match-info">
                    <h3>${match.name}</h3>
                    <p><strong>Email:</strong> ${match.email}</p>
                    <p><strong>Shared Courses:</strong> ${match.common_courses.join(', ') || 'None'}</p>
                    <p><strong>Availability:</strong> ${match.availability.map(s => `${s.day_of_week} ${s.time_start.slice(0,5)}–${s.time_end.slice(0,5)}`).join(', ')}</p>
                </div>
                <div class="match-actions">
                    <span class="match-score">${match.compatibility_score}%</span>
                    <button class="send-btn" data-id="${match.id}">Send Request</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    matchesContainer.innerHTML = html;

    // Add event listeners to send buttons
    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sendRequest(btn.dataset.id, btn);
        });
    });
}

// ============================================
// SEND CONNECTION REQUEST
// ============================================
async function sendRequest(studentId, button) {
    // Disable button to prevent double clicks
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
        const res = await fetch(`${API_BASE}/matches/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ student_id: studentId })
        });

        const data = await res.json();

        if (res.ok) {
            button.textContent = '✅ Sent!';
            button.style.background = '#48bb78';
            button.style.color = 'white';
        } else {
            button.textContent = 'Try Again';
            button.disabled = false;
            alert(data.message || 'Failed to send request.');
        }
    } catch (err) {
        console.error('Send request error:', err);
        button.textContent = 'Try Again';
        button.disabled = false;
        alert('Server error. Please try again later.');
    }
}

// ============================================
// FIND MATCHES BUTTON
// ============================================
document.getElementById('findMatchesBtn')?.addEventListener('click', fetchMatches);

// Load matches on page load (optional – comment out if you want manual click)
// fetchMatches();