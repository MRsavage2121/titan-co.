/* ========= TITAN COMPANY — Unified App Logic =========
   Works on: index.html, services.html, about.html, contact.html,
             login.html, register.html, admin.html
   Requires: <script type="module" src="main.js"></script> at end of body.
====================================================== */

// ---- Firebase CDN ESM imports ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, setDoc, getDoc, getDocs,
  doc, updateDoc, increment, serverTimestamp, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

// ---- Your Firebase config (already provided by you) ----
const firebaseConfig = {
  apiKey: "AIzaSyDZ0VGdu2CoK5YY7d3__drDy8OW_bAkfCM",
  authDomain: "titan-company.firebaseapp.com",
  projectId: "titan-company",
  storageBucket: "titan-company.firebasestorage.app",
  messagingSenderId: "993876361774",
  appId: "1:993876361774:web:b39b768c2a9054c9d2d5bf",
  measurementId: "G-QY2XM9Y08Y"
};

// ---- Initialize Firebase ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optional: restrict admin to a specific email (leave "" to allow any logged-in user)
const ADMIN_EMAIL = ""; // e.g. "titanlandscaping2122@gmail.com"

// ======= Helper: Get current page filename =======
const page = location.pathname.split("/").pop().toLowerCase() || "index.html";

// ======= Nav / Auth UI =======
const navAuth = document.getElementById("nav-auth");
const navLogout = document.getElementById("nav-logout");

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  // Update nav
  if (navAuth && navLogout) {
    if (user) {
      navAuth.textContent = "Account";
      navAuth.href = "login.html";
      navLogout.classList.remove("hidden");
      navLogout.style.display = "inline-block";
    } else {
      navAuth.textContent = "Login";
      navAuth.href = "login.html";
      navLogout.classList.add("hidden");
      navLogout.style.display = "none";
    }
  }

  // Gate admin
  if (page === "admin.html") {
    if (!user) return location.replace("login.html");
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
      alert("Admin access only.");
      return location.replace("index.html");
    }
    loadAdmin(); // load data once authenticated
  }
});

// ======= Service Dropdowns (any page with .service-card) =======
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

// ======= Booking buttons (cards with .pricing-box .book-now) =======
function initBooking() {
  document.querySelectorAll(".book-now").forEach(btn => {
    btn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to book.");
        return location.assign("login.html");
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
        // award points
        await updateDoc(doc(db, "users", user.uid), { points: increment(10) }).catch(async () => {
          // if user doc doesn't exist, create it
          await setDoc(doc(db, "users", user.uid), { points: 10 }, { merge: true });
        });
        alert(`Booking placed! +10 points earned.\nRef: ${ref.id}`);
      } catch (e) {
        alert("Booking failed: " + e.message);
      }
    });
  });
}

// ======= Auth (works if login/register inputs are present on page) =======
function initAuthForms() {
  // Register
  const regBtn = document.getElementById("register-btn");
  if (regBtn) {
    regBtn.addEventListener("click", async () => {
      const name = (document.getElementById("reg-name")?.value || "").trim();
      const email = (document.getElementById("reg-email")?.value || "").trim();
      const pass = document.getElementById("reg-password")?.value || "";
      const msg = document.getElementById("reg-msg");
      try {
        if (!name) throw new Error("Please enter your full name.");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid, name, email, points: 0, createdAt: serverTimestamp()
        }, { merge: true });
        if (msg) { msg.style.color = "var(--success)"; msg.textContent = "Registration successful!"; }
        setTimeout(()=>location.assign("index.html#services"), 800);
      } catch (e) {
        if (msg) { msg.style.color = "var(--danger)"; msg.textContent = e.message; }
      }
    });
  }

  // Login
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = (document.getElementById("login-email")?.value || "").trim();
      const pass = document.getElementById("login-password")?.value || "";
      const msg = document.getElementById("login-msg");
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        if (msg) { msg.style.color = "var(--success)"; msg.textContent = "Login successful!"; }
        setTimeout(()=>location.assign("index.html#services"), 600);
      } catch (e) {
        if (msg) { msg.style.color = "var(--danger)"; msg.textContent = e.message; }
      }
    });
  }
}

