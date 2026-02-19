// --- State ---
const state = {
  user: null,
  theme: "academic",
  orientation: "landscape",
  currentView: "create",
  authMode: "login",
  certificates: [],
  bulkCertificates: [],
  data: {
    recipient: "",
    course: "",
    issuer: "",
    date: new Date().toLocaleDateString(),
    id: "",
    logo: "default-logo.ico",
  },
};

const defaultLogo = "default-logo.ico";

// Shared preview area element (moved between views)
let previewArea = null;

// Detect current page
const isDashboardPage = window.location.pathname.includes("dashboard.html");

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  previewArea = document.getElementById("preview-area");

  // Only run dashboard-specific initialization on dashboard page
  if (isDashboardPage) {
    generateId();
    const today = new Date().toLocaleDateString();
    state.data.date = today;
    const dateInput = document.getElementById("input-date");
    if (dateInput) dateInput.value = today;
    renderCertificate();
    lucide.createIcons();
    handleResize();
    window.addEventListener("resize", handleResize);

    // Initialize dynamic theme lists
    initThemeLists();
  }

  // Initialize new design features (runs on both pages)
  initializeNewDesign();
});

// --- View Logic ---
function switchView(viewId) {
  state.currentView = viewId;

  // 1. Navigation Styling
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    if (btn.id === `nav-${viewId}`) {
      btn.classList.add("border-indigo-600", "text-indigo-600");
      btn.classList.remove("text-gray-500", "border-transparent");
    } else {
      btn.classList.remove("border-indigo-600", "text-indigo-600");
      btn.classList.add("text-gray-500", "border-transparent");
    }
  });

  // 2. View Switching
  document.querySelectorAll(".section-view").forEach((view) => {
    view.classList.remove("active");
  });
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add("active");

  // 3. Preview Docking Logic
  if (["create", "bulk", "validate"].includes(viewId)) {
    // Attach shared preview area to the active view
    if (target && previewArea) {
      target.appendChild(previewArea);
      previewArea.classList.remove("hidden");
    }

    const certContainer = document.getElementById("certificate-container");
    if (certContainer) {
      if (viewId === "validate") {
        // Hide certificate until a valid ID is verified
        certContainer.style.opacity = "0";
      } else if (viewId === "bulk") {
        // Dimmed until a CSV is uploaded
        certContainer.style.opacity = "0.4";
      } else {
        // Create view — always fully visible
        certContainer.style.opacity = "1";
      }
    }

    // Recalculate layout after DOM move
    setTimeout(() => {
      handleResize();
      renderCertificate();
    }, 50);
  } else {
    // List / Settings — detach/hide the preview
    if (previewArea) {
      previewArea.classList.add("hidden");
    }
  }

  // Fetch data for list view
  if (viewId === "list") {
    fetchUserCertificates();
  }

  // Initialize settings logo preview when settings view is loaded
  if (viewId === "settings") {
    initializeSettingsLogoPreview();
  }

  lucide.createIcons();
}

// --- Firebase Firestore Functions ---

/**
 * Fetch all certificates issued by the current user
 */
