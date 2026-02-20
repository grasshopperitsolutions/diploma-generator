// --- State ---
const state = {
  user: null,
  theme: "academic",
  orientation: "landscape",
  currentView: "create",
  currentLang: "en",
  authMode: "login",
  certificates: [],
  filteredCertificates: [], // For local filtering/sorting
  bulkCertificates: [],
  editingCertificateId: null, // Track if we're editing an existing certificate
  qrScanner: null, // HTML5 QR scanner instance
  searchQuery: "", // Current search query
  sortColumn: null, // Current sort column
  sortDirection: "asc", // 'asc' or 'desc'
  data: {
    recipient: "",
    course: "",
    issuer: "",
    date: new Date().toLocaleDateString(),
    id: "",
    logo: "default-logo.ico",
    skills: [], // Skills selected for this certificate
  },
  newSkillInput: "", // Temporary input for new skill
};

// --- Date Helper Functions ---
/**
 * Convert a date string to YYYY-MM-DD format for date input
 * Accepts various formats like "2/20/2026", "02/20/2026", etc.
 */
function dateToInputFormat(dateStr) {
  if (!dateStr) return "";
  
  // Try to parse the date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date input value (YYYY-MM-DD) to locale date string
 */
function inputToLocaleFormat(inputValue) {
  if (!inputValue) return new Date().toLocaleDateString();
  
  const date = new Date(inputValue + "T00:00:00");
  if (isNaN(date.getTime())) return new Date().toLocaleDateString();
  
  return date.toLocaleDateString();
}

/**
 * Handle date input change from the date picker
 */
function handleDateChange(inputValue) {
  state.data.date = inputToLocaleFormat(inputValue);
  renderCertificate();
}

// Expose globally
window.handleDateChange = handleDateChange;

// --- Language Toggle Function ---
function setLanguage(lang) {
  state.currentLang = lang;

  // Toggle visibility of language-specific elements
  document.querySelectorAll("[data-en]").forEach((el) => {
    el.classList.toggle("hidden", lang !== "en");
  });
  document.querySelectorAll("[data-es]").forEach((el) => {
    el.classList.toggle("hidden", lang !== "es");
  });

  // Update placeholders
  document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
    el.placeholder = lang === "en"
      ? el.getAttribute("data-en-placeholder")
      : el.getAttribute("data-es-placeholder");
  });

  // Update header toggle buttons (dashboard)
  const btnEn = document.getElementById("btn-en");
  const btnEs = document.getElementById("btn-es");

  if (btnEn && btnEs) {
    if (lang === "en") {
      btnEn.className = "px-3 py-1 text-xs font-bold rounded-lg transition-all bg-white shadow-sm text-indigo-600";
      btnEs.className = "px-3 py-1 text-xs font-bold rounded-lg transition-all text-slate-500";
    } else {
      btnEs.className = "px-3 py-1 text-xs font-bold rounded-lg transition-all bg-white shadow-sm text-indigo-600";
      btnEn.className = "px-3 py-1 text-xs font-bold rounded-lg transition-all text-slate-500";
    }
  }

  // Update settings toggle buttons (dashboard)
  const settingsBtnEn = document.getElementById("settings-btn-en");
  const settingsBtnEs = document.getElementById("settings-btn-es");

  if (settingsBtnEn && settingsBtnEs) {
    if (lang === "en") {
      settingsBtnEn.className = "px-4 py-2 text-sm font-bold rounded-lg transition-all bg-white shadow-sm text-indigo-600";
      settingsBtnEs.className = "px-4 py-2 text-sm font-bold rounded-lg transition-all text-slate-500";
    } else {
      settingsBtnEs.className = "px-4 py-2 text-sm font-bold rounded-lg transition-all bg-white shadow-sm text-indigo-600";
      settingsBtnEn.className = "px-4 py-2 text-sm font-bold rounded-lg transition-all text-slate-500";
    }
  }

  // Update index.html toggle buttons (if on index page)
  const indexBtnEn = document.getElementById("lang-en");
  const indexBtnEs = document.getElementById("lang-es");

  if (indexBtnEn && indexBtnEs) {
    if (lang === "en") {
      indexBtnEn.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-white text-indigo-600 shadow-sm";
      indexBtnEs.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-500 hover:text-indigo-600";
    } else {
      indexBtnEs.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-white text-indigo-600 shadow-sm";
      indexBtnEn.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-500 hover:text-indigo-600";
    }
  }

  // Re-initialize icons after language change
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Update list view translations if it has dynamic content
  if (typeof state !== 'undefined' && state.certificates && state.certificates.length > 0) {
    renderCertificateList();
  }
}

// Expose globally
window.setLanguage = setLanguage;

