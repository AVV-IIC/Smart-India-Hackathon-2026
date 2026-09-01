/* ==========================================================================
   SIH 2026 Core Team Dashboard Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

// App State
const state = {
  activeTab: 'overview',
  analysisScope: 'all', // 'all', 'accepted', 'not_accepted', 'onboard', 'offboard', 'has_mentor', 'no_mentor', 'id_error', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6'
  activeDept: 'all',
  searchQuery: '',
  currentPage: 1,
  pageSize: 25,
  theme: localStorage.getItem('sih_theme') || 'light'
};

function initDashboard() {
  applyTheme(state.theme);
  setupEventListeners();
  populateDepartmentDropdown();
  updateDashboardViews();
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('sih_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

function setupEventListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Scope Choice Buttons / Selector
  const scopeBtns = document.querySelectorAll('.scope-btn');
  scopeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scopeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sc = btn.getAttribute('data-scope');
      state.analysisScope = sc;
      
      const scopeSelect = document.getElementById('analysisScopeSelect');
      if (scopeSelect) scopeSelect.value = sc;

      state.currentPage = 1;
      updateDashboardViews();
    });
  });

  const scopeSelect = document.getElementById('analysisScopeSelect');
  if (scopeSelect) {
    scopeSelect.addEventListener('change', (e) => {
      const sc = e.target.value;
      state.analysisScope = sc;
      
      // Sync buttons if present
      scopeBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-scope') === sc);
      });

      state.currentPage = 1;
      updateDashboardViews();
    });
  }

  // Navigation Tabs
  const tabBtns = document.querySelectorAll('.tabbtn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      state.currentPage = 1;
      renderDirectoryTable();
    });
  }

  // Department Dropdown
  const deptFilter = document.getElementById('deptFilter');
  if (deptFilter) {
    deptFilter.addEventListener('change', (e) => {
      state.activeDept = e.target.value;
      state.currentPage = 1;
      renderDirectoryTable();
    });
  }

  // Page Size Dropdown
  const pageSizeFilter = document.getElementById('pageSizeFilter');
  if (pageSizeFilter) {
    pageSizeFilter.addEventListener('change', (e) => {
      state.pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
      state.currentPage = 1;
      renderDirectoryTable();
    });
  }

  // Filter Pills (inside Directory)
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const pillVal = pill.getAttribute('data-pill');
      state.analysisScope = pillVal;
      
      // Sync scope select if present
      if (scopeSelect) scopeSelect.value = pillVal;
      scopeBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-scope') === pillVal);
      });

      state.currentPage = 1;
      updateDashboardViews();
    });
  });

  // Reset Filters
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.activeDept = 'all';
      state.analysisScope = 'all';
      state.currentPage = 1;
      
      if (searchInput) searchInput.value = '';
      if (deptFilter) deptFilter.value = 'all';
      if (scopeSelect) scopeSelect.value = 'all';
      
      pills.forEach(p => p.classList.remove('active'));
      const defaultPill = document.querySelector('.filter-pill[data-pill="all"]');
      if (defaultPill) defaultPill.classList.add('active');

      scopeBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-scope') === 'all');
      });

      updateDashboardViews();
    });
  }

  // Export CSV
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportFilteredCsv);
  }

  // Modal Close
  const modalClose = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tabpanel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });
  renderCurrentTab();
}

function updateDashboardViews() {
  updateScopeBanner();
  updateTopMetrics();
  updatePillCounts();
  renderCurrentTab();
}

function getScopedTeams() {
  const scope = state.analysisScope || 'all';
  return DATA.teams.filter(t => {
    if (scope === 'accepted') return t.accepted === 'Accepted';
    if (scope === 'not_accepted') return t.accepted !== 'Accepted';
    if (scope === 'onboard') return t.onboard === 'On board';
    if (scope === 'offboard') return t.onboard === 'Off board';
    if (scope === 'has_mentor') return t.has_mentor === true;
    if (scope === 'no_mentor') return t.has_mentor === false;
    if (scope === 'id_error') return t.id_error === true;
    if (scope === 'b1') return t.num_branches === 1;
    if (scope === 'b2') return t.num_branches === 2;
    if (scope === 'b3') return t.num_branches === 3;
    if (scope === 'b4') return t.num_branches === 4;
    if (scope === 'b5') return t.num_branches === 5;
    if (scope === 'b6') return t.num_branches === 6;
    return true; // 'all'
  });
}

function calcGenderStats(tlist) {
  let male = 0;
  let female = 0;
  tlist.forEach(t => {
    (t.members || []).forEach(m => {
      if (m.gender === 'M') male++;
      else if (m.gender === 'F') female++;
    });
  });

  const total = male + female;
  const ratioStr = female > 0 ? `${(male / female).toFixed(2)} : 1` : `${male} : 0`;
  const mPct = total > 0 ? ((male / total) * 100).toFixed(1) : '0.0';
  const fPct = total > 0 ? ((female / total) * 100).toFixed(1) : '0.0';
  return { male, female, total, ratioStr, mPct, fPct };
}

function updateScopeBanner() {
  const banner = document.getElementById('scopeIndicatorBanner');
  if (!banner) return;

  const scoped = getScopedTeams();
  const gstats = calcGenderStats(scoped);

  const scopeNames = {
    'all': 'All Registered Teams (455 Teams)',
    'accepted': `Accepted Teams Only (${DATA.summary.accepted_teams} Teams)`,
    'not_accepted': `Not Accepted Teams Only (${DATA.summary.not_accepted_teams} Teams)`,
    'onboard': `On Board Teams Only (${DATA.summary.onboard_teams} Teams)`,
    'offboard': `Off Board Teams Only (${DATA.summary.offboard_teams} Teams)`,
    'has_mentor': `Teams with Mentor Assigned (${DATA.summary.mentor_assigned_teams} Teams)`,
    'no_mentor': `Teams Needing Mentor (${DATA.summary.no_mentor_teams} Teams)`,
    'id_error': `Teams with ID Error Flags (${DATA.summary.id_error_teams} Teams)`,
    'b1': 'Teams Represented by a Single Branch (259 Teams)',
    'b2': 'Teams with 2 Branches (119 Teams)',
    'b3': 'Teams with 3 Branches (50 Teams)',
    'b4': 'Teams with 4 Branches (21 Teams)',
    'b5': 'Teams with 5 Branches (5 Teams)',
    'b6': 'Fully Mixed Teams – 6 Branches (1 Team)'
  };

  const name = scopeNames[state.analysisScope] || 'Custom Scope';

  banner.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <span style="font-weight:700;color:var(--accent-blue);">📊 Active Analysis Scope Choice:</span>
        <strong style="font-size:14px;color:var(--text-main);margin-left:6px;">${name}</strong>
      </div>
      <div style="font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:12px;">
        <span><strong>${scoped.length} Teams</strong> (${gstats.total.toLocaleString('en-IN')} Students)</span>
        <span class="status-badge accepted" style="font-weight:700;">♂️:♀️ M:F Ratio = ${gstats.ratioStr} (${gstats.mPct}% M / ${gstats.fPct}% F)</span>
      </div>
    </div>
  `;
}

function updateTopMetrics() {
  const scoped = getScopedTeams();
  
  const totalTeams = scoped.length;
  const accepted = scoped.filter(t => t.accepted === 'Accepted').length;
  const idErrors = scoped.filter(t => t.id_error).length;
  const onboard = scoped.filter(t => t.onboard === 'On board').length;
  const offboard = scoped.filter(t => t.onboard === 'Off board').length;
  const hasMentor = scoped.filter(t => t.has_mentor).length;
  const totalParticipants = scoped.reduce((sum, t) => sum + (t.members ? t.members.length : 0), 0);
  
  const gstats = calcGenderStats(scoped);

  document.getElementById('metricTotalTeams').textContent = totalTeams;
  document.getElementById('metricAcceptedTeams').textContent = accepted;
  document.getElementById('metricIdErrors').textContent = idErrors;
  document.getElementById('metricOnBoard').textContent = onboard;
  document.getElementById('metricOffBoard').textContent = offboard;
  document.getElementById('metricMentorsAssigned').textContent = hasMentor;
  document.getElementById('metricTotalParticipants').textContent = totalParticipants.toLocaleString('en-IN');
  
  const mfElem = document.getElementById('metricMfRatio');
  if (mfElem) {
    mfElem.textContent = `${gstats.ratioStr}`;
  }
  const mfSubElem = document.getElementById('metricMfSub');
  if (mfSubElem) {
    mfSubElem.textContent = `${gstats.mPct}% M / ${gstats.fPct}% F`;
  }
}

function updatePillCounts() {
  const summary = DATA.summary;
  if (!summary) return;
  
  const pAll = document.getElementById('pillCountAll');
  if (pAll) pAll.textContent = summary.total_registrations;
  
  const pAcc = document.getElementById('pillCountAccepted');
  if (pAcc) pAcc.textContent = summary.accepted_teams;
  
  const pErr = document.getElementById('pillCountIdError');
  if (pErr) pErr.textContent = summary.id_error_teams;
  
  const pNot = document.getElementById('pillCountNotAccepted');
  if (pNot) pNot.textContent = summary.not_accepted_teams;
  
  const pOn = document.getElementById('pillCountOnBoard');
  if (pOn) pOn.textContent = summary.onboard_teams;
  
  const pOff = document.getElementById('pillCountOffBoard');
  if (pOff) pOff.textContent = summary.offboard_teams;
  
  const pHm = document.getElementById('pillCountHasMentor');
  if (pHm) pHm.textContent = summary.mentor_assigned_teams;
  
  const pNm = document.getElementById('pillCountNoMentor');
  if (pNm) pNm.textContent = summary.no_mentor_teams;
}

function populateDepartmentDropdown() {
  const deptFilter = document.getElementById('deptFilter');
  if (!deptFilter) return;

  const depts = new Set();
  DATA.teams.forEach(t => {
    if (t.dept_raw) depts.add(t.dept_raw.trim ? t.dept_raw.trim() : t.dept_raw);
  });

  const sortedDepts = Array.from(depts).sort();
  sortedDepts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    deptFilter.appendChild(opt);
  });
}

function getFilteredDirectoryTeams() {
  const scoped = getScopedTeams();

  return scoped.filter(t => {
    // Search filter
    if (state.searchQuery) {
      const q = state.searchQuery;
      const tid = (t.formatted_id || t.id || '').toLowerCase();
      const tname = (t.team || '').toLowerCase();
      const leader = (t.leader || '').toLowerCase();
      const mentor = (t.mentor || '').toLowerCase();
      const ps = (t.problem_statement || '').toLowerCase();
      const gh = (t.github_username || '').toLowerCase();
      const membersMatch = t.members && t.members.some(m => 
        (m.name || '').toLowerCase().includes(q) || (m.roll || '').toLowerCase().includes(q)
      );

      const match = tid.includes(q) || tname.includes(q) || leader.includes(q) || 
                    mentor.includes(q) || ps.includes(q) || gh.includes(q) || membersMatch;
      if (!match) return false;
    }

    // Department filter
    if (state.activeDept !== 'all') {
      if (t.dept_raw !== state.activeDept) return false;
    }

    return true;
  });
}

function renderCurrentTab() {
  renderDirectoryTable();
  
  if (state.activeTab === 'overview') {
    renderOverviewAnalytics();
  } else if (state.activeTab === 'veracity') {
    renderVeracityTab();
  } else if (state.activeTab === 'composition') {
    renderCompositionTab();
  } else if (state.activeTab === 'mentors') {
    renderMentorsTab();
  } else if (state.activeTab === 'timeline') {
    renderTimelineTab();
  } else if (state.activeTab === 'github') {
    renderGithubTab();
  }
}

function renderDirectoryTable() {
  const tbody = document.getElementById('directoryTbody');
  if (!tbody) return;

  const filtered = getFilteredDirectoryTeams();
  const total = filtered.length;

  // Pagination bounds
  let startIdx = 0;
  let endIdx = total;
  
  if (state.pageSize !== 'all') {
    const ps = parseInt(state.pageSize, 10);
    startIdx = (state.currentPage - 1) * ps;
    endIdx = Math.min(startIdx + ps, total);
  }

  const pageTeams = filtered.slice(startIdx, endIdx);

  // Update showing counter
  const counter = document.getElementById('showingCounter');
  if (counter) {
    if (total === 0) {
      counter.textContent = 'Showing 0 teams';
    } else {
      counter.textContent = `Showing ${startIdx + 1}-${endIdx} of ${total} teams (Scoped: ${getScopedTeams().length})`;
    }
  }

  // Render Rows
  tbody.innerHTML = '';
  if (pageTeams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted);">No teams match the selected scope and filter criteria.</td></tr>`;
    renderPaginationControls(0);
    return;
  }

  pageTeams.forEach(t => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => openTeamModal(t));

    const tidBadge = `<span class="team-id-badge">${t.formatted_id || 'SIH26-A0H-T' + String(t.id).padStart(3,'0')}</span>`;
    
    const acceptedBadge = t.accepted === 'Accepted' 
      ? `<span class="status-badge accepted">✓ Accepted</span>` 
      : `<span class="status-badge error">Not Accepted</span>`;
    
    const onboardBadge = t.onboard === 'Off board' 
      ? `<span class="status-badge offboard">Off Board</span>` 
      : `<span class="status-badge onboard">On Board</span>`;

    const idErrorBadge = t.id_error 
      ? `<span class="status-badge error">⚠️ ID Error</span>` 
      : `<span class="status-badge onboard">OK</span>`;

    const psDisplay = t.problem_statement 
      ? `<span class="team-id-badge" style="background:var(--accent-blue-soft);color:var(--accent-blue);">${escapeHtml(t.problem_statement)}</span>` 
      : `<span style="color:var(--text-faint);">N/A</span>`;

    const ghDisplay = t.github_username 
      ? `<a href="https://github.com/${escapeHtml(t.github_username)}" target="_blank" style="color:var(--accent-blue);font-weight:600;text-decoration:none;" onclick="event.stopPropagation();">@${escapeHtml(t.github_username)}</a>` 
      : `<span style="color:var(--text-faint);">-</span>`;

    const mentorDisplay = t.has_mentor 
      ? escapeHtml(t.mentor) 
      : `<span style="color:var(--color-red);font-weight:600;">No Mentor</span>`;

    const deptDisplay = t.dept_raw ? escapeHtml(t.dept_raw) : `<span style="color:var(--text-faint);">N/A</span>`;

    tr.innerHTML = `
      <td>${tidBadge}</td>
      <td><strong>${escapeHtml(t.team)}</strong></td>
      <td>${escapeHtml(t.leader)}</td>
      <td>${psDisplay}</td>
      <td>${acceptedBadge}</td>
      <td>${onboardBadge}</td>
      <td>${idErrorBadge}</td>
      <td>${mentorDisplay}</td>
      <td>${ghDisplay}</td>
      <td>${deptDisplay}</td>
      <td><button class="btn-action" style="padding:4px 10px;font-size:11.5px;">View Details</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderPaginationControls(total);
}

function renderPaginationControls(totalResults) {
  const container = document.getElementById('paginationControls');
  if (!container) return;

  container.innerHTML = '';
  if (state.pageSize === 'all' || totalResults === 0) return;

  const totalPages = Math.ceil(totalResults / state.pageSize);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '◄ Prev';
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderDirectoryTable();
    }
  });
  container.appendChild(prevBtn);

  // Show page numbers
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= state.currentPage - 2 && p <= state.currentPage + 2)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`;
      pBtn.textContent = p;
      pBtn.addEventListener('click', () => {
        state.currentPage = p;
        renderDirectoryTable();
      });
      container.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = 'Next ►';
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderDirectoryTable();
    }
  });
  container.appendChild(nextBtn);
}

function openTeamModal(team) {
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (!modalBackdrop || !modalBody) return;

  modalTitle.textContent = `${team.team} (${team.formatted_id || 'SIH26-A0H-T' + team.id})`;

  let membersHtml = '';
  if (team.members && team.members.length > 0) {
    membersHtml = `
      <table class="data-table" style="margin-top:12px;">
        <thead>
          <tr>
            <th>Role</th>
            <th>Member Name</th>
            <th>Roll Number</th>
            <th>Branch</th>
            <th>Year</th>
            <th>Gender</th>
          </tr>
        </thead>
        <tbody>
          ${team.members.map(m => `
            <tr>
              <td><strong>${escapeHtml(m.slot)}</strong></td>
              <td>${escapeHtml(m.name)}</td>
              <td><code>${escapeHtml(m.roll)}</code></td>
              <td>${escapeHtml(m.branch || '-')}</td>
              <td>${m.yearOfStudy || '-'}</td>
              <td>${m.gender || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  modalBody.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:13px;">
      <div><strong>Leader:</strong> ${escapeHtml(team.leader)}</div>
      <div><strong>Accepted Status:</strong> ${team.accepted}</div>
      <div><strong>Onboard Status:</strong> ${team.onboard}</div>
      <div><strong>ID Error Flag:</strong> ${team.id_error ? 'ID Error' : 'OK'}</div>
      <div><strong>Mentor:</strong> ${escapeHtml(team.mentor || 'No Mentor')}</div>
      <div><strong>Department:</strong> ${escapeHtml(team.dept_raw || 'N/A')}</div>
      <div><strong>Problem Statement:</strong> ${escapeHtml(team.problem_statement || 'N/A')}</div>
      <div><strong>Unique Branches:</strong> ${team.num_branches || 1} Branches</div>
      <div><strong>GitHub Leader:</strong> ${team.github_username ? `<a href="https://github.com/${escapeHtml(team.github_username)}" target="_blank" style="color:var(--accent-blue);font-weight:600;">@${escapeHtml(team.github_username)}</a>` : 'N/A'}</div>
      <div><strong>Email:</strong> ${escapeHtml(team.email || 'N/A')}</div>
      <div><strong>WhatsApp:</strong> ${escapeHtml(team.wa_norm || team.wa_raw || 'N/A')}</div>
    </div>
    <h4 style="font-size:14px;margin-top:16px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Team Roster (${team.members ? team.members.length : 0} Members)</h4>
    ${membersHtml}
  `;

  modalBackdrop.classList.add('open');
}

function closeModal() {
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
}

function exportFilteredCsv() {
  const filtered = getFilteredDirectoryTeams();
  if (filtered.length === 0) {
    alert('No data to export!');
    return;
  }

  const headers = ['Team ID', 'Team Name', 'Problem Statement', 'Accepted Status', 'Leader', 'WhatsApp', 'Mentor', 'Department', 'Status', 'ID Error', 'Branches Count', 'GitHub Username', 'Member 1 Name', 'Member 1 Roll', 'Member 2 Name', 'Member 2 Roll', 'Member 3 Name', 'Member 3 Roll', 'Member 4 Name', 'Member 4 Roll', 'Member 5 Name', 'Member 5 Roll'];
  
  const rows = [headers.join(',')];
  filtered.forEach(t => {
    const mems = (t.members || []).slice(1);
    const memFlat = [];
    for (let i = 0; i < 5; i++) {
      memFlat.push(mems[i] ? mems[i].name : '');
      memFlat.push(mems[i] ? mems[i].roll : '');
    }
    const r = [
      t.formatted_id || t.id,
      t.team,
      t.problem_statement || '',
      t.accepted,
      t.leader,
      t.wa_norm || t.wa_raw || '',
      t.mentor,
      t.dept_raw || '',
      t.onboard,
      t.id_error ? 'YES' : 'NO',
      t.num_branches || 1,
      t.github_username || '',
      ...memFlat
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`);
    rows.push(r.join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SIH2026_Teams_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   Analytical Views Renderers (Dynamically re-computed for state.analysisScope)
   ========================================================================== */