async function fetchUserCertificates() {
  if (!state.user) return;

  const listContainer = document.getElementById("cert-list-body");
  listContainer.innerHTML = `
    <tr>
      <td colspan="5" class="px-6 py-12 text-center">
        <div class="flex flex-col items-center gap-2 text-gray-400">
          <i data-lucide="loader" class="animate-spin h-8 w-8 text-indigo-500"></i>
          <span class="text-sm">Loading certificates...</span>
        </div>
      </td>
    </tr>
  `;
  lucide.createIcons();

  try {
    const q = window.firestoreQuery(
      window.firestoreCollection(window.firebaseDB, "certificates"),
      window.firestoreWhere("issuedByEmail", "==", state.user.email),
      window.firestoreOrderBy("createdAt", "desc"),
    );

    const querySnapshot = await window.firestoreGetDocs(q);
    state.certificates = [];

    querySnapshot.forEach((doc) => {
      state.certificates.push({ docId: doc.id, ...doc.data() });
    });

    renderCertificateList();
  } catch (error) {
    console.error("Error fetching certificates:", error);
    listContainer.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-red-500">
          <p class="text-sm">Error loading certificates. Please try again.</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Render the certificate list in the UI
 */
function renderCertificateList() {
  const listContainer = document.getElementById("cert-list-body");

  if (state.certificates.length === 0) {
    listContainer.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="file-text" class="h-12 w-12 opacity-30"></i>
            <p class="text-base">No certificates issued yet</p>
            <button onclick="switchView('create')" class="text-sm text-indigo-600 hover:underline font-medium">
              Create your first certificate →
            </button>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  listContainer.innerHTML = state.certificates
    .map(
      (cert) => `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 font-medium">${cert.recipient}</td>
      <td class="px-6 py-4 text-gray-600">${cert.course}</td>
      <td class="px-6 py-4 text-gray-500">${cert.date}</td>
      <td class="px-6 py-4 text-xs font-mono text-gray-400">${cert.id}</td>
      <td class="px-6 py-4 text-right">
        <button
          onclick="openDownloadModal({recipient: '${cert.recipient}', course: '${cert.course}', id: '${cert.id}', date: '${cert.date}', issuer: '${cert.issuer}'})"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-end gap-1 ml-auto"
        >
          <i data-lucide="download" class="h-4 w-4"></i> Download
        </button>
      </td>
    </tr>
  `,
    )
    .join("");

  lucide.createIcons();
}

/**
 * Load a saved certificate into the editor/preview and navigate to create view
 */
function viewCertificate(certId) {
  const cert = state.certificates.find((c) => c.id === certId);
  if (!cert) return;

  state.data.recipient = cert.recipient;
  state.data.course = cert.course;
  state.data.issuer = cert.issuer;
  state.data.date = cert.date;
  state.data.id = cert.id;

  if (document.getElementById("input-recipient")) {
    document.getElementById("input-recipient").value = cert.recipient;
  }
  if (document.getElementById("input-course")) {
    document.getElementById("input-course").value = cert.course;
  }
  if (document.getElementById("input-id")) {
    document.getElementById("input-id").value = cert.id;
  }

  switchView("create");
  setTimeout(() => window.print(), 300);
}

/**
 * Save a new certificate to Firestore
 */
async function handleSaveCertificate() {
  if (!state.user) {
    alert("You must be logged in to save certificates");
    return;
  }

  if (!state.data.recipient || !state.data.course) {
    alert("Please fill in recipient name and course name");
    return;
  }

  const saveBtn = document.querySelector(
    "#view-create button[onclick*='handleSaveCertificate']",
  );
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<i data-lucide="loader" class="animate-spin h-4 w-4 inline"></i> Saving...';
    lucide.createIcons();
  }

  try {
    const certificateData = {
      id: state.data.id,
      recipient: state.data.recipient,
      course: state.data.course,
      issuer: state.data.issuer || state.user.company,
      date: state.data.date,
      issuedByEmail: state.user.email,
      createdAt: window.firestoreTimestamp(),
      updatedAt: window.firestoreTimestamp(),
    };

    await window.firestoreSetDoc(
      window.firestoreDoc(window.firebaseDB, "certificates", state.data.id),
      certificateData,
    );

    alert("✅ Certificate saved successfully!");

    // Generate new ID for the next certificate
    generateId();

    // Clear input fields
    state.data.recipient = "";
    state.data.course = "";
    if (document.getElementById("input-recipient")) {
      document.getElementById("input-recipient").value = "";
    }
    if (document.getElementById("input-course")) {
      document.getElementById("input-course").value = "";
    }
    renderCertificate();
  } catch (error) {
    console.error("Error saving certificate:", error);
    alert("❌ Error saving certificate. Please try again.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML =
        '<i data-lucide="save" class="h-4 w-4"></i> Save Record';
      lucide.createIcons();
    }
  }
}

/**
 * Validate a certificate by ID against Firestore
 */
async function handleValidateCert(id, isPublic = false) {
  if (!id) {
    id = document.getElementById("validate-id").value.trim().toUpperCase();
  }

  const resultBox = isPublic
    ? document.getElementById("verify-result-public")
    : document.getElementById("verify-result");
  const certContainer = document.getElementById("certificate-container");

  // Get current language
  const lang = typeof currentLang !== "undefined" ? currentLang : "en";

  // Language strings
  const strings = {
    en: {
      enterId: "Please enter a certificate ID",
      validating: "Validating certificate...",
      validCert: "✓ Valid Certificate",
      issuedTo: "Issued to",
      course: "Course",
      issuedBy: "Issued by",
      on: "on",
      notFound: "✗ Record Not Found",
      notFoundMsg: `The ID <strong>"${id}"</strong> does not match any issued certificate.`,
      fakeWarning:
        "This certificate may be fake or the ID was entered incorrectly.",
      connectionError: "Connection Error",
      connectionErrorMsg:
        "Unable to reach the database. Please check your connection and try again.",
    },
    es: {
      enterId: "Por favor ingresa un ID de certificado",
      validating: "Validando certificado...",
      validCert: "✓ Certificado Válido",
      issuedTo: "Emitido a",
      course: "Curso",
      issuedBy: "Emitido por",
      on: "el",
      notFound: "✗ Registro No Encontrado",
      notFoundMsg: `El ID <strong>"${id}"</strong> no coincide con ningún certificado emitido.`,
      fakeWarning:
        "Este certificado puede ser falso o el ID fue ingresado incorrectamente.",
      connectionError: "Error de Conexión",
      connectionErrorMsg:
        "No se puede conectar a la base de datos. Verifica tu conexión e intenta nuevamente.",
    },
  };

  const t = strings[lang] || strings.en;

  if (!id) {
    alert(t.enterId);
    return;
  }

  resultBox.classList.remove("hidden");
  resultBox.className =
    "mt-6 p-4 rounded-lg text-sm border-l-4 border-gray-300 bg-gray-50 text-gray-600 fade-in";
  resultBox.innerHTML = `
    <div class="flex items-center gap-2">
      <i data-lucide="loader" class="animate-spin h-4 w-4"></i>
      <span>${t.validating}</span>
    </div>
  `;
  lucide.createIcons();

  try {
    const certDoc = await window.firestoreGetDoc(
      window.firestoreDoc(window.firebaseDB, "certificates", id),
    );

    if (certDoc.exists()) {
      const cert = certDoc.data();

      resultBox.className =
        "mt-6 p-4 rounded-lg text-sm border-l-4 border-green-500 bg-green-50 text-green-700 fade-in";
      resultBox.innerHTML = `
        <p class="font-bold mb-1">${t.validCert}</p>
        <p>${t.issuedTo} <strong>${cert.recipient}</strong></p>
        <p>${t.course}: ${cert.course}</p>
        <p class="text-green-600 text-xs mt-1">${t.issuedBy} ${cert.issuer} ${t.on} ${cert.date}</p>
      `;

      // Load certificate data and reveal preview
      state.data.recipient = cert.recipient;
      state.data.course = cert.course;
      state.data.issuer = cert.issuer;
      state.data.date = cert.date;
      state.data.id = cert.id;

      if (certContainer) certContainer.style.opacity = "1";
      renderCertificate();
    } else {
      resultBox.className =
        "mt-6 p-4 rounded-lg text-sm border-l-4 border-red-500 bg-red-50 text-red-700 fade-in";
      resultBox.innerHTML = `
        <p class="font-bold mb-1">${t.notFound}</p>
        <p>${t.notFoundMsg}</p>
        <p class="text-red-500 text-xs mt-1">${t.fakeWarning}</p>
      `;
      if (certContainer) certContainer.style.opacity = "0";
    }
  } catch (error) {
    console.error("Error validating certificate:", error);
    resultBox.className =
      "mt-6 p-4 rounded-lg text-sm border-l-4 border-amber-500 bg-amber-50 text-amber-700 fade-in";
    resultBox.innerHTML = `
      <p class="font-bold mb-1">${t.connectionError}</p>
      <p>${t.connectionErrorMsg}</p>
    `;
  }

  lucide.createIcons();
}

/**
 * Update user profile settings
 */
async function handleSaveSettings(e) {
  e.preventDefault();

  if (!state.user) return;

  const firstName = document.getElementById("set-fname").value;
  const lastName = document.getElementById("set-lname").value;
  const company = document.getElementById("set-company").value;
  const logoUrl = document.getElementById("set-logo").value;

  const saveBtn = e.target.querySelector("button[type='submit']");
  saveBtn.disabled = true;
  saveBtn.innerHTML =
    '<i data-lucide="loader" class="animate-spin h-4 w-4 inline mr-1"></i> Saving...';
  lucide.createIcons();

  try {
    await window.firestoreUpdateDoc(
      window.firestoreDoc(window.firebaseDB, "users", state.user.uid),
      {
        firstName,
        lastName,
        company,
        logoUrl: logoUrl || "",
        updatedAt: window.firestoreTimestamp(),
      },
    );

    // Update local state
    state.user.firstName = firstName;
    state.user.lastName = lastName;
    state.user.name = `${firstName} ${lastName}`;
    state.user.company = company;
    state.user.logoUrl = logoUrl;
    state.data.issuer = company;
    state.data.logo = logoUrl || defaultLogo;

    document.getElementById("user-display").innerText =
      `${firstName} ${lastName}`;

    alert("✅ Profile settings updated successfully!");
    renderCertificate();
  } catch (error) {
    console.error("Error updating settings:", error);
    alert("❌ Error updating settings. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Update Profile";
    lucide.createIcons();
  }
}

/**
 * Delete user account and all associated data
 */
async function handleDeleteUser() {
  if (!state.user) return;

  const confirmed = confirm(
    "Are you sure you want to delete your account? Your certificates will remain available for public validation.",
  );

  if (!confirmed) return;

  const deleteBtn = document.querySelector(
    'button[onclick="handleDeleteUser()"]',
  );

  deleteBtn.disabled = true;
  deleteBtn.innerText = "Deleting...";
  lucide.createIcons();

  try {
    const userDoc = window.firestoreDoc(
      window.firebaseDB,
      "users",
      state.user.uid,
    );
    await window.firestoreDeleteDoc(userDoc);
    await window.firebaseDeleteUser(window.firebaseAuth.currentUser);
    alert("✅ Account deleted successfully!");

    // Clear local state and redirect to index
    state.user = null;
    state.certificates = [];
    state.bulkCertificates = [];

    // Redirect to index page
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error deleting user:", error);

    // Handle specific error cases
    if (error.code === "auth/requires-recent-login") {
      alert(
        "❌ For security reasons, you need to sign in again to delete your account. Please sign out and sign back in, then try again.",
      );
    } else {
      alert("❌ Error deleting account. Please try again.");
    }
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.innerText = "Delete Account";
    lucide.createIcons();
  }
}

/**
 * Initialize logo preview functionality for settings modal
 */
function initializeSettingsLogoPreview() {
  const logoInput = document.getElementById("set-logo");

  if (logoInput) {
    // Create preview element if it doesn't exist
    let logoPreview = document.getElementById("settings-logo-preview");
    if (!logoPreview) {
      logoPreview = document.createElement("div");
      logoPreview.id = "settings-logo-preview";
      logoPreview.className =
        "hidden mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200";
      logoPreview.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-2">Logo Preview</label>
        <div class="flex items-center gap-4">
          <img id="settings-logo-preview-img" src="" alt="Logo Preview" class="h-16 w-16 object-contain" />
          <div class="text-sm text-gray-500">
            <p>Logo will appear on certificates</p>
            <p class="mt-1">Recommended: PNG, SVG, or transparent background</p>
          </div>
        </div>
      `;

      // Insert preview after the logo input
      logoInput.parentNode.insertBefore(logoPreview, logoInput.nextSibling);
    }

    const logoPreviewImg = document.getElementById("settings-logo-preview-img");

    logoInput.addEventListener("input", () => {
      const url = logoInput.value.trim();
      if (url) {
        logoPreview.classList.remove("hidden");
        logoPreviewImg.src = url;
        logoPreviewImg.onerror = () => {
          logoPreviewImg.src = "default-logo.ico";
        };
      } else {
        logoPreview.classList.add("hidden");
      }
    });
  }
}

/**
 * Bulk upload — parse CSV and show preview of first record
 */
function handleBulkUpload() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split("\n");
      state.bulkCertificates = [];

      // Skip header row, parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [recipient, course, date] = line.split(",").map((s) => s.trim());
        if (recipient && course) {
          state.bulkCertificates.push({
            recipient,
            course,
            date: date || new Date().toLocaleDateString(),
          });
        }
      }

      const count = state.bulkCertificates.length;
      const statsEl = document.getElementById("bulk-stats");
      const countEl = document.getElementById("bulk-count-text");

      if (statsEl) statsEl.classList.remove("hidden");
      if (countEl)
        countEl.textContent = `Found ${count} record${count !== 1 ? "s" : ""}.`;

      // Preview first record
      if (count > 0) {
        const first = state.bulkCertificates[0];
        state.data.recipient = first.recipient;
        state.data.course = first.course;
        state.data.date = first.date;
        state.data.id = "CERT-BULK-PREVIEW";

        const certContainer = document.getElementById("certificate-container");
        if (certContainer) certContainer.style.opacity = "1";
        renderCertificate();

        console.log(
          `✅ Parsed ${count} certificates. Showing preview of row #1.`,
        );
      }

      lucide.createIcons();
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

/**
 * Bulk generate — save all parsed CSV records to Firestore
 */
async function handleBulkGenerate() {
  if (!state.user) {
    alert("You must be logged in to generate certificates");
    return;
  }

  if (state.bulkCertificates.length === 0) {
    alert("No records to generate. Please upload a CSV first.");
    return;
  }

  const confirmed = confirm(
    `This will create ${state.bulkCertificates.length} certificates. Continue?`,
  );
  if (!confirmed) return;

  let saved = 0;
  let errors = 0;

  for (const cert of state.bulkCertificates) {
    try {
      const newId =
        "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      await window.firestoreSetDoc(
        window.firestoreDoc(window.firebaseDB, "certificates", newId),
        {
          id: newId,
          recipient: cert.recipient,
          course: cert.course,
          issuer: state.data.issuer || state.user.company,
          date: cert.date,
          issuedByEmail: state.user.email,
          createdAt: window.firestoreTimestamp(),
          updatedAt: window.firestoreTimestamp(),
        },
      );
      saved++;
    } catch (err) {
      console.error("Error saving bulk cert:", err);
      errors++;
    }
  }

  alert(
    `✅ Done! ${saved} certificate${saved !== 1 ? "s" : ""} saved.${errors > 0 ? ` ⚠️ ${errors} failed.` : ""}`,
  );
  state.bulkCertificates = [];

  const statsEl = document.getElementById("bulk-stats");
  if (statsEl) statsEl.classList.add("hidden");
}

/**
 * Download sample CSV template
 */
function downloadSampleCSV() {
  const today = new Date();
  const dates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d.toLocaleDateString();
  });

  const csvContent = [
    "recipient,course,date",
    `John Smith,Web Development Fundamentals,${dates[0]}`,
    `Sarah Johnson,Advanced JavaScript,${dates[1]}`,
    `Michael Brown,React Native Development,${dates[2]}`,
    `Emily Davis,Python for Data Science,${dates[3]}`,
    `David Wilson,Cloud Computing Essentials,${dates[4]}`,
    `Jessica Martinez,Cybersecurity Basics,${dates[5]}`,
    `James Anderson,Mobile App Design,${dates[6]}`,
    `Jennifer Taylor,Database Management,${dates[7]}`,
    `Robert Thomas,Machine Learning Fundamentals,${dates[8]}`,
    `Linda Garcia,Digital Marketing Strategy,${dates[9]}`,
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "certificate_template.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

// --- Auth System ---
function openAuth(mode = "login") {
  toggleAuthMode(mode);
  document.getElementById("auth-modal").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("auth-card").classList.remove("scale-95");
  }, 10);
}

function closeAuth() {
  document.getElementById("auth-card").classList.add("scale-95");
  setTimeout(() => {
    document.getElementById("auth-modal").classList.add("hidden");
    clearAuthMessages();
  }, 200);
}

function clearAuthMessages() {
  const errEl = document.getElementById("auth-error");
  const sucEl = document.getElementById("auth-success");
  if (errEl) errEl.classList.add("hidden");
  if (sucEl) sucEl.classList.add("hidden");
}

function toggleAuthMode(mode) {
  state.authMode = mode;
  clearAuthMessages();

  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("register-form");
  const forgotForm = document.getElementById("forgot-form");

  [loginForm, regForm, forgotForm].forEach((f) => {
    if (f) f.classList.add("auth-hidden");
  });

  if (mode === "login") {
    if (title) title.innerText = "Sign In";
    if (subtitle) subtitle.innerText = "Access your certificate dashboard";
    if (loginForm) loginForm.classList.remove("auth-hidden");
  } else if (mode === "register") {
    if (title) title.innerText = "Create Account";
    if (subtitle) subtitle.innerText = "Start generating professional certs";
    if (regForm) regForm.classList.remove("auth-hidden");

    // Add event listener for logo URL preview
    const logoInput = document.getElementById("reg-logo");
    const logoPreview = document.getElementById("reg-logo-preview");
    const logoPreviewImg = document.getElementById("reg-logo-preview-img");

    if (logoInput && logoPreview && logoPreviewImg) {
      logoInput.addEventListener("input", () => {
        const url = logoInput.value.trim();
        if (url) {
          logoPreview.classList.remove("hidden");
          logoPreviewImg.src = url;
          logoPreviewImg.onerror = () => {
            logoPreviewImg.src = "default-logo.ico";
          };
        } else {
          logoPreview.classList.add("hidden");
        }
      });
    }
  } else if (mode === "forgot") {
    if (title) title.innerText = "Reset Password";
    if (subtitle) subtitle.innerText = "We'll help you get back in";
    if (forgotForm) forgotForm.classList.remove("auth-hidden");
  }

  lucide.createIcons();
}

async function handleAuthAction(e, type) {
  e.preventDefault();
  clearAuthMessages();

  const submitBtn = e.target.querySelector(".auth-submit-btn");
  const originalBtnHtml = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i data-lucide="loader" class="animate-spin h-4 w-4 inline mr-1"></i> Processing...`;
  lucide.createIcons();

  try {
    if (type === "login") {
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-pass").value;

      const userCredential = await window.firebaseSignIn(
        window.firebaseAuth,
        email,
        pass,
      );

      const userDoc = await window.firestoreGetDoc(
        window.firestoreDoc(
          window.firebaseDB,
          "users",
          userCredential.user.uid,
        ),
      );
      const userData = userDoc.data();

      completeLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        name: userData
          ? `${userData.firstName} ${userData.lastName}`
          : email.split("@")[0],
        company: userData?.company || "",
        logoUrl: userData?.logoUrl || "",
      });
    } else if (type === "register") {
      const email = document.getElementById("reg-email").value;
      const pass = document.getElementById("reg-pass").value;
      const fname = document.getElementById("reg-fname").value;
      const lname = document.getElementById("reg-lname").value;
      const company = document.getElementById("reg-company").value;
      const logoUrl = document.getElementById("reg-logo").value;

      if (pass.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Set registering flag to prevent premature redirect by onAuthStateChanged
      if (window.setRegisteringFlag) {
        window.setRegisteringFlag(true);
      }

      const userCredential = await window.firebaseSignUp(
        window.firebaseAuth,
        email,
        pass,
      );

      // Create user document in Firestore
      await window.firestoreSetDoc(
        window.firestoreDoc(
          window.firebaseDB,
          "users",
          userCredential.user.uid,
        ),
        {
          email,
          firstName: fname,
          lastName: lname,
          company: company || "",
          logoUrl: logoUrl || "",
          createdAt: window.firestoreTimestamp(),
          updatedAt: window.firestoreTimestamp(),
        },
      );

      // Clear registering flag - Firestore document is now created
      if (window.setRegisteringFlag) {
        window.setRegisteringFlag(false);
      }

      const successTextEl = document.getElementById("auth-success-text");
      const successEl = document.getElementById("auth-success");
      if (successTextEl) {
        successTextEl.innerText = `Account created for ${fname} ${lname}! You can now sign in.`;
      }
      if (successEl) successEl.classList.remove("hidden");

      // Clear form
      [
        "reg-email",
        "reg-pass",
        "reg-fname",
        "reg-lname",
        "reg-company",
        "reg-logo",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      setTimeout(() => toggleAuthMode("login"), 2000);
    } else if (type === "forgot") {
      const email = document.getElementById("forgot-email").value;

      if (!email) {
        throw new Error("Please enter your email address");
      }

      await window.firebaseResetPassword(window.firebaseAuth, email);

      const successTextEl = document.getElementById("auth-success-text");
      const successEl = document.getElementById("auth-success");
      if (successTextEl)
        successTextEl.innerText = "Reset link sent to your email!";
      if (successEl) successEl.classList.remove("hidden");

      const forgotEmailEl = document.getElementById("forgot-email");
      if (forgotEmailEl) forgotEmailEl.value = "";
    }
  } catch (err) {
    // Clear registering flag on error
    if (window.setRegisteringFlag) {
      window.setRegisteringFlag(false);
    }

    let errorMessage = err.message;

    const errorMap = {
      "auth/invalid-email": "Invalid email address format",
      "auth/user-disabled": "This account has been disabled",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/invalid-credential": "Invalid email or password",
      "auth/email-already-in-use": "Email already registered",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/too-many-requests": "Too many attempts. Please try again later",
      "auth/network-request-failed": "Network error. Check your connection",
    };

    if (err.code && errorMap[err.code]) {
      errorMessage = errorMap[err.code];
    }

    const errTextEl = document.getElementById("auth-error-text");
    const errEl = document.getElementById("auth-error");
    if (errTextEl) errTextEl.innerText = errorMessage;
    if (errEl) errEl.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    lucide.createIcons();
  }
}

function completeLogin(userData) {
  state.user = userData;
  state.data.issuer = userData.company;
  state.data.logo = userData.logoUrl || defaultLogo;

  // If on index.html (landing page), redirect to dashboard
  if (!isDashboardPage) {
    window.location.href = "dashboard.html";
    return;
  }

  // Update header display (dashboard page only)
  const userDisplayEl = document.getElementById("user-display");
  if (userDisplayEl) {
    userDisplayEl.innerText = userData.name;
    userDisplayEl.classList.remove("hidden");
  }

  // Populate settings form
  const fields = {
    "set-fname": userData.firstName,
    "set-lname": userData.lastName,
    "set-email": userData.email,
    "set-company": userData.company,
    "set-logo": userData.logoUrl || "",
  };
  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  // Init: dock preview area into view-create, then switch to create view
  const viewCreate = document.getElementById("view-create");
  if (viewCreate && previewArea) {
    viewCreate.appendChild(previewArea);
  }

  switchView("create");
  setTimeout(handleResize, 100);
}

// Expose completeLogin globally for the Firebase module script
window.completeLogin = completeLogin;

async function logout() {
  try {
    await window.firebaseSignOut(window.firebaseAuth);
    state.user = null;
    state.certificates = [];
    state.bulkCertificates = [];

    state.data = {
      recipient: "",
      course: "",
      issuer: "",
      date: new Date().toLocaleDateString(),
      id: "",
      logo: defaultLogo,
    };

    // Redirect to index page
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// --- Content & Theme Logic ---
function generateId() {
  state.data.id =
    "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const inputId = document.getElementById("input-id");
  if (inputId) inputId.value = state.data.id;
  renderCertificate();
}

function updateData(key, value) {
  state.data[key] = value || "";
  renderCertificate();
}

function setTheme(themeName) {
  state.theme = themeName;
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    const isSelected = btn.dataset.theme === themeName;
    btn.className = isSelected
      ? "theme-btn p-2 rounded-lg border-2 text-xs border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
      : "theme-btn p-2 rounded-lg border-2 text-xs border-gray-100 text-gray-600";
  });

  // Refresh theme lists to update active states
  initThemeLists();

  renderCertificate();
}

function setOrientation(orient) {
  state.orientation = orient;
  const container = document.getElementById("certificate-container");
  const btnL = document.getElementById("btn-landscape");
  const btnP = document.getElementById("btn-portrait");

  if (orient === "landscape") {
    if (btnL) btnL.className = "p-1.5 rounded bg-indigo-100 text-indigo-600";
    if (btnP) btnP.className = "p-1.5 rounded text-gray-400";
    if (container) {
      container.className =
        "bg-white shadow-2xl overflow-hidden relative transition-all duration-300 print-landscape";
    }
  } else {
    if (btnP) btnP.className = "p-1.5 rounded bg-indigo-100 text-indigo-600";
    if (btnL) btnL.className = "p-1.5 rounded text-gray-400";
    if (container) {
      container.className =
        "bg-white shadow-2xl overflow-hidden relative transition-all duration-300 print-portrait";
    }
  }
  handleResize();
}

function handleResize() {
  const container = document.getElementById("certificate-container");
  const scaler = document.getElementById("preview-scaler");
  const main = document.getElementById("preview-area");

  if (!main || !scaler || !container) return;

  const isPortrait = state.orientation === "portrait";
  const w = isPortrait ? 794 : 1123;
  const h = isPortrait ? 1123 : 794;

  container.style.width = w + "px";
  container.style.height = h + "px";

  const scale = Math.min(
    (main.clientWidth - 64) / w,
    (main.clientHeight - 64) / h,
    0.85,
  );

  scaler.style.transform = `scale(${scale})`;
  scaler.style.marginBottom = `-${h * (1 - scale)}px`;
  scaler.style.marginRight = `-${w * (1 - scale)}px`;
}

function showLegal(type) {
  document.getElementById("splash-view").classList.add("hidden");
  document.getElementById("legal-view").classList.remove("hidden");

  const title = document.getElementById("legal-title");
  const content = document.getElementById("legal-content");

  if (type === "privacy") {
    title.innerText = "Privacy Policy";
    content.innerText = `1. Introduction\nWelcome to CertifyPro. We respect your privacy.\n\n2. Data Collection\nWe collect only the information necessary to generate and manage your certificates. All data is stored securely using Firebase.\n\n3. Data Usage\nYour data is used exclusively for certificate generation and is never sold or shared with third parties.\n\n4. Contact\nFor any privacy concerns, please reach out to our support team.`;
  } else {
    title.innerText = "Terms & Conditions";
    content.innerText = `1. Acceptance\nBy using CertifyPro, you agree to generate certificates responsibly and only for legitimate purposes.\n\n2. Usage\nThis platform is intended for professional and educational certificate issuance. Any misuse or fraudulent use is strictly prohibited.\n\n3. Liability\nCertifyPro is not responsible for the misuse of certificates generated on this platform.\n\n4. Changes\nWe reserve the right to update these terms at any time. Continued use constitutes acceptance of the latest terms.`;
  }
}

function hideLegal() {
  document.getElementById("legal-view").classList.add("hidden");
  document.getElementById("splash-view").classList.remove("hidden");
}

// --- Download Modal Logic ---
const THEMES = [
  {
    id: "academic",
    name: "Academic Standard",
    icon: "graduation-cap",
    desc: "Classic & Elegant",
  },
  {
    id: "underwater",
    name: "Deep Blue Corporate",
    icon: "anchor",
    desc: "Modern & Professional",
  },
  {
    id: "programming",
    name: "Tech Terminal",
    icon: "terminal",
    desc: "Dark & Geeky",
  },
];

/**
 * Initialize dynamic theme lists in all views
 */
function initThemeLists() {
  // Initialize modal theme list
  const modalList = document.getElementById("theme-list-container");
  if (modalList) {
    renderThemeList(modalList, "modal");
  }

  // Initialize sidebar theme list
  const sidebarList = document.getElementById("theme-list-sidebar");
  if (sidebarList) {
    renderThemeList(sidebarList, "sidebar");
  }
}

/**
 * Render theme list to a specific container
 */
function renderThemeList(container, context) {
  container.innerHTML = "";

  THEMES.forEach((t) => {
    const isActive = t.id === state.theme;
    const div = document.createElement("div");

    if (context === "modal") {
      // Modal layout: vertical list with larger items
      div.className = `p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isActive ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-white"}`;
      div.onclick = () => selectModalTheme(t.id);
      div.innerHTML = `
        <div class="h-10 w-10 rounded-full ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"} flex items-center justify-center flex-shrink-0">
          <i data-lucide="${t.icon}" class="h-5 w-5"></i>
        </div>
        <div>
          <p class="text-sm font-bold ${isActive ? "text-indigo-900" : "text-gray-700"}">${t.name}</p>
          <p class="text-xs text-gray-500">${t.desc}</p>
        </div>
      `;
    } else {
      // Sidebar layout: grid with smaller buttons
      div.className = `theme-btn p-2 rounded-lg border-2 text-xs ${isActive ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium" : "border-gray-100 text-gray-600"}`;
      div.onclick = () => setTheme(t.id);
      div.innerHTML = t.name;
    }

    container.appendChild(div);
  });

  lucide.createIcons();
}