// --- Translation Helper ---
function t(key) {
  const lang = state.currentLang || 'en';
  const translations = {
    en: {
      // List view
      loadingCerts: "Loading certificates...",
      errorLoading: "Error loading certificates. Please try again.",
      noCerts: "No certificates issued yet",
      createFirst: "Create your first certificate →",
      download: "Download",
      // Alerts
      mustBeLoggedIn: "You must be logged in to save certificates",
      fillRequired: "Please fill in recipient name and course name",
      certSaved: "Certificate saved successfully!",
      errorSaving: "Error saving certificate. Please try again.",
      saving: "Saving...",
      saveRecord: "Save Record",
      // Settings
      profileUpdated: "Profile settings updated successfully!",
      errorUpdating: "Error updating settings. Please try again.",
      deleteConfirm: "Are you sure you want to delete your account? Your certificates will remain available for public validation.",
      deleteSuccess: "Account deleted successfully!",
      deleteError: "Error deleting account. Please try again.",
      deleteErrorRelog: "For security reasons, you need to sign in again to delete your account. Please sign out and sign back in, then try again.",
      deleting: "Deleting...",
      deleteAccount: "Delete Account",
      // Bulk
      noRecords: "No records to generate. Please upload a CSV first.",
      bulkConfirm: "This will create {count} certificates. Continue?",
      bulkDone: "Done! {saved} certificate{s} saved.{errors}",
      bulkFailed: "{errors} failed.",
      mustBeLoggedInBulk: "You must be logged in to generate certificates",
      // Themes
      themeAcademic: "Academic Standard",
      themeAcademicDesc: "Classic & Elegant",
      themeUnderwater: "Deep Blue Corporate",
      themeUnderwaterDesc: "Modern & Professional",
      themeProgramming: "Tech Terminal",
      themeProgrammingDesc: "Dark & Geeky",
      // Edit/Delete
      edit: "Edit",
      delete: "Delete",
      editCert: "Edit Certificate",
      deleteCert: "Delete Certificate",
      deleteCertConfirm: "Are you sure you want to delete this certificate? This action cannot be undone.",
      certDeleted: "Certificate deleted successfully!",
      certUpdated: "Certificate updated successfully!",
      errorDeleting: "Error deleting certificate. Please try again.",
      errorUpdating: "Error updating certificate. Please try again.",
      updateRecord: "Update Record",
      cancel: "Cancel",
      creatingNew: "Creating New",
      editingCert: "Editing Certificate",
      // Skills
      skills: "Skills",
      skillsAcquired: "Skills Acquired",
      addSkill: "Add Skill",
      removeSkill: "Remove Skill",
      noSkills: "No skills added yet",
      skillPlaceholder: "Enter a new skill",
      selectSkills: "Select Skills",
      skillsUpdated: "Skills updated successfully!",
      errorSkillsUpdate: "Error updating skills. Please try again.",
      addNewSkill: "Add new skill",
      skillsLabel: "Skills (Optional)",
    },
    es: {
      // List view
      loadingCerts: "Cargando certificados...",
      errorLoading: "Error al cargar certificados. Por favor intenta de nuevo.",
      noCerts: "No hay certificados emitidos",
      createFirst: "Crear tu primer certificado →",
      download: "Descargar",
      // Alerts
      mustBeLoggedIn: "Debes iniciar sesión para guardar certificados",
      fillRequired: "Por favor completa el nombre del destinatario y el curso",
      certSaved: "¡Certificado guardado exitosamente!",
      errorSaving: "Error al guardar el certificado. Por favor intenta de nuevo.",
      saving: "Guardando...",
      saveRecord: "Guardar Registro",
      // Settings
      profileUpdated: "¡Ajustes de perfil actualizados exitosamente!",
      errorUpdating: "Error al actualizar ajustes. Por favor intenta de nuevo.",
      deleteConfirm: "¿Estás seguro de que quieres eliminar tu cuenta? Tus certificados permanecerán disponibles para validación pública.",
      deleteSuccess: "¡Cuenta eliminada exitosamente!",
      deleteError: "Error al eliminar la cuenta. Por favor intenta de nuevo.",
      deleteErrorRelog: "Por razones de seguridad, necesitas iniciar sesión de nuevo para eliminar tu cuenta. Por favor cierra sesión e inicia de nuevo, luego intenta de nuevo.",
      deleting: "Eliminando...",
      deleteAccount: "Eliminar Cuenta",
      // Bulk
      noRecords: "No hay registros para generar. Por favor sube un CSV primero.",
      bulkConfirm: "Esto creará {count} certificados. ¿Continuar?",
      bulkDone: "¡Listo! {saved} certificado{s} guardado{s}.{errors}",
      bulkFailed: "{errors} fallaron.",
      mustBeLoggedInBulk: "Debes iniciar sesión para generar certificados",
      // Themes
      themeAcademic: "Estándar Académico",
      themeAcademicDesc: "Clásico y Elegante",
      themeUnderwater: "Corporativo Azul Profundo",
      themeUnderwaterDesc: "Moderno y Profesional",
      themeProgramming: "Terminal Tech",
      themeProgrammingDesc: "Oscuro y Geek",
      // Edit/Delete
      edit: "Editar",
      delete: "Eliminar",
      editCert: "Editar Certificado",
      deleteCert: "Eliminar Certificado",
      deleteCertConfirm: "¿Estás seguro de que quieres eliminar este certificado? Esta acción no se puede deshacer.",
      certDeleted: "¡Certificado eliminado exitosamente!",
      certUpdated: "¡Certificado actualizado exitosamente!",
      errorDeleting: "Error al eliminar el certificado. Por favor intenta de nuevo.",
      errorUpdating: "Error al actualizar el certificado. Por favor intenta de nuevo.",
      updateRecord: "Actualizar Registro",
      cancel: "Cancelar",
      creatingNew: "Creando Nuevo",
      editingCert: "Editando Certificado",
      // Skills
      skills: "Habilidades",
      skillsAcquired: "Habilidades Adquiridas",
      addSkill: "Agregar Habilidad",
      removeSkill: "Eliminar Habilidad",
      noSkills: "No hay habilidades agregadas",
      skillPlaceholder: "Ingresa una nueva habilidad",
      selectSkills: "Seleccionar Habilidades",
      skillsUpdated: "¡Habilidades actualizadas exitosamente!",
      errorSkillsUpdate: "Error al actualizar habilidades. Por favor intenta de nuevo.",
      addNewSkill: "Agregar nueva habilidad",
      skillsLabel: "Habilidades (Opcional)",
    }
  };
  return translations[lang]?.[key] || translations.en[key] || key;
}

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
    
    // Initialize date with today's date
    const today = new Date();
    state.data.date = today.toLocaleDateString();
    const dateInput = document.getElementById("input-date");
    if (dateInput) {
      // Set the date input to today in YYYY-MM-DD format
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
    }
    
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
          <span class="text-sm">${t('loadingCerts')}</span>
        </div>
      </td>
    </tr>
  `;
  lucide.createIcons();

  try {
    // Try with orderBy first
    let querySnapshot;
    try {
      const q = window.firestoreQuery(
        window.firestoreCollection(window.firebaseDB, "certificates"),
        window.firestoreWhere("issuedByEmail", "==", state.user.email),
        window.firestoreOrderBy("createdAt", "desc"),
      );
      querySnapshot = await window.firestoreGetDocs(q);
    } catch (orderError) {
      // If orderBy fails (missing index), fall back to simple query
      console.warn("OrderBy failed, using simple query:", orderError.message);
      const q = window.firestoreQuery(
        window.firestoreCollection(window.firebaseDB, "certificates"),
        window.firestoreWhere("issuedByEmail", "==", state.user.email),
      );
      querySnapshot = await window.firestoreGetDocs(q);
    }

    state.certificates = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      state.certificates.push({ 
        docId: doc.id, 
        ...data,
        // Store createdAt as a serializable format
        createdAt: data.createdAt || null
      });
    });

    // Sort in memory if we couldn't use orderBy
    state.certificates.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // desc order
    });

    renderCertificateList();
  } catch (error) {
    console.error("Error fetching certificates:", error);
    listContainer.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-red-500">
          <p class="text-sm">${t('errorLoading')}</p>
          <p class="text-xs mt-2 text-gray-400">${error.message}</p>
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

  // Apply filtering and sorting
  applyFiltersAndSort();

  if (state.certificates.length === 0) {
    listContainer.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="file-text" class="h-12 w-12 opacity-30"></i>
            <p class="text-base">${t('noCerts')}</p>
            <button onclick="switchView('create')" class="text-sm text-indigo-600 hover:underline font-medium">
              ${t('createFirst')}
            </button>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // Check if filtered results are empty
  if (state.filteredCertificates.length === 0 && state.searchQuery) {
    listContainer.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="search-x" class="h-12 w-12 opacity-30"></i>
            <p class="text-base">${state.currentLang === 'es' ? 'No se encontraron resultados' : 'No results found'}</p>
            <button onclick="clearCertificateFilters()" class="text-sm text-indigo-600 hover:underline font-medium">
              ${state.currentLang === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
            </button>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  listContainer.innerHTML = state.filteredCertificates
    .map(
      (cert) => `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 font-medium">${cert.recipient}</td>
      <td class="px-6 py-4 text-gray-600">${cert.course}</td>
      <td class="px-6 py-4 text-gray-500">${cert.date}</td>
      <td class="px-6 py-4 text-xs font-mono text-gray-400">${cert.id}</td>
      <td class="px-6 py-4">
        <div class="flex items-center justify-end gap-2">
          <button
            onclick="handleEditCertificate('${cert.id}')"
            class="text-amber-600 hover:text-amber-800 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
            title="${t('edit')}"
          >
            <i data-lucide="pencil" class="h-4 w-4"></i>
            <span data-en>${t('edit')}</span>
            <span data-es class="hidden">${t('edit')}</span>
          </button>
          <button
            onclick="handleDeleteCertificate('${cert.id}')"
            class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            title="${t('delete')}"
          >
            <i data-lucide="trash-2" class="h-4 w-4"></i>
            <span data-en>${t('delete')}</span>
            <span data-es class="hidden">${t('delete')}</span>
          </button>
          <button
            onclick="openDownloadModal({recipient: '${cert.recipient.replace(/'/g, "\\'")}', course: '${cert.course.replace(/'/g, "\\'")}', id: '${cert.id}', date: '${cert.date}', issuer: '${(cert.issuer || '').replace(/'/g, "\\'")}'})"
            class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
            title="${t('download')}"
          >
            <i data-lucide="download" class="h-4 w-4"></i>
            <span data-en>${t('download')}</span>
            <span data-es class="hidden">${t('download')}</span>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  lucide.createIcons();
  updateSortIcons();
}

/**
 * Apply search filter and sort to certificates
 */
function applyFiltersAndSort() {
  // Start with all certificates
  let filtered = [...state.certificates];

  // Apply search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(cert => {
      const recipient = (cert.recipient || '').toLowerCase();
      const course = (cert.course || '').toLowerCase();
      const id = (cert.id || '').toLowerCase();
      
      return recipient.includes(query) || 
             course.includes(query) || 
             id.includes(query);
    });
  }

  // Apply sorting
  if (state.sortColumn) {
    filtered.sort((a, b) => {
      let valA = a[state.sortColumn] || '';
      let valB = b[state.sortColumn] || '';
      
      // Handle string comparison (case-insensitive)
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      
      if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  state.filteredCertificates = filtered;
}

/**
 * Handle search input
 */
function handleCertificateSearch(query) {
  state.searchQuery = query;
  
  // Show/hide clear button
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    if (query.trim() || state.sortColumn) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  
  renderCertificateList();
}

/**
 * Handle column sorting
 */
function handleSort(column) {
  // If clicking the same column, toggle direction
  if (state.sortColumn === column) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortColumn = column;
    state.sortDirection = 'asc';
  }
  
  // Show clear button when sorting is active
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.classList.remove('hidden');
  }
  
  renderCertificateList();
}

