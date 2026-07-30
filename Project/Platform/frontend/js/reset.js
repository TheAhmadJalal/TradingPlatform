document.getElementById('submitReset').addEventListener('click', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const newPassword = document.getElementById('newPassword').value;
  const statusEl = document.getElementById('status');
  const backLink = document.getElementById('backToLogin');

  if (!token || !newPassword) {
    statusEl.textContent = tr('reset.missing');
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
      statusEl.textContent = tr('reset.success');
      statusEl.className = 'status-message status-success';
      backLink.style.display = 'inline-block';
    } else {
      statusEl.textContent = result.message || tr('reset.error');
      statusEl.className = 'status-message status-failed';
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = tr('reset.network');
    statusEl.className = 'status-message status-failed';
  }
});