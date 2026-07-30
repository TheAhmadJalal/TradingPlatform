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

  const documents = [
    {
      name: "Passport.pdf",
      type: "ID",
      username: "john_doe",
      uploadedAt: "2025-07-03T12:14:07.518Z",
      status: "Pending"
    },
    {
      name: "Utility_Bill.jpg",
      type: "Proof of Address",
      username: "jane_smith",
      uploadedAt: "2025-07-01T08:23:12.331Z",
      status: "Approved"
    }
  ];

  const tbody = document.getElementById("documentsTableBody");

  documents.forEach(doc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.name}</td>
      <td>${doc.type}</td>
      <td>${doc.username}</td>
      <td>${new Date(doc.uploadedAt).toLocaleString()}</td>
      <td>${doc.status}</td>
    `;
    tbody.appendChild(row);
  });
});