/**
 * Clear all filters and sorting
 */
function clearCertificateFilters() {
  state.searchQuery = '';
  state.sortColumn = null;
  state.sortDirection = 'asc';
  
  // Clear search input
  const searchInput = document.getElementById('cert-search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Hide clear button
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.classList.add('hidden');
  }
  
  renderCertificateList();
}

/**
 * Update sort icons to show current sort state
 */
function updateSortIcons() {
  const columns = ['recipient', 'course', 'date', 'id'];
  
  columns.forEach(col => {
    const icon = document.getElementById(`sort-${col}`);
    if (icon) {
      if (state.sortColumn === col) {
        // Show active sort icon
        if (state.sortDirection === 'asc') {
          icon.setAttribute('data-lucide', 'chevron-up');
          icon.classList.add('text-indigo-600');
        } else {
          icon.setAttribute('data-lucide', 'chevron-down');
          icon.classList.add('text-indigo-600');
        }
      } else {
        // Show neutral icon
        icon.setAttribute('data-lucide', 'chevrons-up-down');
        icon.classList.remove('text-indigo-600');
      }
    }
  });
  
  // Re-render icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Expose filter functions globally
window.handleCertificateSearch = handleCertificateSearch;
window.handleSort = handleSort;
window.clearCertificateFilters = clearCertificateFilters;

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
 * Edit a certificate - load it into the editor
 */
function handleEditCertificate(certId) {
  const cert = state.certificates.find((c) => c.id === certId || c.docId === certId);
  if (!cert) return;

  // Set editing state
  state.editingCertificateId = cert.id;

  // Load certificate data into state
  state.data.recipient = cert.recipient;
  state.data.course = cert.course;
  state.data.issuer = cert.issuer;
  state.data.date = cert.date;
  state.data.id = cert.id;
  state.data.skills = cert.skills || [];

  // Update form inputs
  const recipientInput = document.getElementById("input-recipient");
  const courseInput = document.getElementById("input-course");
  const idInput = document.getElementById("input-id");
  const dateInput = document.getElementById("input-date");

  if (recipientInput) recipientInput.value = cert.recipient;
  if (courseInput) courseInput.value = cert.course;
  if (idInput) idInput.value = cert.id;
  if (dateInput) dateInput.value = dateToInputFormat(cert.date);

  // Update save button to show update mode
  updateSaveButtonState();

  // Switch to create view and render
  switchView("create");
  
  // Re-render skills selector to show selected skills from certificate
  renderCertificateSkillsSelector();
  renderCertificate();
}

/**
 * Cancel editing and reset to create new mode
 */
function handleCancelEdit() {
  // Clear editing state
  state.editingCertificateId = null;

  // Clear form
  state.data.recipient = "";
  state.data.course = "";
  state.data.skills = [];
  
  const recipientInput = document.getElementById("input-recipient");
  const courseInput = document.getElementById("input-course");
  const dateInput = document.getElementById("input-date");
  
  if (recipientInput) recipientInput.value = "";
  if (courseInput) courseInput.value = "";

  // Reset date to today
  const today = new Date();
  state.data.date = today.toLocaleDateString();
  if (dateInput) {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  }

  // Generate new ID
  generateId();

  // Update save button
  updateSaveButtonState();
  
  // Re-render skills selector to show cleared state
  renderCertificateSkillsSelector();
  
  // Re-render certificate with reset date
  renderCertificate();
}

/**
 * Update the save button to reflect edit or create mode
 */
function updateSaveButtonState() {
  const saveBtn = document.querySelector(
    "#view-create button[onclick*='handleSaveCertificate']",
  );
  
  if (saveBtn) {
    if (state.editingCertificateId) {
      saveBtn.innerHTML = `
        <i data-lucide="save" class="h-4 w-4"></i>
        <span data-en>${t('updateRecord')}</span>
        <span data-es class="hidden">${t('updateRecord')}</span>
      `;
      saveBtn.className = "w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg mb-2 flex items-center justify-center gap-2 shadow-sm";
      
      // Add cancel button if it doesn't exist
      let cancelBtn = document.getElementById("cancel-edit-btn");
      if (!cancelBtn) {
        cancelBtn = document.createElement("button");
        cancelBtn.id = "cancel-edit-btn";
        cancelBtn.onclick = handleCancelEdit;
        cancelBtn.className = "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg mb-2 flex items-center justify-center gap-2 shadow-sm";
        cancelBtn.innerHTML = `
          <i data-lucide="x" class="h-4 w-4"></i>
          <span data-en>${t('cancel')}</span>
          <span data-es class="hidden">${t('cancel')}</span>
        `;
        saveBtn.parentNode.insertBefore(cancelBtn, saveBtn);
      }
      cancelBtn.classList.remove("hidden");
    } else {
      saveBtn.innerHTML = `
        <i data-lucide="save" class="h-4 w-4"></i>
        <span data-en>${t('saveRecord')}</span>
        <span data-es class="hidden">${t('saveRecord')}</span>
      `;
      saveBtn.className = "w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mb-2 flex items-center justify-center gap-2 shadow-sm";
      
      // Hide cancel button
      const cancelBtn = document.getElementById("cancel-edit-btn");
      if (cancelBtn) {
        cancelBtn.classList.add("hidden");
      }
    }
    lucide.createIcons();
  }
}

/**
 * Delete a certificate from Firestore
 */
async function handleDeleteCertificate(certId) {
  if (!state.user) {
    alert(t('mustBeLoggedIn'));
    return;
  }

  const confirmed = confirm(t('deleteCertConfirm'));
  if (!confirmed) return;

  try {
    // Find the certificate to get its docId
    const cert = state.certificates.find((c) => c.id === certId || c.docId === certId);
    if (!cert) {
      alert(t('errorDeleting'));
      return;
    }

    // Delete from Firestore using the document ID (which is the certificate ID)
    await window.firestoreDeleteDoc(
      window.firestoreDoc(window.firebaseDB, "certificates", cert.id),
    );

    alert(t('certDeleted'));

    // Refresh the list
    fetchUserCertificates();
  } catch (error) {
    console.error("Error deleting certificate:", error);
    alert(t('errorDeleting'));
  }
}

/**
 * Save a new certificate or update existing one
 */
async function handleSaveCertificate() {
  if (!state.user) {
    alert(t('mustBeLoggedIn'));
    return;
  }

  if (!state.data.recipient || !state.data.course) {
    alert(t('fillRequired'));
    return;
  }

  const saveBtn = document.querySelector(
    "#view-create button[onclick*='handleSaveCertificate']",
  );
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      `<i data-lucide="loader" class="animate-spin h-4 w-4 inline"></i> ${t('saving')}`;
    lucide.createIcons();
  }

  try {
    const isEditing = !!state.editingCertificateId;
    
    if (isEditing) {
      // Use updateDoc for edits to preserve existing fields
      await window.firestoreUpdateDoc(
        window.firestoreDoc(window.firebaseDB, "certificates", state.data.id),
        {
          recipient: state.data.recipient,
          course: state.data.course,
          issuer: state.data.issuer || state.user.company,
          date: state.data.date,
          skills: state.data.skills || [],
          updatedAt: window.firestoreTimestamp(),
        },
      );
    } else {
      // Use setDoc for new certificates
      const certificateData = {
        id: state.data.id,
        recipient: state.data.recipient,
        course: state.data.course,
        issuer: state.data.issuer || state.user.company,
        date: state.data.date,
        skills: state.data.skills || [],
        issuedByEmail: state.user.email,
        createdAt: window.firestoreTimestamp(),
        updatedAt: window.firestoreTimestamp(),
      };

      await window.firestoreSetDoc(
        window.firestoreDoc(window.firebaseDB, "certificates", state.data.id),
        certificateData,
      );
    }

    alert(isEditing ? t('certUpdated') : t('certSaved'));

    // Clear editing state
    state.editingCertificateId = null;

    // Generate new ID for the next certificate
    generateId();

    // Clear input fields
    state.data.recipient = "";
    state.data.course = "";
    state.data.skills = [];
    if (document.getElementById("input-recipient")) {
      document.getElementById("input-recipient").value = "";
    }
    if (document.getElementById("input-course")) {
      document.getElementById("input-course").value = "";
    }

    // Update save button back to create mode
    updateSaveButtonState();
    
    // Re-render skills selector to show cleared state
    renderCertificateSkillsSelector();
    renderCertificate();
  } catch (error) {
    console.error("Error saving certificate:", error);
    alert(t('errorSaving'));
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      updateSaveButtonState();
    }
  }
}