// ======= Contact form (contact.html) =======
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const nameEl = document.getElementById("contact-name");
  const emailEl = document.getElementById("contact-email");
  const phoneEl = document.getElementById("contact-phone");
  const msgEl = document.getElementById("contact-message");
  const status = document.getElementById("contact-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "messages"), {
        name: nameEl?.value || "",
        email: emailEl?.value || "",
        phone: phoneEl?.value || "",
        message: msgEl?.value || "",
        createdAt: serverTimestamp()
      });
      if (status) { status.style.color = "var(--success)"; status.textContent = "Message sent! We’ll get back ASAP."; }
      form.reset();
    } catch (e2) {
      if (status) { status.style.color = "var(--danger)"; status.textContent = e2.message; }
    }
  });
}

// ======= Admin (admin.html) =======
async function loadAdmin() {
  // Tables
  const usersTBody = document.querySelector("#users-table tbody");
  const bookingsTBody = document.querySelector("#bookings-table tbody");
  const refreshUsers = document.getElementById("refresh-users");
  const refreshBookings = document.getElementById("refresh-bookings");

  const paintUsers = async () => {
    if (!usersTBody) return;
    usersTBody.innerHTML = "";
    const snap = await getDocs(collection(db, "users"));
    snap.forEach(docu => {
      const u = docu.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(u.name || "")}</td>
        <td>${escapeHtml(u.email || "")}</td>
        <td>${u.points ?? 0}</td>
        <td>${docu.id}</td>
        <td class="row-actions">
          <button class="btn tiny" data-addpoints="${docu.id}">+10 pts</button>
        </td>`;
      usersTBody.appendChild(tr);
    });

    // actions
    usersTBody.querySelectorAll("[data-addpoints]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const uid = btn.getAttribute("data-addpoints");
        await updateDoc(doc(db,"users",uid), { points: increment(10) });
        await paintUsers();
      });
    });
  };

  const paintBookings = () => {
    if (!bookingsTBody) return;
    bookingsTBody.innerHTML = "";
    const q = query(collection(db, "bookings"), orderBy("createdAt","desc"));
    onSnapshot(q, async (snap) => {
      bookingsTBody.innerHTML = "";
      for (const d of snap.docs) {
        const b = d.data();
        // try get user email
        let email = "";
        if (b.uid) {
          const usnap = await getDoc(doc(db,"users", String(b.uid)));
          email = usnap.exists() ? (usnap.data().email || "") : "";
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(b.service || "")}</td>
          <td>${escapeHtml(b.price || "")}</td>
          <td>${escapeHtml(b.uid || "")}</td>
          <td>${escapeHtml(email)}</td>
          <td>${formatTimestamp(b.createdAt)}</td>`;
        bookingsTBody.appendChild(tr);
      }
    });
  };

  await paintUsers();
  paintBookings();

  if (refreshUsers) refreshUsers.addEventListener("click", paintUsers);
  if (refreshBookings) refreshBookings.addEventListener("click", paintBookings);
}

// ======= Utilities =======
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function formatTimestamp(ts){
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

// ======= Init per-page =======
document.addEventListener("DOMContentLoaded", ()=>{
  initServiceToggles();
  initBooking();
  initAuthForms();
  initContactForm();
});

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDZ0VGdu2CoK5YY7d3__drDy8OW_bAkfCM",
  authDomain: "titan-company.firebaseapp.com",
  projectId: "titan-company",
  storageBucket: "titan-company.firebasestorage.app",
  messagingSenderId: "993876361774",
  appId: "1:993876361774:web:b39b768c2a9054c9d2d5bf",
  measurementId: "G-QY2XM9Y08Y"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Account created successfully!");
        window.location.href = "dashboard.html";
      })
      .catch(err => alert(err.message));
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      })
      .catch(err => alert(err.message));
  });
}

// Logout
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logged out successfully.");
      window.location.href = "login.html";
    });
  });
}

// Protect dashboard
onAuthStateChanged(auth, (user) => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (!user) {
      window.location.href = "login.html";
    }
  }
});