/**
 * Open the download modal with certificate data
 */
function openDownloadModal(data) {
  // Use provided data or fall back to current editor data
  state.modalData = data || { ...state.data };
  state.modalTheme = state.theme; // Default to current theme

  // Build theme list
  const listContainer = document.getElementById("theme-list-container");
  listContainer.innerHTML = "";

  THEMES.forEach((t) => {
    const isActive = t.id === state.modalTheme;
    const div = document.createElement("div");
    div.className = `p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isActive ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-white"}`;
    div.onclick = () => selectModalTheme(t.id);
    div.innerHTML = `
      <div class="h-10 w-10 rounded-full ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"} flex items-center justify-center flex-shrink-0">
        <i data-lucide="${t.icon}" class="h-5 w-5"></i>
      </div>
      <div>
        <p class="text-sm font-bold ${isActive ? "text-indigo-900" : "text-gray-700"}">${t.name}</p>
        <p class="text-xs text-gray-500">${t.desc}</p>
      </div>
    `;
    listContainer.appendChild(div);
  });

  // Show modal
  document.getElementById("theme-modal").classList.remove("hidden");

  // Render initial preview
  setTimeout(() => {
    renderModalPreview();
    lucide.createIcons();
  }, 50);
}

/**
 * Select a theme for the modal preview
 */