/**
 * Validate a certificate by ID against Firestore
 */
async function handleValidateCert(id) {
  if (!id) {
    id = document.getElementById("validate-id").value.trim().toUpperCase();
  }

  const resultBox = !isDashboardPage
    ? document.getElementById("verify-result-public")
    : document.getElementById("verify-result");
  const certContainer = document.getElementById("certificate-container");

  // Get current language
  const lang = state.currentLang || "en";

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
      
      // Build skills display HTML if skills exist
      const certSkills = cert.skills || [];
      const skillsDisplayHtml = certSkills.length > 0 
        ? `<p class="text-green-600 text-xs mt-1"><strong>${lang === 'es' ? 'Habilidades' : 'Skills'}:</strong> ${certSkills.join(', ')}</p>` 
        : '';
      
      // Build skills parameter for download modals (escape the array for passing)
      const skillsParam = certSkills.length > 0 ? encodeURIComponent(JSON.stringify(certSkills)) : '';

      // Build download button HTML based on context (public vs dashboard)
      const downloadBtnHtml = !isDashboardPage ? `
        <button
          onclick="openPublicDownloadModal('${cert.recipient.replace(/'/g, "\\'")}', '${cert.course.replace(/'/g, "\\'")}', '${cert.id}', '${cert.date}', '${(cert.issuer || '').replace(/'/g, "\\'")}', '${skillsParam}')"
          class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <i data-lucide="download" class="h-4 w-4"></i>
          <span>${lang === 'es' ? 'Descargar Certificado' : 'Download Certificate'}</span>
        </button>
      ` : `
        <button
          onclick="openDownloadModal({recipient: '${cert.recipient.replace(/'/g, "\\'")}', course: '${cert.course.replace(/'/g, "\\'")}', id: '${cert.id}', date: '${cert.date}', issuer: '${(cert.issuer || '').replace(/'/g, "\\'")}', skills: '${skillsParam}'})"
          class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <i data-lucide="download" class="h-4 w-4"></i>
          <span>${lang === 'es' ? 'Descargar Certificado' : 'Download Certificate'}</span>
        </button>
      `;

      resultBox.className =
        "mt-6 p-4 rounded-lg text-sm border-l-4 border-green-500 bg-green-50 text-green-700 fade-in";
      resultBox.innerHTML = `
        <p class="font-bold mb-1">${t.validCert}</p>
        <p>${t.issuedTo} <strong>${cert.recipient}</strong></p>
        <p>${t.course}: ${cert.course}</p>
        <p class="text-green-600 text-xs mt-1">${t.issuedBy} ${cert.issuer} ${t.on} ${cert.date}</p>
        ${skillsDisplayHtml}
        ${downloadBtnHtml}
      `;

      // Load certificate data and reveal preview
      state.data.recipient = cert.recipient;
      state.data.course = cert.course;
      state.data.issuer = cert.issuer;
      state.data.date = cert.date;
      state.data.id = cert.id;
      state.data.skills = cert.skills || [];

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
    `<i data-lucide="loader" class="animate-spin h-4 w-4 inline mr-1"></i> ${t('saving')}`;
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

    alert(t('profileUpdated'));
    renderCertificate();
  } catch (error) {
    console.error("Error updating settings:", error);
    alert(t('errorUpdating'));
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

  const confirmed = confirm(t('deleteConfirm'));

  if (!confirmed) return;

  const deleteBtn = document.querySelector(
    'button[onclick="handleDeleteUser()"]',
  );

  deleteBtn.disabled = true;
  deleteBtn.innerText = t('deleting');
  lucide.createIcons();

  try {
    const userDoc = window.firestoreDoc(
      window.firebaseDB,
      "users",
      state.user.uid,
    );
    await window.firestoreDeleteDoc(userDoc);
    await window.firebaseDeleteUser(window.firebaseAuth.currentUser);
    alert(t('deleteSuccess'));

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
      alert(t('deleteErrorRelog'));
    } else {
      alert(t('deleteError'));
    }
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.innerText = t('deleteAccount');
    lucide.createIcons();
  }
}

