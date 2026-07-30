document.getElementById('submitReset').addEventListener('click', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const newPassword = document.getElementById('newPassword').value;
  const statusEl = document.getElementById('status');
  const backLink = document.getElementById('backToLogin');

  if (!token || !newPassword) {
    statusEl.textContent = 'Missing token or password';
    statusEl.className = 'status-message status-failed';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, newPassword })
    });

    const result = await response.json();

    if (response.ok) {
      statusEl.textContent = 'Password reset successful!';
      statusEl.className = 'status-message status-success';
      backLink.style.display = 'inline-block';
    } else {
      statusEl.textContent = result.message || 'Error occurred';
      statusEl.className = 'status-message status-failed';
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Network error';
    statusEl.className = 'status-message status-failed';
  }
});