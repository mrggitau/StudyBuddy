// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'index.html';
}

// Display user name
const userNameSpan = document.getElementById('userName');
if (userNameSpan) {
    userNameSpan.textContent = `Welcome, ${user.name}`;
}

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}