// --- Skills Management Functions ---

/**
 * Add a new skill to user's skill list
 */
async function handleAddSkill(skill) {
  if (!state.user || !skill || skill.trim() === "") return;
  
  const trimmedSkill = skill.trim();
  
  // Initialize skills array if it doesn't exist
  if (!state.user.skills) {
    state.user.skills = [];
  }
  
  // Check if skill already exists
  if (state.user.skills.includes(trimmedSkill)) {
    return; // Skill already exists
  }
  
  // Add skill locally
  state.user.skills.push(trimmedSkill);
  
  try {
    // Update in Firestore
    await window.firestoreUpdateDoc(
      window.firestoreDoc(window.firebaseDB, "users", state.user.uid),
      {
        skills: state.user.skills,
        updatedAt: window.firestoreTimestamp(),
      },
    );
    
    // Re-render skills UI
    renderSettingsSkillsList();
    renderCertificateSkillsSelector();
    
    return true;
  } catch (error) {
    console.error("Error adding skill:", error);
    // Revert local change
    state.user.skills = state.user.skills.filter(s => s !== trimmedSkill);
    alert(t('errorSkillsUpdate'));
    return false;
  }
}

/**
 * Remove a skill from user's skill list
 */
async function handleRemoveSkill(skill) {
  if (!state.user || !skill) return;
  
  // Initialize skills array if it doesn't exist
  if (!state.user.skills) {
    state.user.skills = [];
  }
  
  // Remove skill locally
  const previousSkills = [...state.user.skills];
  state.user.skills = state.user.skills.filter(s => s !== skill);
  
  try {
    // Update in Firestore
    await window.firestoreUpdateDoc(
      window.firestoreDoc(window.firebaseDB, "users", state.user.uid),
      {
        skills: state.user.skills,
        updatedAt: window.firestoreTimestamp(),
      },
    );
    
    // Also remove from certificate skills if selected
    state.data.skills = state.data.skills.filter(s => s !== skill);
    
    // Re-render skills UI
    renderSettingsSkillsList();
    renderCertificateSkillsSelector();
    renderCertificate();
    
    return true;
  } catch (error) {
    console.error("Error removing skill:", error);
    // Revert local change
    state.user.skills = previousSkills;
    alert(t('errorSkillsUpdate'));
    return false;
  }
}

/**
 * Toggle a skill selection for the current certificate
 */
function toggleCertificateSkill(skill) {
  if (!state.data.skills) {
    state.data.skills = [];
  }
  
  if (state.data.skills.includes(skill)) {
    state.data.skills = state.data.skills.filter(s => s !== skill);
  } else {
    state.data.skills.push(skill);
  }
  
  renderCertificateSkillsSelector();
  renderCertificate();
}

/**
 * Add a new skill directly from certificate creation (also adds to user's list)
 */
async function addNewSkillFromCertificate(skill) {
  if (!skill || skill.trim() === "") return;
  
  const success = await handleAddSkill(skill);
  if (success) {
    // Also select the new skill for the certificate
    if (!state.data.skills) {
      state.data.skills = [];
    }
    state.data.skills.push(skill.trim());
    renderCertificateSkillsSelector();
    renderCertificate();
  }
  
  // Clear the input
  const input = document.getElementById("new-skill-input");
  if (input) input.value = "";
}

/**
 * Render the skills list in settings view
 */