function selectModalTheme(themeId) {
  setTheme(themeId); // Update main theme selection for consistency
  state.modalTheme = themeId;
  openDownloadModal(state.modalData); // Re-render list to update active state
  renderModalPreview();
}

/**
 * Render the modal preview with selected theme and data
 */
function renderModalPreview() {
  const container = document.getElementById("modal-certificate-container");
  const wrapper = document.getElementById("modal-preview-wrapper");

  // Set fixed dimensions for rendering (A4 Landscape)
  const w = 1123;
  const h = 794;
  container.style.width = w + "px";
  container.style.height = h + "px";

  renderCertificateToTarget(container, state.modalData, state.modalTheme);

  // Scale to fit modal preview area
  const parent = wrapper.parentElement;
  const scale = Math.min(
    (parent.clientWidth - 40) / w,
    (parent.clientHeight - 40) / h,
  );

  wrapper.style.width = w + "px";
  wrapper.style.height = h + "px";
  wrapper.style.transform = `scale(${scale})`;
}

/**
 * Close the download modal
 */
function closeThemeModal() {
  document.getElementById("theme-modal").classList.add("hidden");
}

/**
 * Confirm download - apply selected theme and data, then print
 */
function confirmDownload() {
  // Apply selected theme and data to main view temporarily for printing
  const originalTheme = state.theme;
  const originalData = { ...state.data };

  state.theme = state.modalTheme;
  state.data = state.modalData;

  renderCertificate(); // Render main container with modal choice

  // Give browser a moment to repaint before print dialog
  setTimeout(() => {
    window.print();
  }, 100);

  closeThemeModal();
}

