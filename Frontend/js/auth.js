const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

function showMessage(msg, type) {
    if (!messageDiv) return;
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
}

// for logging in
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Clears old messages
        messageDiv.className = 'message';
        messageDiv.textContent = '';

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Save token and user data to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showMessage('Login successful! Redirecting...', 'success');

                // Redirect based on role
                setTimeout(() => {
                    const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
                    if (tokenPayload.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } else {
                showMessage(data.message || 'Login failed. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Login error:', err);
            showMessage('Server error. Please try again later.', 'error');
        }
    });
}

// registering a new user
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Clears old messages
        messageDiv.className = 'message';
        messageDiv.textContent = '';

        // Check if passwords match
        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        // Check email domain
        if (!email.endsWith('@strathmore.edu')) {
            showMessage('Only @strathmore.edu email addresses are allowed.', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, studentId, password })
            });

            const data = await res.json();

            if (res.ok) {
                showMessage('Registration successful! Await admin verification.', 'success');
                registerForm.reset();
            } else {
                showMessage(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Registration error:', err);
            showMessage('Server error. Please try again later.', 'error');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}