function renderSettingsSkillsList() {
  const container = document.getElementById("settings-skills-list");
  if (!container) return;
  
  const skills = state.user?.skills || [];
  
  if (skills.length === 0) {
    container.innerHTML = `
      <div class="text-gray-400 text-sm italic py-4 text-center">
        <span data-en>${t('noSkills')}</span>
        <span data-es class="hidden">${t('noSkills')}</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = skills.map(skill => `
    <div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
      <span class="text-sm text-gray-700">${skill}</span>
      <button
        onclick="handleRemoveSkill('${skill.replace(/'/g, "\\'")}')"
        class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
        title="${t('removeSkill')}"
      >
        <i data-lucide="x" class="h-4 w-4"></i>
      </button>
    </div>
  `).join("");
  
  lucide.createIcons();
}

/**
 * Render the skills selector in certificate creation view
 */
function renderCertificateSkillsSelector() {
  const container = document.getElementById("certificate-skills-selector");
  if (!container) return;
  
  const userSkills = state.user?.skills || [];
  const selectedSkills = state.data.skills || [];
  
  // Skills chips
  let skillsHtml = "";
  
  if (userSkills.length > 0) {
    skillsHtml = userSkills.map(skill => {
      const isSelected = selectedSkills.includes(skill);
      return `
        <button
          type="button"
          onclick="toggleCertificateSkill('${skill.replace(/'/g, "\\'")}')"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isSelected 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }"
        >
          ${skill}
        </button>
      `;
    }).join("");
  }
  
  container.innerHTML = `
    <div class="flex flex-wrap gap-2 mb-2">
      ${skillsHtml}
    </div>
    <div class="flex gap-2">
      <input
        type="text"
        id="new-skill-input"
        class="flex-1 px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        data-en-placeholder="${t('addNewSkill')}"
        data-es-placeholder="${t('addNewSkill')}"
        onkeypress="if(event.key === 'Enter') { event.preventDefault(); addNewSkillFromCertificate(this.value); }"
      />
      <button
        type="button"
        onclick="addNewSkillFromCertificate(document.getElementById('new-skill-input').value)"
        class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
      >
        <i data-lucide="plus" class="h-4 w-4"></i>
      </button>
    </div>
  `;
  
  lucide.createIcons();
}

// Expose skills functions globally
window.handleAddSkill = handleAddSkill;
window.handleRemoveSkill = handleRemoveSkill;
window.toggleCertificateSkill = toggleCertificateSkill;
window.addNewSkillFromCertificate = addNewSkillFromCertificate;

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
          `Parsed ${count} certificates. Showing preview of row #1.`,
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
    alert(t('mustBeLoggedInBulk'));
    return;
  }

  if (state.bulkCertificates.length === 0) {
    alert(t('noRecords'));
    return;
  }

  const count = state.bulkCertificates.length;
  const confirmed = confirm(t('bulkConfirm').replace('{count}', count));
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

  const plural = saved !== 1 ? (state.currentLang === 'es' ? 's' : 's') : '';
  const errorMsg = errors > 0 ? t('bulkFailed').replace('{errors}', errors) : '';
  alert(t('bulkDone').replace('{saved}', saved).replace('{s}', plural).replace('{errors}', errorMsg));
  
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
  
  // Initialize skills array if not present
  if (!state.user.skills) {
    state.user.skills = [];
  }
  
  // Reset certificate skills on login
  state.data.skills = [];

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
  
  // Render skills UI after a brief delay to ensure DOM is ready
  setTimeout(() => {
    renderCertificateSkillsSelector();
    renderSettingsSkillsList();
  }, 200);
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
  // Parse skills if it's a string (encoded JSON)
  if (data && data.skills && typeof data.skills === 'string') {
    try {
      data.skills = JSON.parse(decodeURIComponent(data.skills));
    } catch (e) {
      console.warn("Failed to parse skills in openDownloadModal:", e);
      data.skills = [];
    }
  }
  
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
  
  // Build skills HTML if skills exist
  const skills = d.skills || [];
  const skillsHtml = skills.length > 0 
    ? `<div class="flex flex-wrap justify-center gap-2 mt-4">
        ${skills.map(skill => `<span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full border border-indigo-200">${skill}</span>`).join("")}
       </div>` 
    : "";

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
        <div class="text-center space-y-4">
          <p class="text-lg text-gray-700">This certificate is proudly presented to</p>
          <div class="text-5xl font-bold text-gray-900 font-handwriting">${d.recipient || "Recipient Name"}</div>
          <p class="text-lg text-gray-700">For outstanding performance and completion of</p>
          <div class="text-3xl font-semibold text-indigo-800">${d.course || "Course Name"}</div>
          ${skillsHtml}
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
    // Skills HTML for underwater theme
    const underwaterSkillsHtml = skills.length > 0 
      ? `<div class="flex flex-wrap justify-center gap-2 mt-4">
          ${skills.map(skill => `<span class="px-3 py-1 bg-white/20 text-white text-sm rounded-full border border-white/30">${skill}</span>`).join("")}
         </div>` 
      : "";
      
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
        <div class="relative z-10 text-center space-y-4 bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <p class="text-white text-lg">This acknowledges that</p>
          <div class="text-5xl font-bold text-white font-handwriting drop-shadow">${d.recipient || "Recipient Name"}</div>
          <p class="text-white text-lg">Has successfully completed the course</p>
          <div class="text-3xl font-semibold text-cyan-100">${d.course || "Course Name"}</div>
          ${underwaterSkillsHtml}
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
    // Skills HTML for programming theme
    const programmingSkillsHtml = skills.length > 0 
      ? `<div class="mt-4">
          <div class="text-gray-500 text-sm">// Skills acquired</div>
          <div class="text-base mt-1">skills = [${skills.map(s => `<span class="text-green-300">"${s}"</span>`).join(", ")}]</div>
         </div>` 
      : "";
      
    template = `
      <div class="w-full h-full bg-gray-900 text-green-400 p-16 flex flex-col justify-between font-mono relative overflow-hidden">
        <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px);"></div>
        <div class="relative z-10">
          <img src="${logoSrc}" class="h-16 mb-4 opacity-80" onerror="this.src='${defaultLogo}'">
          <div class="text-sm text-gray-500 mb-2">// Achievement Certificate</div>
          <div class="text-4xl font-bold text-green-400">class Achievement implements Success</div>
        </div>
        <div class="relative z-10 space-y-3 text-lg">
          <div><span class="text-blue-400">const</span> recipient = <span class="text-yellow-300">"${d.recipient || "Recipient Name"}"</span></div>
          <div><span class="text-blue-400">const</span> achievement = <span class="text-yellow-300">"${d.course || "Course Name"}"</span></div>
          ${programmingSkillsHtml}
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
    handleValidateCert(input);
  };

  // Add scroll helper function
  window.scrollToSection = function (id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
}

// --- QR Scanner Functions ---

/**
 * Open the QR scanner modal and start the camera
 */
