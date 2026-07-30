document.addEventListener("DOMContentLoaded", () => {
  const darkButton = document.getElementById("darkModeButton");
  const prefersDark = localStorage.getItem("crm-dark-mode") === "true";

  if (prefersDark) {
    document.body.classList.add("dark-mode");
    darkButton.textContent = "Disable Dark Mode";
  }

  darkButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    darkButton.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
    localStorage.setItem("crm-dark-mode", isDark);
  });

  // Password change form
  const passwordForm = document.getElementById("passwordForm");
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (!current || !newPass || !confirm) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPass !== confirm) {
      alert("New passwords do not match.");
      return;
    }

    alert("Password updated successfully (visual only for now).");
  });

  // Create user form
  const createForm = document.getElementById("createUserForm");
  createForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("newUsername").value;
    const email = document.getElementById("newEmail").value;
    const password = document.getElementById("newUserPassword").value;

    if (!username || !email || !password) {
      alert("Please fill in all fields to create a user.");
      return;
    }

    alert(`New user "${username}" created (visual only for now).`);
  });
});
