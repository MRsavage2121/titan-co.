// =============================
// Firebase Authentication Setup
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// ✅ Your Firebase Config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZ0VGdu2CoK5YY7d3__drDy8OW_bAkfCM",
  authDomain: "titan-company.firebaseapp.com",
  projectId: "titan-company",
  storageBucket: "titan-company.firebasestorage.app", // ⬅️ from your config
  messagingSenderId: "993876361774",
  appId: "1:993876361774:web:b39b768c2a9054c9d2d5bf",
  measurementId: "G-QY2XM9Y08Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// =============================
// Helper Function: Show Errors
// =============================
function showMessage(id, message, type="error") {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.style.color = (type === "error") ? "red" : "limegreen";
  }
}

// =============================
// REGISTER
// =============================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        showMessage("registerMsg", "✅ Account created successfully!", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      })
      .catch((err) => {
        showMessage("registerMsg", `❌ ${err.message}`);
      });
  });
}

// =============================
// LOGIN
// =============================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        showMessage("loginMsg", "✅ Login successful!", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      })
      .catch((err) => {
        showMessage("loginMsg", `❌ ${err.message}`);
      });
  });
}

// =============================
// LOGOUT
// =============================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logged out!");
      window.location.href = "login.html";
    });
  });
}
