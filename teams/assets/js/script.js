/* 
   SIH 2026 - Minimalist & Professional Application Logic
*/

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  const state = {
    teams: window.teamsData || [],
    filteredTeams: [],
    searchQuery: '',
    statusFilter: 'all',
    deptFilter: 'all',
    sortField: 'id',
    sortDirection: 'asc',
    currentPage: 1,
    pageSize: 25
  };

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const statusPills = document.querySelectorAll('.pill-btn');
  const deptSelect = document.getElementById('deptSelect');
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const toastNotification = document.getElementById('toastNotification');
  
  const tableBody = document.querySelector('#teamTable tbody');
  const tableHeaders = document.querySelectorAll('#teamTable th[data-sort]');
  
  const resultsMeta = document.getElementById('resultsMeta');
  const paginationControls = document.getElementById('paginationControls');
  const pageRangeText = document.getElementById('pageRangeText');

  // KPI Elements
  const totalTeamsCountEl = document.getElementById('totalTeamsCount');
  const acceptedTeamsCountEl = document.getElementById('acceptedTeamsCount');
  const onBoardCountEl = document.getElementById('onBoardCount');
  const offBoardCountEl = document.getElementById('offBoardCount');
  const mentorsCountEl = document.getElementById('mentorsCount');
  const participantsCountEl = document.getElementById('participantsCount');

  // Modal Elements
  const teamModal = document.getElementById('teamModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalTeamId = document.getElementById('modalTeamId');
  const modalStatus = document.getElementById('modalStatus');
  const modalAddedNuu = document.getElementById('modalAddedNuu');
  const modalProblemStatement = document.getElementById('modalProblemStatement');
  const modalMentor = document.getElementById('modalMentor');
  const modalLeader = document.getElementById('modalLeader');
  const modalMembersList = document.getElementById('modalMembersList');
  const copyTeamBtn = document.getElementById('copyTeamBtn');
  let selectedModalTeam = null;

  // Chart Instances Tracking Object
  const chartInstances = {};

  // Safe Storage Helper (protects against SecurityError on file:// protocol or restricted environments)
  const safeStorage = {
    getItem: (key) => {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key, val) => {
      try { localStorage.setItem(key, val); } catch (e) {}
    }
  };

  // Data Loading Fallback Helper
  function ensureDataLoaded() {
    if ((!state.teams || state.teams.length === 0) && window.teamsData) {
      state.teams = window.teamsData;
    }
  }

  // --- Toast Notification Helper ---
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3000);
  }

  // --- Helper to get clean numeric page size ---
  function getNumericPageSize() {
    if (state.pageSize === 'all') return 'all';
    const parsed = parseInt(state.pageSize, 10);
    return isNaN(parsed) ? 25 : parsed;
  }

  // --- Department & Roll Classification Helpers ---
  function classifyRoll(roll) {
    if (!roll) return null;
    roll = roll.toString().toUpperCase();
    if (roll.includes("U3") || roll.includes("U4") || roll.includes("4ELC")) return "UG";
    if (roll.includes("P2") || roll.includes("I5") || roll.includes("I4") || roll.includes("DAS")) return "PG";
    return null;
  }

  function getDepartmentFromRoll(roll) {
    if (!roll) return null;
    roll = roll.toUpperCase();
    let match = roll.match(/(?:U\d|P\d|I\d|\.| )([A-Z]{2,5})\d+/);
    if (match && match[1]) return match[1];
    let match2 = roll.match(/([A-Z]{2,5})\d{3,}/);
    if (match2 && match2[1]) return match2[1];
    return null;
  }

  function mapDept(code) {
    if (!code) return null;
    if (["AEL", "CCE", "ECE", "CIE"].includes(code)) return "ECE";
    if (["ELC", "EEE"].includes(code)) return "EEE";
    if (["CSE", "CSC", "DSC"].includes(code)) return "School of Computing";
    if (["CYS", "CY"].includes(code)) return "Cyber Security";
    if (["ARE", "MEE"].includes(code)) return "Mechanical";
    if (["AEE", "IAE"].includes(code)) return "Aerospace";
    if (["AAR", "AIM", "AID", "AIE", "CPS", "QTS", "CDA", "ASD", "DLS", "ATE"].includes(code)) return "School of AI";
    if (["CHE"].includes(code)) return "Chemical";
    if (["DAS", "I5DAS", "MAT", "PHY", "MSE", "BBL"].includes(code)) return "Sciences & Integrated";
    return "Other";
  }

  function getTeamDepartment(team) {
    const allMembers = [team.leader, ...team.members];
    const depts = [];
    allMembers.forEach(person => {
      let rollMatch = person.match(/\[(.*?)\]/);
      if (rollMatch && rollMatch[1]) {
        let code = getDepartmentFromRoll(rollMatch[1]);
        let mapped = mapDept(code);
        if (mapped) depts.push(mapped);
      }
    });
    const unique = [...new Set(depts)];
    if (unique.length === 1) return unique[0];
    if (unique.length > 1) return "Mixed (" + unique.slice(0, 2).join("/") + ")";
    return "General";
  }

  // --- Populate Department Dropdown ---
  function initDepartmentDropdown() {
    ensureDataLoaded();
    const deptSet = new Set();
    state.teams.forEach(t => {
      let dept = getTeamDepartment(t);
      if (dept) deptSet.add(dept);
    });

    const sortedDepts = Array.from(deptSet).sort();
    sortedDepts.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }

  // --- KPI Metrics Updater ---
  function updateKPIs() {
    ensureDataLoaded();
    const total = state.teams.length;
    const acceptedCount = state.teams.filter(t => (t.accepted || '').toLowerCase() === 'accepted').length;
    const onBoard = state.teams.filter(t => t.status.toLowerCase().includes('on')).length;
    const offBoard = total - onBoard;
    const mentorsAssigned = state.teams.filter(t => t.mentor && t.mentor !== 'No Mentor').length;
    
    let totalParticipants = 0;
    state.teams.filter(t => (t.accepted || '').toLowerCase() === 'accepted').forEach(t => {
      totalParticipants += 1 + t.members.length;
    });

    if (totalTeamsCountEl) totalTeamsCountEl.textContent = total;
    if (acceptedTeamsCountEl) acceptedTeamsCountEl.textContent = acceptedCount;
    if (onBoardCountEl) onBoardCountEl.textContent = onBoard;
    if (offBoardCountEl) offBoardCountEl.textContent = offBoard;
    if (mentorsCountEl) mentorsCountEl.textContent = mentorsAssigned;
    if (participantsCountEl) participantsCountEl.textContent = totalParticipants;
  }

  // --- Update Pill Badges Dynamically ---
  function updatePillBadges() {
    ensureDataLoaded();
    statusPills.forEach(pill => {
      const filter = pill.getAttribute('data-filter');
      let count = 0;
      if (filter === 'all') count = state.teams.length;
      else if (filter === 'accepted') count = state.teams.filter(t => (t.accepted || '').toLowerCase() === 'accepted').length;
      else if (filter === 'notaccepted') count = state.teams.filter(t => (t.accepted || '').toLowerCase() === 'not accepted').length;
      else if (filter === 'on') count = state.teams.filter(t => t.status.toLowerCase().includes('on')).length;
      else if (filter === 'off') count = state.teams.filter(t => t.status.toLowerCase().includes('off')).length;
      else if (filter === 'mentor') count = state.teams.filter(t => t.mentor && t.mentor !== 'No Mentor').length;
      else if (filter === 'nomentor') count = state.teams.filter(t => !t.mentor || t.mentor === 'No Mentor').length;

      let badge = pill.querySelector('.pill-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'pill-badge';
        pill.appendChild(badge);
      }
      badge.textContent = count;
    });
  }

  // --- Filtering & Sorting Core ---
  function applyFiltersAndSort() {
    ensureDataLoaded();
    const q = state.searchQuery.toLowerCase().trim();

    state.filteredTeams = state.teams.filter(team => {
      // Status Filter
      if (state.statusFilter === 'accepted' && (team.accepted || '').toLowerCase() !== 'accepted') return false;
      if (state.statusFilter === 'notaccepted' && (team.accepted || '').toLowerCase() !== 'not accepted') return false;
      if (state.statusFilter === 'on' && !team.status.toLowerCase().includes('on')) return false;
      if (state.statusFilter === 'off' && !team.status.toLowerCase().includes('off')) return false;
      if (state.statusFilter === 'mentor' && (!team.mentor || team.mentor === 'No Mentor')) return false;
      if (state.statusFilter === 'nomentor' && (team.mentor && team.mentor !== 'No Mentor')) return false;

      // Dept Filter
      if (state.deptFilter !== 'all') {
        const teamDept = getTeamDepartment(team);
        if (!teamDept.includes(state.deptFilter)) return false;
      }

      // Search Query
      if (q) {
        const searchable = [
          team.id,
          team.name,
          team.problemStatement || '',
          team.accepted || '',
          team.githubUsername || '',
          team.leader,
          ...team.members,
          team.mentor || '',
          team.status
        ].join(' ').toLowerCase();

        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    // Sorting: On "all" view, Accepted teams come first. On "notaccepted" view, On-board teams come first.
    state.filteredTeams.sort((a, b) => {
      if (state.statusFilter === 'all') {
        const aAcc = (a.accepted || '').toLowerCase() === 'accepted' ? 0 : 1;
        const bAcc = (b.accepted || '').toLowerCase() === 'accepted' ? 0 : 1;
        if (aAcc !== bAcc) return aAcc - bAcc;
      }
      if (state.statusFilter === 'notaccepted') {
        const aOn = a.status.toLowerCase().includes('on') ? 0 : 1;
        const bOn = b.status.toLowerCase().includes('on') ? 0 : 1;
        if (aOn !== bOn) return aOn - bOn;
      }

      let valA = (a[state.sortField] || '').toString().toLowerCase();
      let valB = (b[state.sortField] || '').toString().toLowerCase();

      if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    state.currentPage = 1;
    renderTable();
    renderPagination();
  }

  // --- Search Term Highlight Helper ---
  function highlightText(text, query) {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // --- Table Rendering ---
  function renderTable() {
    tableBody.innerHTML = '';
    const q = state.searchQuery.trim();
    const numericPageSize = getNumericPageSize();

    if (state.filteredTeams.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">No teams match your current criteria</div>
          <div style="font-size: 13px;">Try adjusting your search or filters.</div>
        </td>
      `;
      tableBody.appendChild(emptyTr);
      if (resultsMeta) resultsMeta.textContent = `Showing 0 of ${state.teams.length} teams`;
      return;
    }

    const startIdx = numericPageSize === 'all' ? 0 : (state.currentPage - 1) * numericPageSize;
    const endIdx = numericPageSize === 'all' ? state.filteredTeams.length : Math.min(startIdx + numericPageSize, state.filteredTeams.length);
    const visibleTeams = numericPageSize === 'all' ? state.filteredTeams : state.filteredTeams.slice(startIdx, endIdx);

    visibleTeams.forEach(team => {
      const tr = document.createElement('tr');
      
      const isOn = team.status.toLowerCase().includes('on');
      const badgeClass = isOn ? 'badge-on' : 'badge-off';

      let addedBadgeClass = 'badge-off';
      let addedText = team.accepted || 'Not Accepted';
      const statusLower = (team.accepted || '').toLowerCase();
      if (statusLower === 'accepted') {
        addedText = 'Accepted';
        addedBadgeClass = 'badge-on';
      }

      const psDisplay = (team.problemStatement && team.problemStatement !== '-')
        ? `<span class="team-id-code" style="background: var(--bg-main); color: var(--text-secondary); border-color: var(--border-color);">${highlightText(team.problemStatement, q)}</span>`
        : `<span style="color: var(--text-muted);">-</span>`;

      const mentorHtml = (team.mentor && team.mentor !== 'No Mentor')
        ? `<span class="mentor-text mentor-assigned">${highlightText(team.mentor, q)}</span>`
        : `<span class="mentor-text mentor-none">No Mentor</span>`;

      tr.innerHTML = `
        <td><span class="team-id-code">${highlightText(team.id, q)}</span></td>
        <td><span class="team-title">${highlightText(team.name, q)}</span></td>
        <td>${psDisplay}</td>
        <td><span class="badge ${addedBadgeClass}">${highlightText(team.accepted || 'Not Accepted', q)}</span></td>
        <td><span class="member-chip">${highlightText(team.leader, q)}</span></td>
        <td><span class="member-chip">${highlightText(team.members[0] || '-', q)}</span></td>
        <td><span class="member-chip">${highlightText(team.members[1] || '-', q)}</span></td>
        <td><span class="member-chip">${highlightText(team.members[2] || '-', q)}</span></td>
        <td><span class="member-chip">${highlightText(team.members[3] || '-', q)}</span></td>
        <td><span class="member-chip">${highlightText(team.members[4] || '-', q)}</span></td>
        <td><span class="badge ${badgeClass}">${team.status}</span></td>
        <td>${mentorHtml}</td>
      `;

      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => openTeamModal(team));

      tableBody.appendChild(tr);
    });

    if (resultsMeta) {
      resultsMeta.textContent = `Showing ${visibleTeams.length > 0 ? startIdx + 1 : 0}-${endIdx} of ${state.filteredTeams.length} teams (Total: ${state.teams.length})`;
    }
  }

  // --- Pagination Rendering ---
  function renderPagination() {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    const numericPageSize = getNumericPageSize();

    if (numericPageSize === 'all' || state.filteredTeams.length === 0) {
      if (pageRangeText) pageRangeText.textContent = `All ${state.filteredTeams.length} teams displayed`;
      return;
    }

    const totalPages = Math.ceil(state.filteredTeams.length / numericPageSize);
    if (pageRangeText) pageRangeText.textContent = `Page ${state.currentPage} of ${totalPages}`;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderTable();
        renderPagination();
      }
    });
    paginationControls.appendChild(prevBtn);

    // Page Number Buttons
    const maxPagesToShow = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === state.currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        state.currentPage = i;
        renderTable();
        renderPagination();
      });
      paginationControls.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderTable();
        renderPagination();
      }
    });
    paginationControls.appendChild(nextBtn);
  }

  // --- Modal Logic ---
  function openTeamModal(team) {
    selectedModalTeam = team;
    modalTitle.textContent = team.name;
    modalTeamId.textContent = team.id;
    
    const isOn = team.status.toLowerCase().includes('on');
    modalStatus.innerHTML = `<span class="badge ${isOn ? 'badge-on' : 'badge-off'}">${team.status}</span>`;
    
    if (modalAddedNuu) {
      let addedBadgeClass = 'badge-off';
      let addedText = team.accepted || 'Not Accepted';
      const statusLower = (team.accepted || '').toLowerCase();
      if (statusLower === 'accepted') {
        addedText = 'Accepted';
        addedBadgeClass = 'badge-on';
      }
      modalAddedNuu.innerHTML = `<span class="badge ${addedBadgeClass}">${addedText}</span>`;
    }
    if (modalProblemStatement) {
      modalProblemStatement.textContent = team.problemStatement || '-';
    }

    modalMentor.textContent = team.mentor || 'No Mentor Assigned';
    const ghTag = team.githubUsername ? ` (@${team.githubUsername})` : '';
    if (modalLeader) modalLeader.textContent = team.leader + ghTag;

    modalMembersList.innerHTML = '';
    
    // Leader entry
    const leaderDiv = document.createElement('div');
    leaderDiv.className = 'modal-member-item';
    const ghDisplay = team.githubUsername ? ` <span style="color: var(--text-muted); font-size: 0.85em; font-family: monospace;">(@${team.githubUsername})</span>` : '';
    leaderDiv.innerHTML = `<span class="member-role-badge">Leader</span> <span>${team.leader}${ghDisplay}</span>`;
    modalMembersList.appendChild(leaderDiv);

    // Members entries
    team.members.forEach((member, idx) => {
      const memberDiv = document.createElement('div');
      memberDiv.className = 'modal-member-item';
      memberDiv.innerHTML = `<span class="member-role-badge">Member #${idx + 1}</span> <span>${member}</span>`;
      modalMembersList.appendChild(memberDiv);
    });

    teamModal.classList.add('active');
  }

  function closeTeamModal() {
    teamModal.classList.remove('active');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeTeamModal);
  if (teamModal) {
    teamModal.addEventListener('click', (e) => {
      if (e.target === teamModal) closeTeamModal();
    });
  }

  if (copyTeamBtn) {
    copyTeamBtn.addEventListener('click', () => {
      if (!selectedModalTeam) return;
      const ghText = selectedModalTeam.githubUsername ? ` (${selectedModalTeam.githubUsername})` : '';
      const textToCopy = `Team ID: ${selectedModalTeam.id}\nTeam Name: ${selectedModalTeam.name}\nProblem Statement: ${selectedModalTeam.problemStatement || '-'}\nAccepted: ${selectedModalTeam.accepted || 'Not Accepted'}\nLeader: ${selectedModalTeam.leader}${ghText}\nMembers:\n${selectedModalTeam.members.join('\n')}\nStatus: ${selectedModalTeam.status}\nMentor: ${selectedModalTeam.mentor}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const origText = copyTeamBtn.textContent;
        copyTeamBtn.textContent = 'Copied to Clipboard';
        showToast('Team details copied to clipboard!');
        setTimeout(() => { copyTeamBtn.textContent = origText; }, 2000);
      });
    });
  }

  // --- Export CSV Logic ---
  function exportToCSV() {
    if (!state.filteredTeams || state.filteredTeams.length === 0) {
      showToast('No teams available to export.');
      return;
    }

    const headers = ['Team ID', 'Team Name', 'Problem Statement', 'Accepted', 'Leader', 'Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5', 'Status', 'Mentor'];
    const rows = state.filteredTeams.map(t => [
      t.id || '',
      t.name || '',
      t.problemStatement || '-',
      t.accepted || 'Not Accepted',
      t.leader || '',
      t.members[0] || '',
      t.members[1] || '',
      t.members[2] || '',
      t.members[3] || '',
      t.members[4] || '',
      t.status || '',
      t.mentor || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `SIH2026_Teams_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${state.filteredTeams.length} teams to CSV!`);
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  // --- Theme Toggle Logic ---
  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.textContent = '☀️';
      if (themeText) themeText.textContent = 'Light Mode';
      safeStorage.setItem('sih_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.textContent = '🌙';
      if (themeText) themeText.textContent = 'Dark Mode';
      safeStorage.setItem('sih_theme', 'light');
    }
    try {
      renderCharts();
    } catch(e) {}
  }

  function initTheme() {
    const savedTheme = safeStorage.getItem('sih_theme') || 'light';
    setTheme(savedTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // --- Keyboard Shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && teamModal && teamModal.classList.contains('active')) {
      closeTeamModal();
    }
    if (e.key === '/' && searchInput && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // --- Event Listeners for Filters ---
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (searchClearBtn) searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      applyFiltersAndSort();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      applyFiltersAndSort();
    });
  }

  // Set Pill Filter Helper
  function setStatusFilter(filterVal) {
    statusPills.forEach(p => {
      if (p.getAttribute('data-filter') === filterVal) p.classList.add('active');
      else p.classList.remove('active');
    });

    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, idx) => {
      card.classList.remove('active-card');
      if (filterVal === 'all' && idx === 0) card.classList.add('active-card');
      else if (filterVal === 'accepted' && idx === 1) card.classList.add('active-card');
      else if (filterVal === 'iderror' && idx === 2) card.classList.add('active-card');
      else if (filterVal === 'on' && idx === 3) card.classList.add('active-card');
      else if (filterVal === 'off' && idx === 4) card.classList.add('active-card');
      else if (filterVal === 'mentor' && idx === 5) card.classList.add('active-card');
    });

    state.statusFilter = filterVal;
    applyFiltersAndSort();
  }

  statusPills.forEach(pill => {
    pill.addEventListener('click', () => {
      setStatusFilter(pill.getAttribute('data-filter'));
    });
  });

  // KPI Stat Cards Click Listeners
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      if (idx === 0) setStatusFilter('all');
      else if (idx === 1) setStatusFilter('accepted');
      else if (idx === 2) setStatusFilter('iderror');
      else if (idx === 3) setStatusFilter('on');
      else if (idx === 4) setStatusFilter('off');
      else if (idx === 5) setStatusFilter('mentor');
    });
  });

  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      state.deptFilter = e.target.value;
      applyFiltersAndSort();
    });
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      state.pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
      state.currentPage = 1;
      applyFiltersAndSort();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (searchClearBtn) searchClearBtn.style.display = 'none';
      state.statusFilter = 'all';
      statusPills.forEach(p => p.classList.remove('active'));
      if (statusPills[0]) statusPills[0].classList.add('active');
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach(c => c.classList.remove('active-card'));
      state.deptFilter = 'all';
      if (deptSelect) deptSelect.value = 'all';
      state.pageSize = 25;
      if (pageSizeSelect) pageSizeSelect.value = '25';
      state.sortField = 'id';
      state.sortDirection = 'asc';
      applyFiltersAndSort();
    });
  }

  // Column Sort Click Handler
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (state.sortField === field) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDirection = 'asc';
      }

      tableHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
      th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');

      applyFiltersAndSort();
    });
  });

  // --- Analytics Charts Rendering (Chart.js) ---
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
    const chartBorderColor = isDark ? '#1e293b' : '#ffffff';

    // Chart 1: Team Composition
    const teamTypes = { "UG Only": 0, "PG Only": 0, "Mixed": 0, "Unclassified": 0 };
    state.teams.forEach(t => {
      const members = [t.leader, ...t.members];
      const categories = new Set();
      members.forEach(m => {
        let type = classifyRoll(m);
        if (type) categories.add(type);
      });
      if (categories.size === 1 && categories.has("UG")) teamTypes["UG Only"]++;
      else if (categories.size === 1 && categories.has("PG")) teamTypes["PG Only"]++;
      else if (categories.has("UG") && categories.has("PG")) teamTypes["Mixed"]++;
      else teamTypes["Unclassified"]++;
    });

    if (chartInstances.teamChart) chartInstances.teamChart.destroy();
    const ctx1 = document.getElementById("teamChart")?.getContext("2d");
    if (ctx1) {
      chartInstances.teamChart = new Chart(ctx1, {
        type: "doughnut",
        data: {
          labels: Object.keys(teamTypes),
          datasets: [{
            data: Object.values(teamTypes),
            backgroundColor: ["#16a34a", "#2563eb", "#d97706", "#64748b"],
            borderWidth: 2,
            borderColor: chartBorderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, activeEls) => {
            if (activeEls.length > 0) {
              const idx = activeEls[0].index;
              const label = Object.keys(teamTypes)[idx];
              if (label === 'UG Only') {
                state.searchQuery = 'U4';
                if (searchInput) searchInput.value = 'U4';
              } else if (label === 'PG Only') {
                state.searchQuery = 'P2';
                if (searchInput) searchInput.value = 'P2';
              }
              applyFiltersAndSort();
              showToast(`Filtered for ${label} teams`);
            }
          },
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, font: { family: 'Inter' } } }
          }
        }
      });
    }

    // Chart 2: Status Breakdown
    const onBoard = state.teams.filter(t => t.status.toLowerCase().includes('on')).length;
    const offBoard = state.teams.length - onBoard;

    if (chartInstances.statusChart) chartInstances.statusChart.destroy();
    const ctx2 = document.getElementById("statusChart")?.getContext("2d");
    if (ctx2) {
      chartInstances.statusChart = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["On Board", "Off Board"],
          datasets: [{
            data: [onBoard, offBoard],
            backgroundColor: ["#16a34a", "#dc2626"],
            borderWidth: 2,
            borderColor: chartBorderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, activeEls) => {
            if (activeEls.length > 0) {
              const idx = activeEls[0].index;
              if (idx === 0) setStatusFilter('on');
              else setStatusFilter('off');
              showToast(`Filtered by ${idx === 0 ? 'On Board' : 'Off Board'} status`);
            }
          },
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, font: { family: 'Inter' } } }
          }
        }
      });
    }

    // Chart 2.5: Accepted vs Not Accepted
    const acceptedCount = state.teams.filter(t => (t.accepted || '').toLowerCase() === 'accepted').length;
    const notAcceptedCount = state.teams.length - acceptedCount;

    if (chartInstances.acceptedChart) chartInstances.acceptedChart.destroy();
    const ctxAccepted = document.getElementById("acceptedChart")?.getContext("2d");
    if (ctxAccepted) {
      chartInstances.acceptedChart = new Chart(ctxAccepted, {
        type: "doughnut",
        data: {
          labels: ["Accepted", "Not Accepted"],
          datasets: [{
            data: [acceptedCount, notAcceptedCount],
            backgroundColor: ["#16a34a", "#dc2626"],
            borderWidth: 2,
            borderColor: chartBorderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, activeEls) => {
            if (activeEls.length > 0) {
              const idx = activeEls[0].index;
              if (idx === 0) setStatusFilter('accepted');
              else setStatusFilter('notaccepted');
              const labels = ['Accepted', 'Not Accepted'];
              showToast(`Filtered by ${labels[idx]} status`);
            }
          },
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, font: { family: 'Inter' } } }
          }
        }
      });
    }

    // Chart 3: Department Distribution
    const deptCounts = {};
    state.teams.forEach(t => {
      const dept = getTeamDepartment(t);
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    if (chartInstances.deptChart) chartInstances.deptChart.destroy();
    const ctx3 = document.getElementById("deptChart")?.getContext("2d");
    if (ctx3) {
      chartInstances.deptChart = new Chart(ctx3, {
        type: "doughnut",
        data: {
          labels: Object.keys(deptCounts),
          datasets: [{
            data: Object.values(deptCounts),
            backgroundColor: ["#2563eb", "#dc2626", "#d97706", "#16a34a", "#7c3aed", "#0891b2", "#ea580c", "#65a30d", "#4f46e5", "#64748b"],
            borderWidth: 2,
            borderColor: chartBorderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, activeEls) => {
            if (activeEls.length > 0) {
              const idx = activeEls[0].index;
              const dept = Object.keys(deptCounts)[idx];
              if (deptSelect) {
                deptSelect.value = dept;
                state.deptFilter = dept;
                applyFiltersAndSort();
                showToast(`Filtered by Department: ${dept}`);
              }
            }
          },
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, font: { family: 'Inter', size: 11 } } }
          }
        }
      });
    }

    // Chart 4: Top 10 Mentors
    const mentorCounts = {};
    state.teams.forEach(t => {
      if (t.mentor && t.mentor !== 'No Mentor') {
        mentorCounts[t.mentor] = (mentorCounts[t.mentor] || 0) + 1;
      }
    });

    const sortedMentors = Object.entries(mentorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const mentorLabels = sortedMentors.map(m => m[0]);
    const mentorData = sortedMentors.map(m => m[1]);

    if (chartInstances.mentorChart) chartInstances.mentorChart.destroy();
    const ctx4 = document.getElementById("mentorChart")?.getContext("2d");
    if (ctx4) {
      chartInstances.mentorChart = new Chart(ctx4, {
        type: "bar",
        data: {
          labels: mentorLabels,
          datasets: [{
            label: "Teams Mentored",
            data: mentorData,
            backgroundColor: isDark ? '#3b82f6' : '#2563eb',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          onClick: (evt, activeEls) => {
            if (activeEls.length > 0) {
              const idx = activeEls[0].index;
              const mentorName = mentorLabels[idx];
              if (searchInput) {
                searchInput.value = mentorName;
                state.searchQuery = mentorName;
                if (searchClearBtn) searchClearBtn.style.display = 'block';
                applyFiltersAndSort();
                showToast(`Filtered by Mentor: ${mentorName}`);
              }
            }
          },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  // --- Initial Setup Execution ---
  ensureDataLoaded();
  initDepartmentDropdown();
  updateKPIs();
  updatePillBadges();
  applyFiltersAndSort();
  initTheme();
  try {
    renderCharts();
  } catch (err) {
    console.warn("Chart initialization warning:", err);
  }
  // Fallback to render charts after window load (handles delayed Chart.js CDN loading)
  window.addEventListener('load', () => {
    if (typeof Chart !== 'undefined' && document.getElementById('teamChart')) {
      try {
        renderCharts();
      } catch (e) {}
    }
  });
});
