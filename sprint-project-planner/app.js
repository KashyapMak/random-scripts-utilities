/* ============================================================
   Sprint Project Planner – app.js  (Final)
   Front-end only · localStorage · 4 views · Drag & Drop
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let currentProjectId = null;
let currentView = "grid";
const LS_KEY = "spp_projects";

// Drag state
let dragSrcRow = null;

// ── Helpers ──────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const uid = () => "p" + Date.now() + Math.random().toString(36).slice(2, 7);

function randomColor() {
  const p = [
    "#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c",
    "#3498db","#9b59b6","#e84393","#00b894","#0984e3",
    "#6c5ce7","#fd79a8","#00cec9","#fdcb6e","#d63031",
    "#6ab04c","#eb4d4b","#22a6b3","#30336b","#f9ca24"
  ];
  return p[Math.floor(Math.random() * p.length)];
}

function formatDate(d) {
  const dt = new Date(d);
  const day = dt.getDate();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return day + "-" + months[dt.getMonth()] + "-" + String(dt.getFullYear()).slice(2);
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function showToast(msg, type) {
  const t = $("#appToast");
  t.className = "toast align-items-center text-bg-" + (type || "success") + " border-0";
  $("#toastBody").textContent = msg;
  bootstrap.Toast.getOrCreateInstance(t).show();
}

function toggleCollapse(bodyId, chevId) {
  const b = document.getElementById(bodyId);
  const c = document.getElementById(chevId);
  if (b.style.display === "none") { b.style.display = ""; c.className = "fas fa-chevron-up text-muted"; }
  else { b.style.display = "none"; c.className = "fas fa-chevron-down text-muted"; }
}

function contrastText(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#2c3e50" : "#ffffff";
}

function hexToRgba(hex, a) {
  const c = hex.replace("#", "");
  return "rgba(" + parseInt(c.substr(0, 2), 16) + "," + parseInt(c.substr(2, 2), 16) + "," + parseInt(c.substr(4, 2), 16) + "," + a + ")";
}

function darkenHex(hex, pct) {
  let c = hex.replace("#", "");
  let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  r = Math.max(0, Math.floor(r * (1 - pct)));
  g = Math.max(0, Math.floor(g * (1 - pct)));
  b = Math.max(0, Math.floor(b * (1 - pct)));
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function sprintOf(weekNum, weeksPerSprint) {
  return Math.ceil(weekNum / weeksPerSprint);
}

// ── localStorage CRUD ────────────────────────────────────────
function getProjects() { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
function saveProjects(p) { localStorage.setItem(LS_KEY, JSON.stringify(p)); }
function getProjectById(id) { return getProjects().find(p => p.id === id) || null; }
function upsertProject(proj) {
  let ps = getProjects();
  const i = ps.findIndex(p => p.id === proj.id);
  if (i >= 0) ps[i] = proj; else ps.push(proj);
  saveProjects(ps);
}
function removeProject(id) { saveProjects(getProjects().filter(p => p.id !== id)); }

// ── Dashboard ────────────────────────────────────────────────
function showDashboard() {
  $("#dashboard").classList.remove("d-none");
  $("#editor").classList.add("d-none");
  currentProjectId = null;
  renderDashboard();
}

function renderDashboard() {
  const projects = getProjects();
  const ctr = $("#projectCards");
  const empty = $("#emptyState");
  ctr.innerHTML = "";
  if (!projects.length) { empty.classList.remove("d-none"); return; }
  empty.classList.add("d-none");
  projects.forEach(p => {
    const tw = p.numSprints * p.weeksPerSprint;
    const col = document.createElement("div");
    col.className = "col-sm-6 col-lg-4 col-xl-3";
    col.innerHTML = `
      <div class="card project-card h-100" onclick="openProject('${p.id}')">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-dark mb-0" style="max-width:180px">${p.name}</h6>
            <div class="dropdown" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-light border-0 p-1" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v text-muted"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><a class="dropdown-item small" href="#" onclick="openProject('${p.id}')"><i class="fas fa-edit me-2 text-primary"></i>Edit</a></li>
                <li><a class="dropdown-item small" href="#" onclick="duplicateProject('${p.id}')"><i class="fas fa-copy me-2 text-success"></i>Duplicate</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item small text-danger" href="#" onclick="confirmDelete('${p.id}')"><i class="fas fa-trash me-2"></i>Delete</a></li>
              </ul>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap mb-2">
            <span class="badge-sprint"><i class="fas fa-bolt me-1"></i>${p.numSprints} Sprint${p.numSprints > 1 ? "s" : ""}</span>
            <span class="badge-sprint"><i class="fas fa-calendar-week me-1"></i>${tw} Weeks</span>
          </div>
          <div class="text-muted small"><i class="fas fa-calendar-alt me-1"></i>Start: ${p.startDate || "—"}</div>
          <div class="text-muted small mt-1"><i class="fas fa-list-check me-1"></i>${(p.actions||[]).length} Action Items</div>
        </div>
      </div>`;
    ctr.appendChild(col);
  });
}

function confirmDelete(id) {
  const m = new bootstrap.Modal($("#deleteModal"));
  $("#confirmDeleteBtn").onclick = () => { removeProject(id); m.hide(); showToast("Project deleted","danger"); renderDashboard(); };
  m.show();
}
function duplicateProject(id) {
  const p = getProjectById(id); if (!p) return;
  const d = JSON.parse(JSON.stringify(p)); d.id = uid(); d.name += " (Copy)";
  upsertProject(d); showToast("Project duplicated!","info"); renderDashboard();
}

// ── Create / Open ────────────────────────────────────────────
function createNewProject() {
  currentProjectId = uid();
  $("#dashboard").classList.add("d-none");
  $("#editor").classList.remove("d-none");
  $("#editorTitle").textContent = "New Project";
  $("#projectName").value = "";
  $("#numSprints").value = 3;
  $("#weeksPerSprint").value = 2;
  const t = new Date(), day = t.getDay(), diff = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  $("#startDate").value = addDays(t, diff).toISOString().split("T")[0];
  $("#actionItemsBody").innerHTML = "";
  $("#planView").innerHTML = "";
  updateWeekDropdowns();
  checkNoItems();
  new bootstrap.Tab($("#tab-items")).show();
}

function openProject(id) {
  const p = getProjectById(id); if (!p) return;
  currentProjectId = p.id;
  $("#dashboard").classList.add("d-none");
  $("#editor").classList.remove("d-none");
  $("#editorTitle").textContent = p.name;
  $("#projectName").value = p.name;
  $("#numSprints").value = p.numSprints;
  $("#weeksPerSprint").value = p.weeksPerSprint;
  $("#startDate").value = p.startDate;
  $("#actionItemsBody").innerHTML = "";
  (p.actions || []).forEach(a => addActionItem(a));
  updateWeekDropdowns();
  const rows = $$("#actionItemsBody tr");
  (p.actions || []).forEach((a, i) => {
    if (rows[i]) { rows[i].querySelector(".sel-start").value = a.startWeek; rows[i].querySelector(".sel-end").value = a.endWeek; }
  });
  checkNoItems();
  new bootstrap.Tab($("#tab-items")).show();
}

// ── Action Items ─────────────────────────────────────────────
function addActionItem(data) {
  const tbody = $("#actionItemsBody");
  const idx = tbody.rows.length + 1;
  const tr = document.createElement("tr");
  tr.draggable = true;
  const color = (data && data.color) || randomColor();
  const name = (data && data.name) || "";
  tr.innerHTML = `
    <td class="text-center">
      <span class="drag-handle" title="Drag to reorder">
        <i class="fas fa-grip-vertical"></i>
        <span class="row-num">${idx}</span>
      </span>
    </td>
    <td><input type="text" class="inp-name" value="${name}" placeholder="Enter action item..."/></td>
    <td><select class="sel-start form-select form-select-sm"></select></td>
    <td><select class="sel-end form-select form-select-sm"></select></td>
    <td class="text-center"><input type="color" class="inp-color" value="${color}" title="Pick color"/></td>
    <td class="text-center text-nowrap">
      <button class="btn btn-sm btn-outline-secondary btn-action me-1" title="Move Up" onclick="moveItem(this,-1)"><i class="fas fa-arrow-up fa-xs"></i></button>
      <button class="btn btn-sm btn-outline-secondary btn-action me-1" title="Move Down" onclick="moveItem(this,1)"><i class="fas fa-arrow-down fa-xs"></i></button>
      <button class="btn btn-sm btn-outline-danger btn-action" title="Remove" onclick="removeActionItem(this)"><i class="fas fa-times fa-xs"></i></button>
    </td>`;
  tbody.appendChild(tr);
  bindDragEvents(tr);
  updateWeekDropdowns();
  checkNoItems();
}

function removeActionItem(btn) { btn.closest("tr").remove(); renumberRows(); checkNoItems(); }

function renumberRows() {
  $$("#actionItemsBody tr").forEach((tr, i) => {
    const numEl = tr.querySelector(".row-num");
    if (numEl) numEl.textContent = i + 1;
  });
}

function checkNoItems() {
  const n = $("#actionItemsBody").rows.length;
  if (n === 0) $("#noItemsMsg").classList.remove("d-none"); else $("#noItemsMsg").classList.add("d-none");
}

function moveItem(btn, dir) {
  const tr = btn.closest("tr");
  const tbody = tr.parentNode;
  const rows = Array.from(tbody.rows);
  const idx = rows.indexOf(tr);
  const target = idx + dir;
  if (target < 0 || target >= rows.length) return;
  if (dir === -1) tbody.insertBefore(tr, rows[target]);
  else tbody.insertBefore(rows[target], tr);
  renumberRows();
}

// ── Drag and Drop ────────────────────────────────────────────
function bindDragEvents(tr) {
  tr.addEventListener("dragstart", handleDragStart);
  tr.addEventListener("dragover", handleDragOver);
  tr.addEventListener("dragenter", handleDragEnter);
  tr.addEventListener("dragleave", handleDragLeave);
  tr.addEventListener("drop", handleDrop);
  tr.addEventListener("dragend", handleDragEnd);
}

function handleDragStart(e) {
  dragSrcRow = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", ""); // required for Firefox
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this === dragSrcRow) return;
  // Determine if dragging above or below
  clearDragClasses();
  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  if (e.clientY < midY) {
    this.classList.add("drag-over-top");
  } else {
    this.classList.add("drag-over-bottom");
  }
}

function handleDragLeave(e) {
  this.classList.remove("drag-over-top", "drag-over-bottom");
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  if (this === dragSrcRow) return;
  const tbody = $("#actionItemsBody");
  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  if (e.clientY < midY) {
    tbody.insertBefore(dragSrcRow, this);
  } else {
    tbody.insertBefore(dragSrcRow, this.nextSibling);
  }
  renumberRows();
  return false;
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  clearDragClasses();
  dragSrcRow = null;
}

function clearDragClasses() {
  $$("#actionItemsBody tr").forEach(tr => {
    tr.classList.remove("drag-over-top", "drag-over-bottom");
  });
}

// ── Week Dropdowns ───────────────────────────────────────────
function updateWeekDropdowns() {
  const ns = parseInt($("#numSprints").value) || 1;
  const wps = parseInt($("#weeksPerSprint").value) || 1;
  const tw = ns * wps;
  $$("#actionItemsBody .sel-start, #actionItemsBody .sel-end").forEach(sel => {
    const prev = sel.value;
    sel.innerHTML = "";
    for (let w = 1; w <= tw; w++) {
      const s = sprintOf(w, wps);
      const o = document.createElement("option");
      o.value = w;
      o.textContent = "Wk " + w + " (Sprint " + s + ")";
      sel.appendChild(o);
    }
    if (prev && parseInt(prev) <= tw) sel.value = prev;
  });
}

function gatherProjectData() {
  const actions = [];
  $$("#actionItemsBody tr").forEach(tr => {
    const name = tr.querySelector(".inp-name").value.trim();
    const sw = parseInt(tr.querySelector(".sel-start").value);
    const ew = parseInt(tr.querySelector(".sel-end").value);
    const color = tr.querySelector(".inp-color").value;
    if (name) actions.push({ name, startWeek: sw, endWeek: Math.max(ew, sw), color });
  });
  return {
    id: currentProjectId,
    name: $("#projectName").value.trim() || "Untitled Project",
    numSprints: parseInt($("#numSprints").value) || 1,
    weeksPerSprint: parseInt($("#weeksPerSprint").value) || 1,
    startDate: $("#startDate").value,
    actions
  };
}

// ── Save ─────────────────────────────────────────────────────
function saveProject() {
  const p = gatherProjectData();
  upsertProject(p);
  $("#editorTitle").textContent = p.name;
  showToast("Project saved successfully!");
}

function applyConfig() { updateWeekDropdowns(); renderPlan(); }

// ── View Switching ───────────────────────────────────────────
function switchView(v, btn) {
  currentView = v;
  $$(".spp-view-toggle .btn").forEach(b => {
    b.className = b === btn ? "btn btn-sm btn-primary active" : "btn btn-sm btn-outline-primary";
  });
  renderPlan();
}

function renderPlan() {
  const p = gatherProjectData();
  if (currentView === "grid") renderGrid(p);
  else if (currentView === "gantt") renderGantt(p);
  else if (currentView === "swimlane") renderSwimlane(p);
  else if (currentView === "timeline") renderTimeline(p);
}

// ── Week calculations ────────────────────────────────────────
function getWeeks(proj) {
  const tw = proj.numSprints * proj.weeksPerSprint;
  const s = new Date(proj.startDate + "T00:00:00");
  const wks = [];
  for (let i = 0; i < tw; i++) {
    const st = addDays(s, i * 7), en = addDays(st, 6);
    wks.push({ num: i + 1, start: st, end: en });
  }
  return wks;
}

// ══════════ VIEW 1: GRID ══════════
function renderGrid(proj) {
  const c = $("#planView"), tw = proj.numSprints * proj.weeksPerSprint, wks = getWeeks(proj);
  let h = '<table class="grid-table">';

  h += '<tr><th class="hdr-project" style="writing-mode:horizontal-tb;text-align:right;font-size:.76rem;">Week End</th>';
  wks.forEach(w => { h += '<th class="date-cell">' + formatDate(w.end) + '</th>'; });
  h += '</tr>';

  h += '<tr><th class="hdr-project" style="writing-mode:horizontal-tb;text-align:right;font-size:.76rem;">Week Start</th>';
  wks.forEach(w => { h += '<th class="date-cell">' + formatDate(w.start) + '</th>'; });
  h += '</tr>';

  h += '<tr><th class="hdr-project" rowspan="3" style="vertical-align:middle">' + (proj.name || "Project Plan") + '</th>';
  h += '<th class="hdr-duration" colspan="' + tw + '">Project Duration</th></tr>';

  h += '<tr>';
  for (let s = 1; s <= proj.numSprints; s++) {
    const cls = s % 2 === 1 ? "hdr-sprint-odd" : "hdr-sprint-even";
    h += '<th class="hdr-sprint ' + cls + '" colspan="' + proj.weeksPerSprint + '">Sprint ' + s + '</th>';
  }
  h += '</tr><tr>';
  for (let w = 1; w <= tw; w++) h += '<th class="hdr-week">Week ' + w + '</th>';
  h += '</tr>';

  proj.actions.forEach(a => {
    h += '<tr><td class="action-label">' + a.name + '</td>';
    for (let w = 1; w <= tw; w++) {
      h += w >= a.startWeek && w <= a.endWeek
        ? '<td style="background:' + a.color + ';"></td>'
        : '<td></td>';
    }
    h += '</tr>';
  });

  h += '</table>';
  c.innerHTML = h;
}

// ══════════ VIEW 2: GANTT ══════════
function renderGantt(proj) {
  const c = $("#planView"), tw = proj.numSprints * proj.weeksPerSprint, wks = getWeeks(proj);
  let h = '<div class="gantt-wrap">';

  h += '<div class="gantt-sprint-hdr"><div class="gantt-lcol" style="font-weight:700;color:#7d6608">Action Items</div><div class="gantt-timeline">';
  for (let s = 1; s <= proj.numSprints; s++) {
    for (let wis = 1; wis <= proj.weeksPerSprint; wis++) {
      const bdr = wis === proj.weeksPerSprint && s < proj.numSprints ? "border-right:2px solid #d5a326;" : "";
      h += '<div class="gantt-wcol" style="' + bdr + '">' + (wis === 1 ? '<div style="font-size:.7rem;color:#b7950b">Sprint ' + s + '</div>' : '') + '</div>';
    }
  }
  h += '</div></div>';

  h += '<div class="gantt-header"><div class="gantt-lcol">Task</div><div class="gantt-timeline">';
  wks.forEach((w, i) => {
    const bdr = (i + 1) % proj.weeksPerSprint === 0 && (i + 1) < tw ? "border-right:2px solid #1a73e8;" : "";
    h += '<div class="gantt-wcol" style="' + bdr + '">Week ' + w.num + '<span class="gantt-date-sub">' + formatDate(w.start) + '</span></div>';
  });
  h += '</div></div>';

  proj.actions.forEach(a => {
    h += '<div class="gantt-row"><div class="gantt-lcol">' + a.name + '</div><div class="gantt-timeline">';
    for (let w = 1; w <= tw; w++) {
      const bdr = w % proj.weeksPerSprint === 0 && w < tw ? "border-right:2px solid #d5d8dc;" : "";
      if (w >= a.startWeek && w <= a.endWeek) {
        const span = a.endWeek - a.startWeek + 1;
        let rc = "gantt-bar-single";
        if (span > 1) { if (w === a.startWeek) rc = "gantt-bar-start"; else if (w === a.endWeek) rc = "gantt-bar-end"; else rc = "gantt-bar-mid"; }
        h += '<div class="gantt-bar-cell" style="' + bdr + '"><div class="gantt-bar ' + rc + '" style="background:' + a.color + ';color:' + contrastText(a.color) + '" title="' + a.name + '"></div></div>';
      } else {
        h += '<div class="gantt-bar-cell" style="' + bdr + '"></div>';
      }
    }
    h += '</div></div>';
  });

  h += '</div>';
  c.innerHTML = h;
}

// ══════════ VIEW 3: SWIMLANE ══════════
function renderSwimlane(proj) {
  const c = $("#planView"), tw = proj.numSprints * proj.weeksPerSprint, wks = getWeeks(proj);
  let h = '<div class="swim-wrap">';

  h += '<div class="swim-header"><div class="swim-label-hdr"><i class="fas fa-stream me-2"></i>Action Items</div>';
  wks.forEach((w) => {
    const s = sprintOf(w.num, proj.weeksPerSprint);
    const sprintBdr = w.num % proj.weeksPerSprint === 0 && w.num < tw ? "border-right:2px solid #bbb;" : "";
    h += '<div class="swim-week-hdr" style="' + sprintBdr + '">Sprint ' + s + ' · Wk ' + w.num + '<span class="sw-date">' + formatDate(w.start) + '</span></div>';
  });
  h += '</div>';

  proj.actions.forEach((a) => {
    const bg = hexToRgba(a.color, 0.08);
    const borderL = a.color;
    h += '<div class="swim-lane" style="background:' + bg + ';border-left:5px solid ' + borderL + '">';
    h += '<div class="swim-lane-label"><div class="swim-lane-badge" style="background:' + a.color + ';color:' + contrastText(a.color) + '">' + a.name + '</div></div>';
    h += '<div class="swim-lane-weeks">';
    for (let w = 1; w <= tw; w++) {
      const sprintBdr = w % proj.weeksPerSprint === 0 && w < tw ? "border-right:2px solid rgba(0,0,0,.08);" : "";
      if (w >= a.startWeek && w <= a.endWeek) {
        h += '<div class="swim-week-cell" style="' + sprintBdr + '"><div class="swim-task-block" style="background:' + a.color + ';color:' + contrastText(a.color) + '">' + (w === a.startWeek ? a.name.substring(0, 16) : '') + '</div></div>';
      } else {
        h += '<div class="swim-week-cell" style="' + sprintBdr + '"></div>';
      }
    }
    h += '</div></div>';
  });

  h += '</div>';
  c.innerHTML = h;
}

// ══════════ VIEW 4: TIMELINE ══════════
function renderTimeline(proj) {
  const c = $("#planView"), tw = proj.numSprints * proj.weeksPerSprint, wks = getWeeks(proj);
  let h = '<div class="tl-wrap">';

  h += '<div class="tl-title">' + (proj.name || 'Project Timeline') + '</div>';
  h += '<div class="tl-subtitle"><i class="fas fa-calendar me-1"></i>' + (proj.startDate ? formatDate(new Date(proj.startDate + "T00:00:00")) : '') + ' — ' + (wks.length ? formatDate(wks[wks.length - 1].end) : '') + '</div>';

  h += '<div class="tl-header"><div class="tl-label-hdr"></div><div class="tl-weeks-hdr">';
  wks.forEach(w => {
    const s = sprintOf(w.num, proj.weeksPerSprint);
    h += '<div class="tl-week-pill"><span class="tl-week-pill-inner">Sprint ' + s + ' · Wk ' + w.num + '</span></div>';
  });
  h += '</div></div>';

  proj.actions.forEach((a, idx) => {
    const dark = darkenHex(a.color, 0.25);
    h += '<div class="tl-row">';
    h += '<div class="tl-row-label"><div class="tl-pill-badge" style="background:' + a.color + ';color:' + contrastText(a.color) + '">' + String(idx + 1).padStart(2, "0") + ' – ' + a.name + '</div></div>';
    h += '<div class="tl-row-weeks" style="position:relative">';

    h += '<div class="tl-grid-bg">';
    for (let w = 0; w < tw; w++) h += '<div class="tl-grid-col"></div>';
    h += '</div>';

    const startPct = ((a.startWeek - 1) / tw) * 100;
    const widthPct = ((a.endWeek - a.startWeek + 1) / tw) * 100;
    const grad = "linear-gradient(135deg, " + a.color + " 0%, " + dark + " 100%)";
    h += '<div class="tl-bar" style="left:' + startPct + '%;width:' + widthPct + '%;background:' + grad + ';color:' + contrastText(a.color) + '">' + String(idx + 1).padStart(2, "0") + '</div>';

    for (let w = 0; w < tw; w++) h += '<div class="tl-week-slot"></div>';

    h += '</div></div>';
  });

  h += '</div>';
  c.innerHTML = h;
}

// ── Export PNG ────────────────────────────────────────────────
function exportImage() {
  new bootstrap.Tab($("#tab-plan")).show();
  setTimeout(() => {
    renderPlan();
    setTimeout(() => {
      const node = $("#planView");
      if (!node || !node.innerHTML.trim()) { showToast("Add items and apply config first.", "warning"); return; }
      html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(canvas => {
        const link = document.createElement("a");
        link.download = (gatherProjectData().name || "project-plan") + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("Image exported!", "info");
      });
    }, 200);
  }, 200);
}

// ── Export JSON ──────────────────────────────────────────────
function exportJSON() {
  const p = gatherProjectData();
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.download = (p.name || "project") + ".json";
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast("JSON exported!", "info");
}

// ── Import JSON ──────────────────────────────────────────────
function triggerImportJSON() {
  const inp = $("#jsonFileInput");
  inp.value = "";
  inp.click();
}

function handleImportJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.name || !data.numSprints || !data.weeksPerSprint || !data.startDate || !Array.isArray(data.actions)) {
        showToast("Invalid JSON: missing required fields (name, numSprints, weeksPerSprint, startDate, actions).", "danger");
        return;
      }

      for (let i = 0; i < data.actions.length; i++) {
        const a = data.actions[i];
        if (!a.name || !a.startWeek || !a.endWeek || !a.color) {
          showToast("Invalid JSON: action item #" + (i + 1) + " is missing required fields.", "danger");
          return;
        }
      }

      data.id = uid();
      upsertProject(data);
      showToast("Project \"" + data.name + "\" imported successfully!", "success");
      openProject(data.id);

    } catch (err) {
      showToast("Failed to parse JSON: " + err.message, "danger");
    }
  };
  reader.onerror = function () {
    showToast("Error reading file.", "danger");
  };
  reader.readAsText(file);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  showDashboard();

  // Bind the hidden file input for JSON import
  $("#jsonFileInput").addEventListener("change", handleImportJSON);

  // Listen for changes on numSprints and weeksPerSprint to immediately update dropdowns
  $("#numSprints").addEventListener("input", () => { updateWeekDropdowns(); });
  $("#numSprints").addEventListener("change", () => { updateWeekDropdowns(); });
  $("#weeksPerSprint").addEventListener("input", () => { updateWeekDropdowns(); });
  $("#weeksPerSprint").addEventListener("change", () => { updateWeekDropdowns(); });

  // General input listener for auto-render on plan tab
  document.addEventListener("input", e => {
    if (e.target.closest("#actionItemsBody")) {
      clearTimeout(window._rt);
      window._rt = setTimeout(() => { if ($("#pane-plan").classList.contains("show")) renderPlan(); }, 300);
    }
  });
  document.addEventListener("change", e => {
    if (e.target.closest("#actionItemsBody")) {
      if ($("#pane-plan").classList.contains("show")) renderPlan();
    }
  });
});