async function openQRScanner() {
  const modal = document.getElementById("qr-scanner-modal");
  const errorBox = document.getElementById("qr-scanner-error");
  const errorText = document.getElementById("qr-scanner-error-text");
  
  // Hide any previous errors
  if (errorBox) errorBox.classList.add("hidden");
  
  // Show modal
  if (modal) modal.classList.remove("hidden");
  
  // Re-initialize icons for the modal
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Check if html5-qrcode is available
  if (typeof Html5Qrcode === 'undefined') {
    showScannerError("QR scanner library not loaded. Please refresh the page.");
    return;
  }

  try {
    // Create scanner instance
    state.qrScanner = new Html5Qrcode("qr-reader");
    
    // Start scanning with camera
    await state.qrScanner.start(
      { facingMode: "environment" }, // Use back camera on mobile
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      onQRCodeScanned,
      onQRCodeScanError
    );
    
    console.log("QR Scanner started successfully");
  } catch (err) {
    console.error("Error starting QR scanner:", err);
    
    // Handle specific errors
    let errorMessage = err.message || "Unable to access camera";
    
    if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
      errorMessage = state.currentLang === 'es' 
        ? "Permiso de cámara denegado. Por favor permite el acceso a la cámara en tu navegador."
        : "Camera permission denied. Please allow camera access in your browser settings.";
    } else if (err.name === "NotFoundError" || err.message?.includes("not found")) {
      errorMessage = state.currentLang === 'es'
        ? "No se encontró ninguna cámara. Asegúrate de que tu dispositivo tiene una cámara."
        : "No camera found. Please ensure your device has a camera.";
    } else if (err.name === "NotReadableError") {
      errorMessage = state.currentLang === 'es'
        ? "La cámara está en uso por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara."
        : "Camera is in use by another application. Close other apps that might be using the camera.";
    }
    
    showScannerError(errorMessage);
  }
}

/**
 * Close the QR scanner modal and stop the camera
 */
async function closeQRScanner() {
  const modal = document.getElementById("qr-scanner-modal");
  
  // Stop the scanner if it's running
  if (state.qrScanner) {
    try {
      await state.qrScanner.stop();
      state.qrScanner.clear();
      console.log("QR Scanner stopped");
    } catch (err) {
      console.warn("Error stopping QR scanner:", err);
    }
    state.qrScanner = null;
  }
  
  // Hide modal
  if (modal) modal.classList.add("hidden");
}

/**
 * Handle successful QR code scan
 */
function onQRCodeScanned(decodedText) {
  console.log("📱 QR Code scanned:", decodedText);
  
  // Extract certificate ID from the scanned text
  // The QR code contains just the certificate ID (e.g., "CERT-XXXX")
  let certId = decodedText.trim().toUpperCase();
  
  // If the QR code contains a URL, extract the ID from it
  if (certId.includes("/")) {
    const parts = certId.split("/");
    certId = parts[parts.length - 1];
  }
  
  // Validate the ID format (should start with CERT-)
  if (!certId.startsWith("CERT-")) {
    showScannerError(
      state.currentLang === 'es'
        ? "El código QR escaneado no parece ser un certificado válido."
        : "The scanned QR code doesn't appear to be a valid certificate."
    );
    return;
  }
  
  // Close the scanner
  closeQRScanner();
  
  // Determine if we're on the public page or dashboard
  if (!isDashboardPage) {
    // On public page, populate the verify input and trigger validation
    const verifyInput = document.getElementById("verify-input");
    if (verifyInput) {
      verifyInput.value = certId;
    }
  } else {
    // On dashboard, populate the validate input and trigger validation
    const validateInput = document.getElementById("validate-id");
    if (validateInput) {
      validateInput.value = certId;
    }
  }
  
  // Trigger validation (function determines context via isDashboardPage)
  handleValidateCert(certId);
}

/**
 * Handle QR code scan errors (during scanning, not startup)
 */
function onQRCodeScanError(errorMessage) {
  // These are non-critical errors during scanning, just log them
  console.warn("QR scan error:", errorMessage);
}

/**
 * Show an error message in the scanner modal
 */
function showScannerError(message) {
  const errorBox = document.getElementById("qr-scanner-error");
  const errorText = document.getElementById("qr-scanner-error-text");
  
  if (errorText) errorText.textContent = message;
  if (errorBox) errorBox.classList.remove("hidden");
}

// Expose QR scanner functions globally
window.openQRScanner = openQRScanner;
window.closeQRScanner = closeQRScanner;

/**
 * Open the public download modal (for index.html public validator)
 * Creates a simple modal if it doesn't exist, or uses the existing one
 */
function openPublicDownloadModal(recipient, course, id, date, issuer, skillsParam) {
  // Parse skills from encoded parameter if provided
  let skills = [];
  if (skillsParam) {
    try {
      skills = JSON.parse(decodeURIComponent(skillsParam));
    } catch (e) {
      console.warn("Failed to parse skills parameter:", e);
    }
  }
  
  // Store the certificate data
  const certData = { recipient, course, id, date, issuer, logo: "default-logo.ico", skills };
  state.modalData = certData;
  state.modalTheme = state.theme || "academic";

  // Check if modal exists (it should be in index.html)
  const modal = document.getElementById("public-download-modal");
  
  if (!modal) {
    // Create modal dynamically if it doesn't exist
    createPublicDownloadModal();
  }

  // Show modal
  const modalEl = document.getElementById("public-download-modal");
  if (modalEl) modalEl.classList.remove("hidden");

  // Render initial preview
  setTimeout(() => {
    renderPublicModalPreview();
    lucide.createIcons();
  }, 50);
}

/**
 * Create the public download modal dynamically
 */
function createPublicDownloadModal() {
  const modalHtml = `
    <div
      id="public-download-modal"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] hidden flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[80vh] overflow-hidden flex flex-col"
      >
        <!-- Modal Header -->
        <div
          class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10"
        >
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              <span data-en>Download Certificate</span>
              <span data-es class="hidden">Descargar Certificado</span>
            </h2>
            <p class="text-sm text-gray-500">
              <span data-en>Select a theme for your PDF export</span>
              <span data-es class="hidden">Selecciona un tema para tu exportación PDF</span>
            </p>
          </div>
          <button
            onclick="closePublicDownloadModal()"
            class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <i data-lucide="x" class="h-6 w-6"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div
          class="flex-grow flex flex-col md:flex-row overflow-hidden bg-gray-50"
        >
          <!-- Left: Theme List -->
          <div
            class="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto p-6 flex-shrink-0"
          >
            <h3
              class="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider"
            >
              <span data-en>Available Themes</span>
              <span data-es class="hidden">Temas Disponibles</span>
            </h3>
            <div class="space-y-3" id="public-theme-list-container">
              <!-- Theme items injected here via JS -->
            </div>
          </div>

          <!-- Right: Preview -->
          <div
            class="flex-grow p-8 overflow-hidden relative flex items-center justify-center bg-slate-200"
          >
            <div
              class="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-slate-500 shadow-sm z-10"
            >
              <span data-en>Print Preview</span>
              <span data-es class="hidden">Vista Previa</span>
            </div>
            <!-- Scaled Preview Container -->
            <div
              id="public-modal-preview-wrapper"
              class="shadow-2xl bg-white transition-all duration-300 origin-center"
            >
              <div
                id="public-modal-certificate-container"
                class="relative overflow-hidden bg-white"
              ></div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="px-8 py-5 border-t border-gray-100 bg-white flex justify-end items-center gap-3 z-10"
        >
          <button
            onclick="closePublicDownloadModal()"
            class="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            <span data-en>Cancel</span>
            <span data-es class="hidden">Cancelar</span>
          </button>
          <button
            onclick="confirmPublicDownload()"
            class="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform active:scale-95"
          >
            <i data-lucide="printer" class="h-4 w-4"></i>
            <span data-en>Print / Save PDF</span>
            <span data-es class="hidden">Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Build theme list
  const listContainer = document.getElementById("public-theme-list-container");
  if (listContainer) {
    THEMES.forEach((t) => {
      const isActive = t.id === state.modalTheme;
      const div = document.createElement("div");
      div.className = `p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isActive ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-white"}`;
      div.onclick = () => selectPublicModalTheme(t.id);
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
  }
  
  lucide.createIcons();
}

