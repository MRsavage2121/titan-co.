// ===== Firebase (via CDN ESM imports) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, setDoc, getDoc, doc,
  serverTimestamp, onSnapshot, query, orderBy, updateDoc, increment, getDocs
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

// ---- Your project config (from you) ----
const firebaseConfig = {
  apiKey: "AIzaSyDZ0VGdu2CoK5YY7d3__drDy8OW_bAkfCM",
  authDomain: "titan-company.firebaseapp.com",
  projectId: "titan-company",
  storageBucket: "titan-company.firebasestorage.app",
  messagingSenderId: "993876361774",
  appId: "1:993876361774:web:b39b768c2a9054c9d2d5bf",
  measurementId: "G-QY2XM9Y08Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optional: lock admin to a specific email. Leave "" to allow any logged-in user to see admin.
const ADMIN_EMAIL = ""; // e.g. "titanlandscaping2122@gmail.com"

// ===== Nav auth UI =====
const navAuth = document.getElementById("nav-auth");
const navLogout = document.getElementById("nav-logout");

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  if (navAuth && navLogout) {
    if (user) {
      navAuth.textContent = "Account";
      navAuth.href = "login.html";
      navLogout.style.display = "inline-block";
    } else {
      navAuth.textContent = "Login";
      navAuth.href = "login.html";
      navLogout.style.display = "none";
    }
  }

  // Protect admin page if ADMIN_EMAIL is set
  if (location.pathname.endsWith("admin.html")) {
    if (!user) {
      location.href = "login.html";
      return;
    }
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
      alert("Admin access only.");
      location.href = "index.html";
      return;
    }
    loadAdminTables(); // load data once auth is confirmed
  }
});

// ===== Service dropdowns (all pages) =====
function initServiceToggles() {
  document.querySelectorAll(".service-card").forEach(card => {
    const btn = card.querySelector(".service-toggle");
    const content = card.querySelector(".service-content");
    if (!btn || !content) return;
    btn.addEventListener("click", () => {
      card.classList.toggle("active");
      if (card.classList.contains("active")) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = 0;
      }
    });
  });
}

// ===== Register / Login (login.html) =====
function initAuthForms() {
  const regBtn = document.getElementById("register-btn");
  const loginBtn = document.getElementById("login-btn");

  if (regBtn) {
    regBtn.addEventListener("click", async () => {
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const pass = document.getElementById("reg-password").value;
      const msg = document.getElementById("reg-msg");
      try {
        if (!name) throw new Error("Please enter your full name.");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Create or merge the user record
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          name,
          email,
          points: 0,
          createdAt: serverTimestamp()
        }, { merge: true });
        msg.style.color = "#00ffcc";
        msg.textContent = "Registration successful! You can now book services.";
      } catch (e) {
        msg.style.color = "#ff6b6b";
        msg.textContent = e.message;
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("login-email").value.trim();
      const pass = document.getElementById("login-password").value;
      const msg = document.getElementById("login-msg");
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        msg.style.color = "#00ffcc";
        msg.textContent = "Login successful!";
        // optional redirect
        setTimeout(()=>location.href="index.html#services",700);
      } catch (e) {
        msg.style.color = "#ff6b6b";
        msg.textContent = e.message;
      }
    });
  }
}

// ===== Booking (index.html services) =====
function initBooking() {
  document.querySelectorAll(".book-now").forEach(btn => {
    btn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first to book.");
        location.href = "login.html";
        return;
      }
      const box = btn.closest(".pricing-box");
      const serviceName = box?.getAttribute("data-service") || "Service";
      const price = box?.getAttribute("data-price") || "";
      try {
        const ref = await addDoc(collection(db, "bookings"), {
          uid: user.uid,
          service: serviceName,
          price,
          createdAt: serverTimestamp()
        });
        // Add points (example: +10 per booking)
        const uref = doc(db, "users", user.uid);
        await updateDoc(uref, { points: increment(10) });
        alert(`Booking placed! You earned +10 points.\nRef: ${ref.id}`);
      } catch (e) {
        alert("Booking failed: " + e.message);
      }
    });
  });
}

// ===== Admin: load users & bookings =====
async function loadAdminTables() {
  initAdminUsers();
  initAdminBookings();
  const btnU = document.getElementById("refresh-users");
  const btnB = document.getElementById("refresh-bookings");
  if (btnU) btnU.addEventListener("click
