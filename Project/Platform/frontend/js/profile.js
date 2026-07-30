// Updates the summary line under each field
function updateInfo(id) {
  const input = document.getElementById(id);
  const summary = document.getElementById(`${id}-summary`);
  summary.textContent = input.value.trim() ? input.value : 'No info provided';
}

// Pre-fill user info into the form
document.addEventListener("DOMContentLoaded", () => {
  const userData = localStorage.getItem("user");
  if (!userData) return;

  const user = JSON.parse(userData);
  const [firstName, lastName] = user.username.split(" ");

  document.getElementById("firstName").value = firstName || '';
  document.getElementById("lastName").value = lastName || '';
  document.getElementById("email").value = user.email || '';
  document.getElementById("phone").value = user.phone || '';
  document.getElementById("country").value = user.country || '';
});

document.querySelector("form#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("You're not logged in.");
    return;
  }

  const updatedUser = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    username: `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    country: document.getElementById("country").value,
  };

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  if (oldPassword.trim() && newPassword.trim()) {
    updatedUser.oldPassword = oldPassword;
    updatedUser.newPassword = newPassword;
  } else if (oldPassword || newPassword) {
    showAlert("Please fill in both old and new passwords to change your password.");
    return;
  }

  try {
    const res = await fetch("http://45.225.135.194/api/auth/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedUser)
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      showAlert("✅ Profile updated!");
    } else {
      showAlert("❌ " + (data.msg || data.error || "Unknown error. That’s comforting."));
    }
  } catch (err) {
    console.error("Update error:", err);
    showAlert("❌ Could not update profile. The server is probably crying.");
  }
});


// ✅ Upload a single file using base64
function uploadBase64(fileInputId, label, userId, token) {
  const file = document.getElementById(fileInputId).files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];

    try {
      const res = await fetch(`http://45.225.135.194/api/upload/document/base64/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: file.name,
          contentType: file.type,
          base64Data: base64
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✅ ${label} uploaded`);
      } else {
        showAlert(`❌ ${label} upload failed: ${data.error}`);
      }
    } catch (err) {
      showAlert(`❌ ${label} upload error: ${err.message}`);
    }
  };

  reader.readAsDataURL(file);
}

// ✅ Handle "Submit Documents" button
document.querySelector(".section form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token || !user.id) {
    showAlert("You must be logged in to upload documents.");
    return;
  }

  uploadBase64("idUpload", "ID Verification", user.id, token);
  uploadBase64("addressUpload", "Address Verification", user.id, token);
  uploadBase64("additionalDocs", "Additional Document", user.id, token);

  showAlert("Upload Successful!");
});
//===================================================================================//
//  CUSTOM POPUP ALERT
//==================================================================================//
function showAlert(message) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = document.getElementById('alertMessage');
  alertMessage.textContent = message;
  alertBox.classList.add('show');
  alertBox.classList.remove('hidden');
}

function closeAlert() {
  const alertBox = document.getElementById('customAlert');
  alertBox.classList.remove('show');
  setTimeout(() => alertBox.classList.add('hidden'), 300); // Let it fade out
  window.location.reload();
}


