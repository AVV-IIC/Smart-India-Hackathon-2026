/**
 * Smart India Hackathon 2026 - Results Page Logic & Dynamic Table Renderer
 */

let currentActiveTab = 'hardware';

/**
 * Creates table row HTML for subsection tables (Hardware & Software)
 */
function createTableRowHTML(team, index) {
    const statusClass = team.status === 'Shortlisted' ? 'status-badge-shortlisted' : 'status-badge-waitlisted';
    return `
        <tr>
            <td class="col-sno">${index + 1}</td>
            <td class="col-int-num">${team.internalTeamNumber || ''}</td>
            <td class="col-int-name">${team.internalTeamName || ''}</td>
            <td class="col-sih-num">${team.sihTeamNumber || ''}</td>
            <td class="col-sih-name">${team.sihTeamName || ''}</td>
            <td class="col-idea1">${team.psid || ''}</td>
            <td class="col-yukti">${team.yuktiIdea || ''}</td>
            <td class="col-status"><span class="${statusClass}">${team.status}</span></td>
        </tr>
    `.trim();
}

/**
 * Creates table row HTML for Master All Teams Directory table (includes Track column)
 */
function createMasterTableRowHTML(team, index) {
    const isHardware = team.track === 'Hardware';
    const trackPillClass = isHardware ? 'pill-hw' : 'pill-sw';
    const trackPillText = isHardware ? '⚙️ Hardware' : '💻 Software';
    const statusClass = team.status === 'Shortlisted' ? 'status-badge-shortlisted' : 'status-badge-waitlisted';

    return `
        <tr>
            <td class="col-sno">${index + 1}</td>
            <td class="col-int-num">${team.internalTeamNumber || ''}</td>
            <td class="col-int-name">${team.internalTeamName || ''}</td>
            <td class="col-track"><span class="track-pill ${trackPillClass}">${trackPillText}</span></td>
            <td class="col-sih-num">${team.sihTeamNumber || ''}</td>
            <td class="col-sih-name">${team.sihTeamName || ''}</td>
            <td class="col-idea1">${team.psid || ''}</td>
            <td class="col-yukti">${team.yuktiIdea || ''}</td>
            <td class="col-status"><span class="${statusClass}">${team.status}</span></td>
        </tr>
    `.trim();
}

/**
 * Renders all teams dynamically into their respective tables from TEAMS_DATA
 */
function renderAllTables() {
    if (typeof TEAMS_DATA === 'undefined' || !Array.isArray(TEAMS_DATA)) {
        console.error('TEAMS_DATA is not defined or not an array.');
        return;
    }

    // 1. Hardware Track - Subsection A: Student Innovation (5 teams)
    const hwStudentInnov = TEAMS_DATA.filter(t => t.track === 'Hardware' && t.category === 'Student Innovation');
    const tbodyHwSi = document.getElementById('tbody-hw-student-innovation');
    if (tbodyHwSi) {
        tbodyHwSi.innerHTML = hwStudentInnov.map((t, idx) => createTableRowHTML(t, idx)).join('\n');
    }

    // 2. Hardware Track - Subsection B: Given PSIDs (17 teams)
    const hwGiven = TEAMS_DATA.filter(t => t.track === 'Hardware' && t.category === 'Given PSID');
    const tbodyHwGiven = document.getElementById('tbody-hw-given-psid');
    if (tbodyHwGiven) {
        tbodyHwGiven.innerHTML = hwGiven.map((t, idx) => createTableRowHTML(t, idx)).join('\n');
    }

    // 3. Software Track - Subsection A: Student Innovation (7 teams)
    const swStudentInnov = TEAMS_DATA.filter(t => t.track === 'Software' && t.category === 'Student Innovation');
    const tbodySwSi = document.getElementById('tbody-sw-student-innovation');
    if (tbodySwSi) {
        tbodySwSi.innerHTML = swStudentInnov.map((t, idx) => createTableRowHTML(t, idx)).join('\n');
    }

    // 4. Software Track - Subsection B: Given PSIDs (71 teams)
    const swGiven = TEAMS_DATA.filter(t => t.track === 'Software' && t.category === 'Given PSID');
    const tbodySwGiven = document.getElementById('tbody-sw-given-psid');
    if (tbodySwGiven) {
        tbodySwGiven.innerHTML = swGiven.map((t, idx) => createTableRowHTML(t, idx)).join('\n');
    }

    // 5. All Teams Directory (100 teams)
    const tbodyAll = document.getElementById('tbody-all-teams');
    if (tbodyAll) {
        tbodyAll.innerHTML = TEAMS_DATA.map((t, idx) => createMasterTableRowHTML(t, idx)).join('\n');
    }

    renumberAllTables();
}

/**
 * Auto-renumber S.No. in every table
 */
function renumberAllTables() {
    document.querySelectorAll('.table-responsive tbody').forEach(tbody => {
        tbody.querySelectorAll('tr').forEach((row, index) => {
            const cell = row.querySelector('.col-sno');
            if (cell) cell.textContent = index + 1;
        });
    });
}

/**
 * Tab switching between Hardware Track, Software Track, and All Teams
 */
function selectTrackTab(tab) {
    currentActiveTab = tab;
    document.querySelectorAll('.track-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const hwSection = document.getElementById('section-hardware');
    const swSection = document.getElementById('section-software');
    const allSection = document.getElementById('section-all');

    if (tab === 'hardware') {
        if (hwSection) hwSection.style.display = 'block';
        if (swSection) swSection.style.display = 'none';
        if (allSection) allSection.style.display = 'none';
    } else if (tab === 'software') {
        if (hwSection) hwSection.style.display = 'none';
        if (swSection) swSection.style.display = 'block';
        if (allSection) allSection.style.display = 'none';
    } else if (tab === 'all') {
        if (hwSection) hwSection.style.display = 'none';
        if (swSection) swSection.style.display = 'none';
        if (allSection) allSection.style.display = 'block';
    }

    filterTop100Teams();
}

/**
 * Real-time filter across all teams based on search query
 */
function filterTop100Teams() {
    const searchInput = document.getElementById('top100-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const rows = document.querySelectorAll('.table-responsive tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (!query || text.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initialise tables on DOM ready or immediate script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAllTables);
} else {
    renderAllTables();
}