/**
 * Select a theme for the public modal preview
 */
function selectPublicModalTheme(themeId) {
  state.modalTheme = themeId;
  
  // Re-render theme list
  const listContainer = document.getElementById("public-theme-list-container");
  if (listContainer) {
    listContainer.innerHTML = "";
    THEMES.forEach((t) => {
      const isActive = t.id === state.modalTheme;
      const div = document.createElement("div");
      div.className = `p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isActive ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-white"}`;
      div.onclick = () => selectPublicModalTheme(t.id);
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
  }
  
  renderPublicModalPreview();
  lucide.createIcons();
}

/**
 * Render the public modal preview with selected theme and data
 */
function renderPublicModalPreview() {
  const container = document.getElementById("public-modal-certificate-container");
  const wrapper = document.getElementById("public-modal-preview-wrapper");

  if (!container || !wrapper) return;

  // Set fixed dimensions for rendering (A4 Landscape)
  const w = 1123;
  const h = 794;
  container.style.width = w + "px";
  container.style.height = h + "px";

  renderCertificateToTarget(container, state.modalData, state.modalTheme);

  // Scale to fit modal preview area
  const parent = wrapper.parentElement;
  if (parent) {
    const scale = Math.min(
      (parent.clientWidth - 40) / w,
      (parent.clientHeight - 40) / h,
    );

    wrapper.style.width = w + "px";
    wrapper.style.height = h + "px";
    wrapper.style.transform = `scale(${scale})`;
  }
}

/**
 * Close the public download modal
 */
function closePublicDownloadModal() {
  const modal = document.getElementById("public-download-modal");
  if (modal) modal.classList.add("hidden");
}

/**
 * Confirm download from public modal - render certificate and print
 */
function confirmPublicDownload() {
  // Apply selected theme and data to main view temporarily for printing
  const originalTheme = state.theme;
  const originalData = { ...state.data };

  state.theme = state.modalTheme;
  state.data = state.modalData;

  // Render to main container for printing
  renderCertificate();

  // Give browser a moment to repaint before print dialog
  setTimeout(() => {
    window.print();
  }, 100);

  closePublicDownloadModal();
}

// Expose public download modal functions globally
window.openPublicDownloadModal = openPublicDownloadModal;
window.closePublicDownloadModal = closePublicDownloadModal;
window.selectPublicModalTheme = selectPublicModalTheme;
window.confirmPublicDownload = confirmPublicDownload;

// --- Rendering ---
function renderCertificate() {
  const container = document.getElementById("certificate-container");
  if (!container) return;

  const d = state.data;
  const logoSrc = d.logo || defaultLogo;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${d.id}`;
  
  // Build skills HTML if skills exist
  const skills = d.skills || [];
  const skillsHtml = skills.length > 0 
    ? `<div class="flex flex-wrap justify-center gap-2 mt-4">
        ${skills.map(skill => `<span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full border border-indigo-200">${skill}</span>`).join("")}
       </div>` 
    : "";

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
        <div class="text-center space-y-4">
          <p class="text-lg text-gray-700">This certificate is proudly presented to</p>
          <div class="text-5xl font-bold text-gray-900 font-handwriting">${d.recipient || "Recipient Name"}</div>
          <p class="text-lg text-gray-700">For outstanding performance and completion of</p>
          <div class="text-3xl font-semibold text-indigo-800">${d.course || "Course Name"}</div>
          ${skillsHtml}
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
    // Skills HTML for underwater theme
    const underwaterSkillsHtml = skills.length > 0 
      ? `<div class="flex flex-wrap justify-center gap-2 mt-4">
          ${skills.map(skill => `<span class="px-3 py-1 bg-white/20 text-white text-sm rounded-full border border-white/30">${skill}</span>`).join("")}
         </div>` 
      : "";
      
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
        <div class="relative z-10 text-center space-y-4 bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <p class="text-white text-lg">This acknowledges that</p>
          <div class="text-5xl font-bold text-white font-handwriting drop-shadow">${d.recipient || "Recipient Name"}</div>
          <p class="text-white text-lg">Has successfully completed the course</p>
          <div class="text-3xl font-semibold text-cyan-100">${d.course || "Course Name"}</div>
          ${underwaterSkillsHtml}
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
    // Skills HTML for programming theme
    const programmingSkillsHtml = skills.length > 0 
      ? `<div class="mt-4">
          <div class="text-gray-500 text-sm">// Skills acquired</div>
          <div class="text-base mt-1">skills = [${skills.map(s => `<span class="text-green-300">"${s}"</span>`).join(", ")}]</div>
         </div>` 
      : "";
      
    template = `
      <div class="w-full h-full bg-gray-900 text-green-400 p-16 flex flex-col justify-between font-mono relative overflow-hidden">
        <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px);"></div>
        <div class="relative z-10">
          <img src="${logoSrc}" class="h-16 mb-4 opacity-80" onerror="this.src='${defaultLogo}'">
          <div class="text-sm text-gray-500 mb-2">// Achievement Certificate</div>
          <div class="text-4xl font-bold text-green-400">class Achievement implements Success</div>
        </div>
        <div class="relative z-10 space-y-3 text-lg">
          <div><span class="text-blue-400">const</span> recipient = <span class="text-yellow-300">"${d.recipient || "Recipient Name"}"</span></div>
          <div><span class="text-blue-400">const</span> achievement = <span class="text-yellow-300">"${d.course || "Course Name"}"</span></div>
          ${programmingSkillsHtml}
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
