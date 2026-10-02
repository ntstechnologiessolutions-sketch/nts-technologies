import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js?v=c258e7c";

const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");
const dataStatus = document.querySelector("#data-status");
const rows = document.querySelector("#enquiry-rows");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#message-dialog");
const configured = !firebaseConfig.apiKey.startsWith("YOUR_") && !firebaseConfig.projectId.startsWith("YOUR_") && ADMIN_EMAILS.length > 0;
let auth;
let db;
let firebaseModules;
let enquiries = [];
let stopListening;

function setLoginMessage(message, state = "error") {
  loginStatus.textContent = message;
  loginStatus.dataset.state = state;
}

async function loadFirebase() {
  if (!configured) throw new Error("Firebase is not configured. Add your Firebase web app settings and admin email in js/firebase-config.js.");
  if (auth && db && firebaseModules) return firebaseModules;
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js")
  ]);
  const app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  firebaseModules = { ...authModule, ...firestoreModule };
  return firebaseModules;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  return date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Just now";
}

function getVisibleEnquiries() {
  const search = document.querySelector("#search-input").value.trim().toLowerCase();
  const statusFilter = document.querySelector("#status-filter").value;
  return enquiries.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const haystack = [item.name, item.email, item.phone, item.company, item.service, item.message].join(" ").toLowerCase();
    return matchesStatus && (!search || haystack.includes(search));
  });
}

function renderRows() {
  const visible = getVisibleEnquiries();
  document.querySelector("#total-count").textContent = enquiries.length;
  document.querySelector("#new-count").textContent = enquiries.filter((item) => item.status === "new").length;
  emptyState.hidden = visible.length !== 0;
  rows.innerHTML = visible.map((item) => `
    <tr data-id="${escapeHTML(item.id)}">
      <td class="received-cell">${escapeHTML(formatDate(item.createdAt))}</td>
      <td class="contact-cell"><b>${escapeHTML(item.name)}</b><a href="mailto:${escapeHTML(item.email)}">${escapeHTML(item.email)}</a>${item.phone ? `<a href="tel:${escapeHTML(item.phone)}">${escapeHTML(item.phone)}</a>` : ""}</td>
      <td class="company-cell">${escapeHTML(item.company || "—")}</td>
      <td class="service-cell"><button class="message-button" data-action="message" data-id="${escapeHTML(item.id)}">${escapeHTML(item.service)} <span aria-hidden="true">↗</span></button></td>
      <td class="status-cell"><label class="sr-only" for="status-${escapeHTML(item.id)}">Status for ${escapeHTML(item.name)}</label><select id="status-${escapeHTML(item.id)}" class="status-select status-${escapeHTML(item.status)}" data-action="status" data-id="${escapeHTML(item.id)}"><option value="new" ${item.status === "new" ? "selected" : ""}>New</option><option value="contacted" ${item.status === "contacted" ? "selected" : ""}>Contacted</option><option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option></select></td>
      <td class="actions-cell"><div class="row-actions"><button class="row-action" data-action="message" data-id="${escapeHTML(item.id)}" aria-label="View message from ${escapeHTML(item.name)}" title="View message">↗</button><button class="row-action" data-action="delete" data-id="${escapeHTML(item.id)}" aria-label="Delete enquiry from ${escapeHTML(item.name)}" title="Delete enquiry">×</button></div></td>
    </tr>`).join("");
  if (!visible.length && enquiries.length) emptyState.querySelector("p").textContent = "Try a different search or status filter.";
  else emptyState.querySelector("p").textContent = "New enquiries will appear here in real time.";
}

function showError(error) {
  console.error("NTS admin:", error);
  dataStatus.textContent = error.code === "permission-denied" ? "Access denied by Firestore rules. Check the configured admin email and published rules." : "Could not load enquiries. Check your Firebase configuration and Firestore rules.";
  dataStatus.dataset.state = "error";
}

async function showDashboard(user) {
  const email = user.email?.toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email);
  if (!isAdmin) {
    setLoginMessage("This account is not authorised for the admin dashboard.");
    await firebaseModules.signOut(auth);
    return;
  }
  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#signed-in-as").textContent = `Signed in as ${user.email}`;
  const { collection, onSnapshot, orderBy, query } = firebaseModules;
  if (stopListening) stopListening();
  const inboxQuery = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
  stopListening = onSnapshot(inboxQuery, (snapshot) => {
    enquiries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    dataStatus.textContent = enquiries.length ? `${enquiries.length} ${enquiries.length === 1 ? "enquiry" : "enquiries"} · Live updates on` : "Inbox is connected. No enquiries yet.";
    dataStatus.dataset.state = "success";
    renderRows();
  }, showError);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const button = loginForm.querySelector("button");
  button.disabled = true;
  setLoginMessage("Signing in...", "success");
  try {
    const modules = await loadFirebase();
    firebaseModules = modules;
    const values = new FormData(loginForm);
    await modules.signInWithEmailAndPassword(auth, String(values.get("email")).trim(), String(values.get("password")));
  } catch (error) {
    console.error("NTS admin sign-in failed:", error);
    setLoginMessage(error.message.startsWith("Firebase is not configured") ? error.message : error.code === "auth/invalid-credential" || error.code === "auth/invalid-login-credentials" ? "Email or password is incorrect." : "Sign-in failed. Check Firebase configuration and try again.");
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try { await firebaseModules.signOut(auth); } catch (error) { showError(error); }
});

document.querySelector("#search-input").addEventListener("input", renderRows);
document.querySelector("#status-filter").addEventListener("change", renderRows);

rows.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = enquiries.find((enquiry) => enquiry.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "message") {
    document.querySelector("#dialog-meta").textContent = `${item.name} · ${item.company || "No company provided"} · ${item.service} · ${formatDate(item.createdAt)}`;
    document.querySelector("#dialog-message").textContent = item.message;
    const emailLink = document.querySelector("#dialog-email");
    emailLink.href = `mailto:${item.email}`;
    emailLink.textContent = item.email;
    dialog.showModal();
  }
  if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete the enquiry from ${item.name}? This cannot be undone.`)) return;
    button.disabled = true;
    try { await firebaseModules.deleteDoc(firebaseModules.doc(db, "enquiries", item.id)); }
    catch (error) { showError(error); button.disabled = false; }
  }
});

rows.addEventListener("change", async (event) => {
  const select = event.target.closest('[data-action="status"]');
  if (!select) return;
  select.disabled = true;
  try { await firebaseModules.updateDoc(firebaseModules.doc(db, "enquiries", select.dataset.id), { status: select.value }); }
  catch (error) { showError(error); }
  finally { select.disabled = false; }
});

document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

document.querySelector("#export-button").addEventListener("click", () => {
  const visible = getVisibleEnquiries();
  const columns = ["name", "email", "phone", "company", "service", "message", "createdAt", "status"];
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.map(quote).join(","), ...visible.map((item) => columns.map((column) => quote(column === "createdAt" ? formatDate(item.createdAt) : item[column])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nts-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#admin-year").textContent = new Date().getFullYear();

(async function init() {
  if (!configured) { setLoginMessage("Add your Firebase web app configuration and admin email in js/firebase-config.js."); return; }
  try {
    await loadFirebase();
    firebaseModules.onAuthStateChanged(auth, (user) => {
      if (user) showDashboard(user).catch(showError);
      else { if (stopListening) stopListening(); dashboard.hidden = true; loginPanel.hidden = false; }
    }, showError);
  } catch (error) { setLoginMessage(error.message); }
})();