/**
 * Render certificate to a specific target container (reusable for modal)
 */
function renderCertificateToTarget(targetElement, data, theme) {
  const d = data;
  const logoSrc = d.logo || defaultLogo;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${d.id}`;

  let template = "";

  if (theme === "academic") {
    template = `
      <div class="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-16 flex flex-col justify-between font-serif relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
        <div class="text-center">
          <img src="${logoSrc}" class="h-20 mx-auto mb-6" onerror="this.src='${defaultLogo}'">
          <div class="text-6xl font-bold text-indigo-900 mb-2">Certificate</div>
          <div class="text-2xl text-indigo-700">of Achievement</div>
        </div>
        <div class="text-center space-y-6">
          <p class="text-lg text-gray-700">This certificate is proudly presented to</p>
          <div class="text-5xl font-bold text-gray-900 font-handwriting">${d.recipient || "Recipient Name"}</div>
          <p class="text-lg text-gray-700">For outstanding performance and completion of</p>
          <div class="text-3xl font-semibold text-indigo-800">${d.course || "Course Name"}</div>
        </div>
        <div class="flex justify-between items-end">
          <div class="text-center flex-1">
            <div class="border-t-2 border-gray-400 w-48 mx-auto mb-2"></div>
            <p class="text-sm text-gray-600">${d.issuer || "Issuer"}</p>
          </div>
          <img src="${qr}" class="h-24 w-24">
          <div class="text-center flex-1">
            <div class="text-2xl font-bold text-gray-900 mb-1">${d.date}</div>
            <p class="text-sm text-gray-600">Date</p>
          </div>
        </div>
        <div class="absolute bottom-4 left-16 text-xs text-gray-400 font-mono">${d.id}</div>
      </div>
    `;
  } else if (theme === "underwater") {
    template = `
      <div class="w-full h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700 p-16 flex flex-col justify-between relative overflow-hidden">
        <div class="absolute inset-0 opacity-20">
          <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-20 w-40 h-40 bg-cyan-200 rounded-full blur-3xl"></div>
        </div>
        <div class="relative z-10 text-center">
          <img src="${logoSrc}" class="h-20 mx-auto mb-6 drop-shadow-lg" onerror="this.src='${defaultLogo}'">
          <div class="text-5xl font-bold text-white drop-shadow-lg">Certificate</div>
          <div class="text-xl text-cyan-100">Of Completion</div>
        </div>
        <div class="relative z-10 text-center space-y-6 bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <p class="text-white text-lg">This acknowledges that</p>
          <div class="text-5xl font-bold text-white font-handwriting drop-shadow">${d.recipient || "Recipient Name"}</div>
          <p class="text-white text-lg">Has successfully completed the course</p>
          <div class="text-3xl font-semibold text-cyan-100">${d.course || "Course Name"}</div>
        </div>
        <div class="relative z-10 flex justify-between items-end text-white">
          <div class="text-center">
            <div class="text-2xl font-bold mb-1">${d.issuer || "Issuer"}</div>
            <p class="text-sm text-cyan-200">Instructor</p>
          </div>
          <img src="${qr}" class="h-24 w-24 bg-white p-2 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold mb-1">${d.date}</div>
            <p class="text-sm text-cyan-200">Date</p>
          </div>
        </div>
        <div class="absolute bottom-4 left-16 text-xs text-white/60 font-mono">${d.id}</div>
      </div>
    `;
  } else if (theme === "programming") {
    template = `
      <div class="w-full h-full bg-gray-900 text-green-400 p-16 flex flex-col justify-between font-mono relative overflow-hidden">
        <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px);"></div>
        <div class="relative z-10">
          <img src="${logoSrc}" class="h-16 mb-4 opacity-80" onerror="this.src='${defaultLogo}'">
          <div class="text-sm text-gray-500 mb-2">// Achievement Certificate</div>
          <div class="text-4xl font-bold text-green-400">class Achievement implements Success</div>
        </div>
        <div class="relative z-10 space-y-4 text-lg">
          <div><span class="text-blue-400">const</span> recipient = <span class="text-yellow-300">"${d.recipient || "Recipient Name"}"</span></div>
          <div><span class="text-blue-400">const</span> achievement = <span class="text-yellow-300">"${d.course || "Course Name"}"</span></div>
          <div class="text-gray-500 text-sm mt-4">// Verified hash</div>
          <div class="text-xs text-gray-600">${d.id}</div>
        </div>
        <div class="relative z-10 flex justify-between items-end">
          <div>
            <div class="text-sm text-gray-500">admin.sign()</div>
            <div class="text-xl text-green-300">${d.issuer || "Issuer"}</div>
          </div>
          <img src="${qr}" class="h-24 w-24 bg-white p-2 rounded">
          <div>
            <div class="text-sm text-gray-500">new Date()</div>
            <div class="text-xl text-green-300">${d.date}</div>
          </div>
        </div>
      </div>
    `;
  }

  targetElement.innerHTML = template;
}

// --- New Design Features ---
function initializeNewDesign() {
  // Set current year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }

  // Initialize Lucide icons
  lucide.createIcons();

  // Add scroll behavior for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Initialize the new public validator functionality
  initializePublicValidator();
}

/**
 * Initialize the public validator section with mock functionality
 */
function initializePublicValidator() {
  // Set up the public validator handler (same as the dashboard validator but for the splash page)
  window.handleVerify = function () {
    const input = document.getElementById("verify-input").value.trim();
    handleValidateCert(input, true);
  };

  // Add scroll helper function
  window.scrollToSection = function (id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
}

// --- Rendering ---
function renderCertificate() {
  const container = document.getElementById("certificate-container");
  if (!container) return;

  const d = state.data;
  const logoSrc = d.logo || defaultLogo;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${d.id}`;

  let template = "";

  if (state.theme === "academic") {
    template = `
      <div class="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-16 flex flex-col justify-between font-serif relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
        <div class="text-center">
          <img src="${logoSrc}" class="h-20 mx-auto mb-6" onerror="this.src='${defaultLogo}'">
          <div class="text-6xl font-bold text-indigo-900 mb-2">Certificate</div>
          <div class="text-2xl text-indigo-700">of Achievement</div>
        </div>
        <div class="text-center space-y-6">
          <p class="text-lg text-gray-700">This certificate is proudly presented to</p>
          <div class="text-5xl font-bold text-gray-900 font-handwriting">${d.recipient || "Recipient Name"}</div>
          <p class="text-lg text-gray-700">For outstanding performance and completion of</p>
          <div class="text-3xl font-semibold text-indigo-800">${d.course || "Course Name"}</div>
        </div>
        <div class="flex justify-between items-end">
          <div class="text-center flex-1">
            <div class="border-t-2 border-gray-400 w-48 mx-auto mb-2"></div>
            <p class="text-sm text-gray-600">${d.issuer || "Issuer"}</p>
          </div>
          <img src="${qr}" class="h-24 w-24">
          <div class="text-center flex-1">
            <div class="text-2xl font-bold text-gray-900 mb-1">${d.date}</div>
            <p class="text-sm text-gray-600">Date</p>
          </div>
        </div>
        <div class="absolute bottom-4 left-16 text-xs text-gray-400 font-mono">${d.id}</div>
      </div>
    `;
  } else if (state.theme === "underwater") {
    template = `
      <div class="w-full h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700 p-16 flex flex-col justify-between relative overflow-hidden">
        <div class="absolute inset-0 opacity-20">
          <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-20 w-40 h-40 bg-cyan-200 rounded-full blur-3xl"></div>
        </div>
        <div class="relative z-10 text-center">
          <img src="${logoSrc}" class="h-20 mx-auto mb-6 drop-shadow-lg" onerror="this.src='${defaultLogo}'">
          <div class="text-5xl font-bold text-white drop-shadow-lg">Certificate</div>
          <div class="text-xl text-cyan-100">Of Completion</div>
        </div>
        <div class="relative z-10 text-center space-y-6 bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <p class="text-white text-lg">This acknowledges that</p>
          <div class="text-5xl font-bold text-white font-handwriting drop-shadow">${d.recipient || "Recipient Name"}</div>
          <p class="text-white text-lg">Has successfully completed the course</p>
          <div class="text-3xl font-semibold text-cyan-100">${d.course || "Course Name"}</div>
        </div>
        <div class="relative z-10 flex justify-between items-end text-white">
          <div class="text-center">
            <div class="text-2xl font-bold mb-1">${d.issuer || "Issuer"}</div>
            <p class="text-sm text-cyan-200">Instructor</p>
          </div>
          <img src="${qr}" class="h-24 w-24 bg-white p-2 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold mb-1">${d.date}</div>
            <p class="text-sm text-cyan-200">Date</p>
          </div>
        </div>
        <div class="absolute bottom-4 left-16 text-xs text-white/60 font-mono">${d.id}</div>
      </div>
    `;
  } else if (state.theme === "programming") {
    template = `
      <div class="w-full h-full bg-gray-900 text-green-400 p-16 flex flex-col justify-between font-mono relative overflow-hidden">
        <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px);"></div>
        <div class="relative z-10">
          <img src="${logoSrc}" class="h-16 mb-4 opacity-80" onerror="this.src='${defaultLogo}'">
          <div class="text-sm text-gray-500 mb-2">// Achievement Certificate</div>
          <div class="text-4xl font-bold text-green-400">class Achievement implements Success</div>
        </div>
        <div class="relative z-10 space-y-4 text-lg">
          <div><span class="text-blue-400">const</span> recipient = <span class="text-yellow-300">"${d.recipient || "Recipient Name"}"</span></div>
          <div><span class="text-blue-400">const</span> achievement = <span class="text-yellow-300">"${d.course || "Course Name"}"</span></div>
          <div class="text-gray-500 text-sm mt-4">// Verified hash</div>
          <div class="text-xs text-gray-600">${d.id}</div>
        </div>
        <div class="relative z-10 flex justify-between items-end">
          <div>
            <div class="text-sm text-gray-500">admin.sign()</div>
            <div class="text-xl text-green-300">${d.issuer || "Issuer"}</div>
          </div>
          <img src="${qr}" class="h-24 w-24 bg-white p-2 rounded">
          <div>
            <div class="text-sm text-gray-500">new Date()</div>
            <div class="text-xl text-green-300">${d.date}</div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = template;
}