function renderOverviewAnalytics() {
  const container = document.getElementById('overviewAnalyticsContainer');
  if (!container) return;

  const scoped = getScopedTeams();
  const total = scoped.length;

  if (total === 0) {
    container.innerHTML = `<div class="chart-card"><p style="color:var(--text-muted);">No teams in selected analysis scope.</p></div>`;
    return;
  }

  const acceptedCount = scoped.filter(t => t.accepted === 'Accepted').length;
  const onboardCount = scoped.filter(t => t.onboard === 'On board').length;
  const mentorCount = scoped.filter(t => t.has_mentor).length;
  const githubCount = scoped.filter(t => t.github_username).length;
  
  const gstats = calcGenderStats(scoped);

  const accPct = ((acceptedCount / total) * 100).toFixed(1);
  const onPct = ((onboardCount / total) * 100).toFixed(1);
  const hmPct = ((mentorCount / total) * 100).toFixed(1);
  const ghPct = ((githubCount / total) * 100).toFixed(1);

  container.innerHTML = `
    <div class="analytics-grid">
      <div class="chart-card">
        <h3>Male to Female (M:F) Gender Ratio</h3>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Male Students: <strong>${gstats.male}</strong></span>
            <span>${gstats.mPct}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${gstats.mPct}%;height:100%;background:var(--accent-blue);"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Female Students: <strong>${gstats.female}</strong></span>
            <span>${gstats.fPct}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${gstats.fPct}%;height:100%;background:var(--color-purple);"></div>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border-color);font-size:12px;font-weight:700;color:var(--text-main);">
          M:F Ratio = ${gstats.ratioStr}
        </div>
      </div>

      <div class="chart-card">
        <h3>Selection Acceptance Ratio</h3>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Accepted Teams: <strong>${acceptedCount}</strong></span>
            <span>${accPct}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${accPct}%;height:100%;background:var(--accent-blue);"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Not Accepted Teams: <strong>${total - acceptedCount}</strong></span>
            <span>${(100 - accPct).toFixed(1)}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${100 - accPct}%;height:100%;background:var(--color-orange);"></div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>On Boarding Status Ratio</h3>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>On Board Teams: <strong>${onboardCount}</strong></span>
            <span>${onPct}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${onPct}%;height:100%;background:var(--color-green);"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Off Board Teams: <strong>${total - onboardCount}</strong></span>
            <span>${(100 - onPct).toFixed(1)}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${100 - onPct}%;height:100%;background:var(--color-red);"></div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Mentor Allocation Ratio</h3>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>Mentor Assigned: <strong>${mentorCount}</strong></span>
            <span>${hmPct}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${hmPct}%;height:100%;background:var(--accent-blue);"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>No Mentor Assigned: <strong>${total - mentorCount}</strong></span>
            <span>${(100 - hmPct).toFixed(1)}%</span>
          </div>
          <div style="height:10px;background:var(--bg-subtle);border-radius:10px;overflow:hidden;">
            <div style="width:${100 - hmPct}%;height:100%;background:var(--color-red);"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVeracityTab() {
  const container = document.getElementById('tab-veracity');
  if (!container) return;

  const scoped = getScopedTeams();
  const flaggedTeams = scoped.filter(t => t.flags && t.flags.length > 0);

  let rowsHtml = flaggedTeams.map(t => `
    <tr>
      <td><span class="team-id-badge">${t.formatted_id || 'SIH26-A0H-T' + String(t.id).padStart(3,'0')}</span></td>
      <td><strong>${escapeHtml(t.team)}</strong></td>
      <td>${escapeHtml(t.leader)}</td>
      <td>${t.flags.map(f => `<span class="status-badge error" style="margin-right:4px;">${escapeHtml(f.replace(/_/g,' '))}</span>`).join('')}</td>
      <td>${escapeHtml(t.onboard)}</td>
      <td>${escapeHtml(t.mentor)}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="chart-card" style="margin-bottom:20px;">
      <h3>Data Veracity &amp; Health Audit (Scoped Analysis)</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Audit analysis for the ${scoped.length} teams in active scope.</p>
      <div class="metrics-grid" style="grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));">
        <div class="metric-card"><div class="metric-label">Scoped Teams</div><div class="metric-val default">${scoped.length}</div></div>
        <div class="metric-card"><div class="metric-label">Flagged Teams</div><div class="metric-val orange">${flaggedTeams.length}</div></div>
        <div class="metric-card"><div class="metric-label">Clean Ratio</div><div class="metric-val green">${scoped.length > 0 ? (((scoped.length - flaggedTeams.length) / scoped.length) * 100).toFixed(1) : 0}%</div></div>
      </div>
    </div>

    <div class="table-card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;">
        Flagged Teams Directory (${flaggedTeams.length} Teams Flagged in Active Scope)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Leader</th>
              <th>Flagged Data Issues</th>
              <th>Onboard Status</th>
              <th>Mentor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center;padding:20px;">No flagged teams in active scope.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCompositionTab() {
  const container = document.getElementById('tab-composition');
  if (!container) return;

  const scoped = getScopedTeams();

  const schoolStats = {
    'School of Computing': { code: 'SC', count: 0, male: 0, female: 0, teams: new Set() },
    'School of Engineering': { code: 'EN', count: 0, male: 0, female: 0, teams: new Set() },
    'School of Artificial Intelligence': { code: 'AI', count: 0, male: 0, female: 0, teams: new Set() },
    'School of Physical Sciences': { code: 'PS', count: 0, male: 0, female: 0, teams: new Set() },
    'School of Law': { code: 'LW', count: 0, male: 0, female: 0, teams: new Set() }
  };

  const yearStats = {};
  const branchCounts = {};
  const branchDiversity = { 
    1: { teams: [], male: 0, female: 0, label: '259 teams consist of members from a single branch.' }, 
    2: { teams: [], male: 0, female: 0, label: '119 teams consist of members from two branches.' }, 
    3: { teams: [], male: 0, female: 0, label: '50 teams consist of members from three branches.' }, 
    4: { teams: [], male: 0, female: 0, label: '21 teams consist of members from four branches.' }, 
    5: { teams: [], male: 0, female: 0, label: '5 teams consist of members from five branches.' }, 
    6: { teams: [], male: 0, female: 0, label: '1 team consists of members from six different branches.' } 
  };

  let totalMembers = 0;
  let totalScopedMale = 0;
  let totalScopedFemale = 0;
  let femaleLeaders = 0;
  let allFemaleTeams = 0;
  let allMaleTeams = 0;

  let ug4yrCount = 0;
  let int5yrCount = 0;
  let pg2yrCount = 0;

  scoped.forEach(t => {
    let tMale = 0;
    let tFemale = 0;

    const bSet = new Set(t.members ? t.members.map(m => m.branch).filter(Boolean) : []);
    const numB = bSet.size > 0 ? (bSet.size > 6 ? 6 : bSet.size) : 1;
    if (branchDiversity[numB]) {
      branchDiversity[numB].teams.push(t);
    }

    (t.members || []).forEach((m, idx) => {
      totalMembers++;
      const y = m.yearOfStudy || 'Unknown';
      const g = m.gender || 'Unknown';
      const b = m.branch || 'Unknown';
      const r = m.roll || '';
      const prog = m.program || 'U4';

      if (prog === 'U4') ug4yrCount++;
      else if (prog === 'I5') int5yrCount++;
      else if (prog === 'P2') pg2yrCount++;

      let sName = 'School of Engineering';
      if (r.includes('.SC.')) sName = 'School of Computing';
      else if (r.includes('.EN.')) sName = 'School of Engineering';
      else if (r.includes('.AI.')) sName = 'School of Artificial Intelligence';
      else if (r.includes('.PS.')) sName = 'School of Physical Sciences';
      else if (r.includes('.LW.')) sName = 'School of Law';

      if (!schoolStats[sName]) {
        schoolStats[sName] = { code: 'OTHER', count: 0, male: 0, female: 0, teams: new Set() };
      }
      schoolStats[sName].count++;
      if (g === 'M') schoolStats[sName].male++;
      else if (g === 'F') schoolStats[sName].female++;
      schoolStats[sName].teams.add(t.formatted_id || t.id);

      if (!yearStats[y]) yearStats[y] = { total: 0, male: 0, female: 0, leaders: 0 };
      yearStats[y].total++;

      if (g === 'M') {
        yearStats[y].male++;
        tMale++;
        totalScopedMale++;
        if (branchDiversity[numB]) branchDiversity[numB].male++;
      } else if (g === 'F') {
        yearStats[y].female++;
        tFemale++;
        totalScopedFemale++;
        if (branchDiversity[numB]) branchDiversity[numB].female++;
      }

      if (idx === 0 && g === 'F') {
        yearStats[y].leaders++;
        femaleLeaders++;
      }

      if (!branchCounts[b]) branchCounts[b] = { count: 0, male: 0, female: 0, teams: new Set() };
      branchCounts[b].count++;
      if (g === 'M') branchCounts[b].male++;
      else if (g === 'F') branchCounts[b].female++;
      branchCounts[b].teams.add(t.formatted_id || t.id);
    });

    if (tFemale > 0 && tMale === 0) allFemaleTeams++;
    if (tMale > 0 && tFemale === 0) allMaleTeams++;
  });

  const overallMfRatio = totalScopedFemale > 0 ? `${(totalScopedMale / totalScopedFemale).toFixed(2)} : 1` : `${totalScopedMale} : 0`;
  const overallMPct = totalMembers > 0 ? ((totalScopedMale / totalMembers) * 100).toFixed(1) : '0.0';
  const overallFPct = totalMembers > 0 ? ((totalScopedFemale / totalMembers) * 100).toFixed(1) : '0.0';

  const sortedSchools = Object.entries(schoolStats).sort((a,b) => b[1].count - a[1].count);
  let schoolRowsHtml = sortedSchools.map(([sName, sData]) => {
    const sRatio = sData.female > 0 ? `${(sData.male / sData.female).toFixed(2)} : 1` : `${sData.male} : 0`;
    const sMPct = sData.count > 0 ? ((sData.male / sData.count) * 100).toFixed(1) : '0.0';
    const sFPct = sData.count > 0 ? ((sData.female / sData.count) * 100).toFixed(1) : '0.0';
    const sShare = totalMembers > 0 ? ((sData.count / totalMembers) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td><strong>${escapeHtml(sName)}</strong></td>
        <td>${sData.count.toLocaleString('en-IN')} Students</td>
        <td>${sData.teams.size} Teams</td>
        <td><span style="color:var(--accent-blue);font-weight:600;">${sData.male} M</span> / <span style="color:var(--color-purple);font-weight:600;">${sData.female} F</span></td>
        <td><span class="status-badge accepted" style="font-weight:700;">M:F = ${sRatio}</span></td>
        <td><strong>${sMPct}% M / ${sFPct}% F</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="height:8px;background:var(--bg-subtle);border-radius:4px;overflow:hidden;width:100px;">
              <div style="width:${sShare}%;height:100%;background:var(--accent-blue);"></div>
            </div>
            <span style="font-size:12px;color:var(--text-muted);">${sShare}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const sortedYears = Object.keys(yearStats).sort((a,b) => String(a).localeCompare(String(b)));
  
  let yearRowsHtml = sortedYears.map(y => {
    const s = yearStats[y];
    const fpct = s.total > 0 ? ((s.female / s.total) * 100).toFixed(1) : '0.0';
    const mpct = s.total > 0 ? ((s.male / s.total) * 100).toFixed(1) : '0.0';
    const ratioStr = s.female > 0 ? `${(s.male / s.female).toFixed(2)} : 1` : `${s.male} : 0`;
    const share = totalMembers > 0 ? ((s.total / totalMembers) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td><strong>Year ${escapeHtml(y)}</strong></td>
        <td>${s.total.toLocaleString('en-IN')} Students</td>
        <td><span style="color:var(--accent-blue);font-weight:600;">${s.male} Male</span></td>
        <td><span style="color:var(--color-purple);font-weight:600;">${s.female} Female</span></td>
        <td><span class="status-badge accepted" style="font-weight:700;">M:F = ${ratioStr}</span></td>
        <td><strong>${mpct}% M / ${fpct}% F</strong></td>
        <td>${s.leaders} Female Leaders</td>
        <td>
          <div style="height:8px;background:var(--bg-subtle);border-radius:4px;overflow:hidden;width:100px;">
            <div style="width:${share}%;height:100%;background:var(--accent-blue);"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const categoryRatios = [
    { label: 'All Registered Teams (455)', filter: t => true },
    { label: `Accepted Teams Only (${DATA.summary.accepted_teams})`, filter: t => t.accepted === 'Accepted' },
    { label: `Not Accepted Teams (${DATA.summary.not_accepted_teams})`, filter: t => t.accepted !== 'Accepted' },
    { label: `On Board Teams (${DATA.summary.onboard_teams})`, filter: t => t.onboard === 'On board' },
    { label: `Off Board Teams (${DATA.summary.offboard_teams})`, filter: t => t.onboard === 'Off board' },
    { label: `Has Mentor Assigned (${DATA.summary.mentor_assigned_teams})`, filter: t => t.has_mentor },
    { label: `No Mentor Teams (${DATA.summary.no_mentor_teams})`, filter: t => !t.has_mentor },
    { label: `ID Error Teams (${DATA.summary.id_error_teams})`, filter: t => t.id_error },
    { label: 'Single Branch Teams (259)', filter: t => t.num_branches === 1 },
    { label: '2 Branches Teams (119)', filter: t => t.num_branches === 2 },
    { label: '3 Branches Teams (50)', filter: t => t.num_branches === 3 },
    { label: '4 Branches Teams (21)', filter: t => t.num_branches === 4 },
    { label: '5 Branches Teams (5)', filter: t => t.num_branches === 5 },
    { label: '6 Branches Teams (1)', filter: t => t.num_branches === 6 }
  ];

  let categoryMfRowsHtml = categoryRatios.map(cat => {
    const cTeams = DATA.teams.filter(cat.filter);
    const cStats = calcGenderStats(cTeams);
    return `
      <tr>
        <td><strong>${escapeHtml(cat.label)}</strong></td>
        <td>${cTeams.length} Teams</td>
        <td>${cStats.total.toLocaleString('en-IN')} Students</td>
        <td><span style="color:var(--accent-blue);font-weight:600;">${cStats.male} Male</span></td>
        <td><span style="color:var(--color-purple);font-weight:600;">${cStats.female} Female</span></td>
        <td><span class="status-badge accepted" style="font-weight:700;">M:F = ${cStats.ratioStr}</span></td>
        <td><strong>${cStats.mPct}% M / ${cStats.fPct}% F</strong></td>
      </tr>
    `;
  }).join('');

  const divCategories = [
    { key: 1, label: '259 teams consist of members from a single branch.', bdata: branchDiversity[1] },
    { key: 2, label: '119 teams consist of members from two branches.', bdata: branchDiversity[2] },
    { key: 3, label: '50 teams consist of members from three branches.', bdata: branchDiversity[3] },
    { key: 4, label: '21 teams consist of members from four branches.', bdata: branchDiversity[4] },
    { key: 5, label: '5 teams consist of members from five branches.', bdata: branchDiversity[5] },
    { key: 6, label: '1 team consists of members from six different branches.', bdata: branchDiversity[6] }
  ];

  let divRowsHtml = divCategories.map(c => {
    const tCount = c.bdata ? c.bdata.teams.length : 0;
    const mCount = c.bdata ? c.bdata.male : 0;
    const fCount = c.bdata ? c.bdata.female : 0;
    const totMem = mCount + fCount;

    const ratioStr = fCount > 0 ? `${(mCount / fCount).toFixed(2)} : 1` : `${mCount} : 0`;
    const mPct = totMem > 0 ? ((mCount / totMem) * 100).toFixed(1) : '0.0';
    const fPct = totMem > 0 ? ((fCount / totMem) * 100).toFixed(1) : '0.0';
    const pct = scoped.length > 0 ? ((tCount / scoped.length) * 100).toFixed(1) : '0.0';

    return `
      <tr>
        <td><strong>${escapeHtml(c.label)}</strong></td>
        <td><span class="team-id-badge">${c.key} ${c.key === 1 ? 'Branch' : 'Branches'}</span></td>
        <td><strong>${tCount} Teams</strong></td>
        <td><span style="color:var(--accent-blue);font-weight:600;">${mCount} M</span> / <span style="color:var(--color-purple);font-weight:600;">${fCount} F</span></td>
        <td><span class="status-badge accepted" style="font-weight:700;">M:F = ${ratioStr}</span></td>
        <td><strong>${mPct}% M / ${fPct}% F</strong></td>
        <td><strong>${pct}%</strong> of Scope</td>
      </tr>
    `;
  }).join('');

  const sortedBranches = Object.entries(branchCounts).sort((a,b) => b[1].count - a[1].count);
  let branchRowsHtml = sortedBranches.map(([branch, bdata]) => {
    const share = totalMembers > 0 ? ((bdata.count / totalMembers) * 100).toFixed(1) : '0.0';
    const bRatio = bdata.female > 0 ? `${(bdata.male / bdata.female).toFixed(2)} : 1` : `${bdata.male} : 0`;
    const bMPct = bdata.count > 0 ? ((bdata.male / bdata.count) * 100).toFixed(1) : '0.0';
    const bFPct = bdata.count > 0 ? ((bdata.female / bdata.count) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td><strong>${escapeHtml(branch)}</strong></td>
        <td>${bdata.count.toLocaleString('en-IN')} Students</td>
        <td>${bdata.teams.size} Teams</td>
        <td><span style="color:var(--accent-blue);font-weight:600;">${bdata.male} M</span> / <span style="color:var(--color-purple);font-weight:600;">${bdata.female} F</span></td>
        <td><span class="status-badge accepted" style="font-weight:700;">M:F = ${bRatio}</span></td>
        <td><strong>${bMPct}% M / ${bFPct}% F</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="height:8px;background:var(--bg-subtle);border-radius:4px;overflow:hidden;width:90px;">
              <div style="width:${share}%;height:100%;background:var(--color-purple);"></div>
            </div>
            <span style="font-size:12px;color:var(--text-muted);">${share}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const femaleLedPct = scoped.length > 0 ? ((femaleLeaders / scoped.length) * 100).toFixed(1) : '0.0';

  container.innerHTML = `
    <!-- Top Male to Female Ratio Hero Banner -->
    <div class="chart-card" style="background:var(--accent-blue-soft);border:2px solid var(--accent-blue-border);margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <span style="font-size:12px;font-weight:700;letter-spacing:0.05em;color:var(--accent-blue);text-transform:uppercase;">GENDER DIVERSITY &amp; RATIO SUMMARY</span>
          <h2 style="font-size:26px;font-weight:800;color:var(--text-main);margin-top:4px;">♂️:♀️ Male to Female Ratio = <span style="color:var(--accent-blue);">${overallMfRatio}</span></h2>
          <p style="font-size:13.5px;color:var(--text-muted);margin-top:4px;">
            Active Scope Breakdown: <strong>${totalScopedMale.toLocaleString('en-IN')} Male Students (${overallMPct}%)</strong> vs <strong>${totalScopedFemale.toLocaleString('en-IN')} Female Students (${overallFPct}%)</strong> across <strong>${scoped.length} Teams</strong>.
          </p>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="metric-card" style="background:var(--bg-card);padding:14px 18px;min-width:140px;">
            <div class="metric-label">FEMALE LEADERS</div>
            <div class="metric-val purple">${femaleLeaders}</div>
            <div style="font-size:11px;color:var(--text-muted);">${femaleLedPct}% of Teams</div>
          </div>
          <div class="metric-card" style="background:var(--bg-card);padding:14px 18px;min-width:140px;">
            <div class="metric-label">ALL-FEMALE TEAMS</div>
            <div class="metric-val green">${allFemaleTeams}</div>
            <div style="font-size:11px;color:var(--text-muted);">Teams</div>
          </div>
        </div>
      </div>
    </div>

    <!-- School-wise Breakdown Table -->
    <div class="table-card" style="margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;color:var(--accent-blue);">
        🏛️ School-wise Breakdown (School of Computing, Engineering, AI, Physical Sciences, Law)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Student Participants</th>
              <th>Teams Represented</th>
              <th>Male / Female Breakdown</th>
              <th>Male : Female Ratio</th>
              <th>Gender Share</th>
              <th>Share of Total</th>
            </tr>
          </thead>
          <tbody>
            ${schoolRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Academic Program Breakdown Cards -->
    <div class="analytics-grid" style="margin-bottom:24px;">
      <div class="chart-card">
        <h3>Academic Programme Breakdown</h3>
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border-color);">
            <span>4-Year UG Programmes</span>
            <strong>${ug4yrCount.toLocaleString('en-IN')} Students</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border-color);">
            <span>5-Year Integrated Programmes</span>
            <strong>${int5yrCount} Students</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;">
            <span>2-Year PG Programmes</span>
            <strong>${pg2yrCount} Students</strong>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Yearwise Student Distribution</h3>
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;">
            <span>1st Year Students</span>
            <strong>${(yearStats['1'] ? yearStats['1'].total : 0).toLocaleString('en-IN')} Students</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;">
            <span>2nd Year Students</span>
            <strong>${(yearStats['2'] ? yearStats['2'].total : 0).toLocaleString('en-IN')} Students</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;">
            <span>3rd Year Students</span>
            <strong>${(yearStats['3'] ? yearStats['3'].total : 0).toLocaleString('en-IN')} Students</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;">
            <span>4th Year Students</span>
            <strong>${(yearStats['4'] ? yearStats['4'].total : 0).toLocaleString('en-IN')} Students</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Male to Female Ratio Comparison Table -->
    <div class="table-card" style="margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;color:var(--accent-blue);">
        ⚖️ Male to Female (M:F) Ratio Comparison Across All Specified Categories
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Specified Category</th>
              <th>Teams Count</th>
              <th>Total Students</th>
              <th>Male Students</th>
              <th>Female Students</th>
              <th>Male : Female Ratio</th>
              <th>Gender Percentage Share</th>
            </tr>
          </thead>
          <tbody>
            ${categoryMfRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Interdisciplinary Branch Diversity Cards Grid -->
    <div class="chart-card" style="margin-bottom:24px;">
      <h3>🔀 Interdisciplinary Branch Composition Breakdown</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Breakdown of team interdisciplinary diversity (1 branch to 6 fully mixed branches) in active scope.</p>
      
      <div class="metrics-grid" style="grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));">
        <div class="metric-card">
          <div class="metric-label">SINGLE BRANCH (1)</div>
          <div class="metric-val default">${branchDiversity[1].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (259 total)</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">2 BRANCHES</div>
          <div class="metric-val blue">${branchDiversity[2].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (119 total)</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">3 BRANCHES</div>
          <div class="metric-val blue">${branchDiversity[3].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (50 total)</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">4 BRANCHES</div>
          <div class="metric-val purple">${branchDiversity[4].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (21 total)</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">5 BRANCHES</div>
          <div class="metric-val orange">${branchDiversity[5].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (5 total)</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">FULLY MIXED (6)</div>
          <div class="metric-val green">${branchDiversity[6].teams.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Teams (1 total)</div>
        </div>
      </div>
    </div>

    <!-- Branch Diversity Table View -->
    <div class="table-card" style="margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;color:var(--accent-blue);">
        🌐 Interdisciplinary Branch Diversity Statements &amp; M:F Ratios
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Branch Composition Category Statement</th>
              <th>Unique Branches</th>
              <th>Team Count</th>
              <th>Male / Female Members</th>
              <th>M:F Ratio</th>
              <th>Gender Share</th>
              <th>Scope Share</th>
            </tr>
          </thead>
          <tbody>
            ${divRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yearwise Gender Matrix Table -->
    <div class="table-card" style="margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;color:var(--text-main);">
        📅 Yearwise Gender Cross-Tabulation &amp; M:F Ratio Matrix (1st Year, 2nd Year, 3rd Year, 4th Year)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Year of Study</th>
              <th>Total Students</th>
              <th>Male Students</th>
              <th>Female Students</th>
              <th>M:F Ratio</th>
              <th>Gender Share</th>
              <th>Female Leaders</th>
              <th>Share of Total</th>
            </tr>
          </thead>
          <tbody>
            ${yearRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Branch Distribution Table -->
    <div class="table-card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;">
        🎓 Branch &amp; Department Gender Ratio Matrix (${sortedBranches.length} Unique Branches)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Branch Code / Name</th>
              <th>Student Participants</th>
              <th>Teams Represented</th>
              <th>Male / Female Breakdown</th>
              <th>M:F Ratio</th>
              <th>Gender Share</th>
              <th>Distribution Share</th>
            </tr>
          </thead>
          <tbody>
            ${branchRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMentorsTab() {
  const container = document.getElementById('tab-mentors');
  if (!container) return;

  const scoped = getScopedTeams();

  const assigned = scoped.filter(t => t.has_mentor);
  const unassigned = scoped.filter(t => !t.has_mentor);

  const mentorCounts = {};
  assigned.forEach(t => {
    const m = t.mentor || 'Assigned Mentor';
    if (!mentorCounts[m]) mentorCounts[m] = { name: m, count: 0, dept: t.dept_raw || 'Engineering' };
    mentorCounts[m].count++;
  });

  const sortedMentors = Object.values(mentorCounts).sort((a,b) => b.count - a.count);

  let topMentorsRows = sortedMentors.slice(0, 25).map(m => `
    <tr>
      <td><strong>${escapeHtml(m.name)}</strong></td>
      <td><strong>${m.count} Teams</strong></td>
      <td>${escapeHtml(m.dept)}</td>
      <td><span class="status-badge accepted">Active Mentor</span></td>
    </tr>
  `).join('');

  let noMentorRows = unassigned.map(t => `
    <tr>
      <td><span class="team-id-badge">${t.formatted_id || 'SIH26-A0H-T' + String(t.id).padStart(3,'0')}</span></td>
      <td><strong>${escapeHtml(t.team)}</strong></td>
      <td>${escapeHtml(t.leader)}</td>
      <td>${escapeHtml(t.dept_raw || 'N/A')}</td>
      <td>${escapeHtml(t.problem_statement || 'N/A')}</td>
      <td><span class="status-badge error">No Mentor Assigned</span></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="chart-card" style="margin-bottom:20px;">
      <h3>Faculty Mentor Allocation Analysis (Scoped View)</h3>
      <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">
        💡 <strong>Mentor Allocation Note:</strong> 326 represents unique teams with an assigned faculty mentor in baseline data (total raw mentor allocations across sheets = 333).
      </p>
      <div class="metrics-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));">
        <div class="metric-card"><div class="metric-label">Scoped Teams</div><div class="metric-val default">${scoped.length}</div></div>
        <div class="metric-card"><div class="metric-label">Assigned Mentors</div><div class="metric-val blue">${assigned.length} Teams</div></div>
        <div class="metric-card"><div class="metric-label">Unassigned Teams</div><div class="metric-val red">${unassigned.length} Teams</div></div>
        <div class="metric-card"><div class="metric-label">Unique Active Mentors</div><div class="metric-val default">${sortedMentors.length} Faculty</div></div>
      </div>
    </div>

    <div class="table-card" style="margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;color:var(--color-red);">
        ⚠️ Teams Requiring Mentor Assignment (${unassigned.length} Teams)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Leader</th>
              <th>Department</th>
              <th>Problem Statement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${noMentorRows || '<tr><td colspan="6" style="text-align:center;padding:20px;">All teams in active scope have assigned mentors!</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="table-card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;">
        Faculty Mentor Allocation Directory (${sortedMentors.length} Faculty Mentors)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Faculty Mentor Name</th>
              <th>Assigned Teams</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${topMentorsRows || '<tr><td colspan="4" style="text-align:center;padding:20px;">No active mentors in scope.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTimelineTab() {
  const container = document.getElementById('tab-timeline');
  if (!container) return;

  const scoped = getScopedTeams();

  const dateCounts = {};
  scoped.forEach(t => {
    if (t.start) {
      const date = t.start.slice(0, 10);
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    }
  });

  const sortedDates = Object.entries(dateCounts).sort((a,b) => a[0].localeCompare(b[0]));
  const maxCount = Math.max(...Object.values(dateCounts), 1);

  let dayRows = sortedDates.map(([day, count]) => `
    <tr>
      <td><strong>${escapeHtml(day)}</strong></td>
      <td><strong>${count} Submissions</strong></td>
      <td>
        <div style="height:8px;background:var(--bg-subtle);border-radius:4px;overflow:hidden;width:150px;">
          <div style="width:${((count / maxCount) * 100).toFixed(1)}%;height:100%;background:var(--accent-blue);"></div>
        </div>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="chart-card" style="margin-bottom:20px;">
      <h3>Registration Timeline (Scoped View)</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Submission velocity breakdown for ${scoped.length} teams in scope.</p>
    </div>

    <div class="table-card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;">
        Daily Submissions Velocity Matrix
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Teams Registered</th>
              <th>Volume Bar</th>
            </tr>
          </thead>
          <tbody>
            ${dayRows || '<tr><td colspan="3" style="text-align:center;padding:20px;">No timeline data available for scope.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderGithubTab() {
  const container = document.getElementById('tab-github');
  if (!container) return;

  const scoped = getScopedTeams();
  const githubTeams = scoped.filter(t => t.github_username);

  const psCounts = {};
  scoped.forEach(t => {
    if (t.problem_statement) {
      psCounts[t.problem_statement] = (psCounts[t.problem_statement] || 0) + 1;
    }
  });

  const sortedPs = Object.entries(psCounts).sort((a,b) => b[1] - a[1]);
  const maxPs = Math.max(...Object.values(psCounts), 1);

  let ghRows = githubTeams.map(t => `
    <tr>
      <td><span class="team-id-badge">${t.formatted_id || 'SIH26-A0H-T' + String(t.id).padStart(3,'0')}</span></td>
      <td><strong>${escapeHtml(t.team)}</strong></td>
      <td>${escapeHtml(t.leader)}</td>
      <td><span class="team-id-badge" style="background:var(--accent-blue-soft);color:var(--accent-blue);">${escapeHtml(t.problem_statement || 'N/A')}</span></td>
      <td><a href="https://github.com/${escapeHtml(t.github_username)}" target="_blank" style="color:var(--accent-blue);font-weight:600;text-decoration:none;">@${escapeHtml(t.github_username)}</a></td>
      <td><span class="status-badge accepted">✓ Verified GitHub</span></td>
    </tr>
  `).join('');

  let psRows = sortedPs.slice(0, 15).map(([ps, count]) => `
    <tr>
      <td><span class="team-id-badge" style="background:var(--accent-blue-soft);color:var(--accent-blue);">${escapeHtml(ps)}</span></td>
      <td><strong>${count} Teams</strong></td>
      <td>
        <div style="height:8px;background:var(--bg-subtle);border-radius:4px;overflow:hidden;width:150px;">
          <div style="width:${((count / maxPs) * 100).toFixed(1)}%;height:100%;background:var(--color-purple);"></div>
        </div>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="analytics-grid" style="margin-bottom:20px;">
      <div class="chart-card">
        <h3>GitHub Directory Stats (Scoped View)</h3>
        <div class="metrics-grid" style="grid-template-columns:1fr 1fr;">
          <div class="metric-card"><div class="metric-label">GitHub Profiles</div><div class="metric-val purple">${githubTeams.length}</div></div>
          <div class="metric-card"><div class="metric-label">Problem Statements</div><div class="metric-val blue">${Object.keys(psCounts).length}</div></div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Top Problem Statement (PS) IDs</h3>
        <div class="table-wrapper" style="max-height:220px;overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>PS ID</th>
                <th>Teams Submitted</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              ${psRows || '<tr><td colspan="3" style="text-align:center;padding:12px;">No PS data in scope.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:700;font-size:15px;">
        Team Leaders GitHub Profiles Directory (${githubTeams.length} Leaders in Active Scope)
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Team Leader</th>
              <th>Problem Statement ID</th>
              <th>GitHub Handle</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${ghRows || '<tr><td colspan="6" style="text-align:center;padding:20px;">No GitHub profiles in scope.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
