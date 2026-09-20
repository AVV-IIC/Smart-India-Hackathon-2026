/**
 * SIH Letterhead Formatter - Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // App State
    let state = {
        team_id: '074_forge26',
        team_name: 'FORGE-26',
        date_str: '17/September/2026',
        hackathon_name: 'Smart India Hackathon 2026',
        aicte_code: 'U-0436',
        signatory_name: 'Dr. Sasangan Ramanathan',
        signatory_title: 'Dean Academics',
        college_name: 'Amrita Vishwa Vidyapeetham, Coimbatore.',
        members: [
            { role: 'Team Leader', name: 'Savetha Aravindan', gender: 'F', email: 'cb.en.u4elc26045@cb.students.amrita.edu', mobile: '9843865733', stream: 'ELC', year: 'I' },
            { role: 'Team Member', name: 'Vidhun J H', gender: 'M', email: 'cb.en.u4elc26055@cb.students.amrita.edu', mobile: '9384469559', stream: 'ELC', year: 'I' },
            { role: 'Team Member', name: 'Venyaa J D', gender: 'F', email: 'cb.en.u4elc26054@cb.students.amrita.edu', mobile: '7812893626', stream: 'ELC', year: 'I' },
            { role: 'Team Member', name: 'Tharaneesh M K', gender: 'M', email: 'cb.en.u4elc26149@cb.students.amrita.edu', mobile: '9842616770', stream: 'ELC', year: 'I' },
            { role: 'Team Member', name: 'Sanjanaa Eswaran', gender: 'F', email: 'cb.en.u4elc26043@cb.students.amrita.edu', mobile: '9363774785', stream: 'ELC', year: 'I' },
            { role: 'Team Member', name: 'Mithunesh G', gender: 'M', email: 'cb.en.u4elc26027@cb.students.amrita.edu', mobile: '6382627316', stream: 'ELC', year: 'I' }
        ]
    };

    let parsedBatchTeams = [];
    let zoomLevel = 1.0;

    // DOM Elements
    const form = document.getElementById('doc-form');
    const teamIdInput = document.getElementById('team_id');
    const teamNameInput = document.getElementById('team_name');
    const dateStrInput = document.getElementById('date_str');
    const aicteCodeInput = document.getElementById('aicte_code');
    const hackathonNameInput = document.getElementById('hackathon_name');
    const signatoryNameInput = document.getElementById('signatory_name');
    const signatoryTitleInput = document.getElementById('signatory_title');
    const collegeNameInput = document.getElementById('college_name');
    
    const previewFilename = document.getElementById('preview-filename');
    const footerBtnFilename = document.getElementById('footer-btn-filename');
    const memberCountDisplay = document.getElementById('member-count-display');
    const membersListContainer = document.getElementById('members-list');
    
    const btnAddMember = document.getElementById('btn-add-member');
    const btnSample = document.getElementById('btn-sample');
    const btnClear = document.getElementById('btn-clear');
    const btnDownloadDocx = document.getElementById('btn-download-docx');
    const btnPrintPreview = document.getElementById('btn-print-preview');
    const btnTodayDate = document.getElementById('btn-today-date');
    const btnTheme = document.getElementById('btn-theme');

    // Zoom Controls
    const btnZoomIn = document.getElementById('zoom-in');
    const btnZoomOut = document.getElementById('zoom-out');
    const btnZoomReset = document.getElementById('zoom-reset');
    const zoomVal = document.getElementById('zoom-val');
    const paperDoc = document.getElementById('paper-doc');

    // Batch Modal Elements
    const btnBatchModal = document.getElementById('btn-batch-modal');
    const batchModal = document.getElementById('batch-modal');
    const btnCloseBatch = document.getElementById('btn-close-batch');
    const btnCancelBatch = document.getElementById('btn-cancel-batch');
    const csvDropzone = document.getElementById('csv-dropzone');
    const csvFileInput = document.getElementById('csv-file-input');
    const btnBrowseCsv = document.getElementById('btn-browse-csv');
    const parsedSection = document.getElementById('parsed-section');
    const parsedCount = document.getElementById('parsed-count');
    const parsedTableBody = document.getElementById('parsed-table-body');
    const btnGenerateZip = document.getElementById('btn-generate-zip');

    // Preview Elements
    const pvDate = document.getElementById('pv-date');
    const pvHackathon = document.getElementById('pv-hackathon');
    const pvAicte = document.getElementById('pv-aicte');
    const pvTeamName = document.getElementById('pv-team-name');
    const pvTableBody = document.getElementById('pv-table-body');
    const pvSignatoryName = document.getElementById('pv-signatory-name');
    const pvSignatoryTitle = document.getElementById('pv-signatory-title');
    const pvCollegeName = document.getElementById('pv-college-name');
    const sihRuleBadge = document.getElementById('sih-rule-badge');
    const complianceText = document.getElementById('compliance-text');

    // Initialize Form with State
    function populateForm() {
        teamIdInput.value = state.team_id || '';
        teamNameInput.value = state.team_name || '';
        dateStrInput.value = state.date_str || '';
        aicteCodeInput.value = state.aicte_code || '';
        hackathonNameInput.value = state.hackathon_name || '';
        signatoryNameInput.value = state.signatory_name || '';
        signatoryTitleInput.value = state.signatory_title || '';
        collegeNameInput.value = state.college_name || '';

        renderMemberCards();
        updateFilenames();
        updateLivePreview();
        checkSIHCompliance();
    }

    // Render Member Input Cards
    function renderMemberCards() {
        membersListContainer.innerHTML = '';
        memberCountDisplay.textContent = state.members.length;

        state.members.forEach((m, idx) => {
            const isLeader = m.role === 'Team Leader' || idx === 0;
            const card = document.createElement('div');
            card.className = `member-card ${isLeader ? 'is-leader' : ''}`;
            card.dataset.index = idx;

            card.innerHTML = `
                <div class="member-card-header">
                    <span class="member-role-badge ${isLeader ? 'badge-leader' : 'badge-member'}">
                        ${isLeader ? '★ Team Leader' : `#${idx + 1} Team Member`}
                    </span>
                    <div class="member-card-actions">
                        ${state.members.length > 1 ? `
                            <button type="button" class="btn-icon btn-remove-member" title="Remove member" data-index="${idx}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="member-fields-grid">
                    <div class="member-field">
                        <label>Full Name</label>
                        <input type="text" class="input-m-name" data-index="${idx}" placeholder="Student Name" value="${escapeHtml(m.name || '')}">
                    </div>
                    <div class="member-field">
                        <label>Gender</label>
                        <select class="input-m-gender" data-index="${idx}">
                            <option value="M" ${m.gender === 'M' ? 'selected' : ''}>M</option>
                            <option value="F" ${m.gender === 'F' ? 'selected' : ''}>F</option>
                            <option value="Other" ${m.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="member-field">
                        <label>Email ID</label>
                        <input type="email" class="input-m-email" data-index="${idx}" placeholder="student@college.edu" value="${escapeHtml(m.email || '')}">
                    </div>
                    <div class="member-field">
                        <label>Mobile No.</label>
                        <input type="tel" class="input-m-mobile" data-index="${idx}" placeholder="10-digit number" value="${escapeHtml(m.mobile || '')}">
                    </div>
                    <div class="member-field">
                        <label>Stream</label>
                        <input type="text" class="input-m-stream" data-index="${idx}" placeholder="e.g. ELC, CSE" value="${escapeHtml(m.stream || '')}">
                    </div>
                    <div class="member-field">
                        <label>Academic Year</label>
                        <select class="input-m-year" data-index="${idx}">
                            <option value="I" ${m.year === 'I' ? 'selected' : ''}>I</option>
                            <option value="II" ${m.year === 'II' ? 'selected' : ''}>II</option>
                            <option value="III" ${m.year === 'III' ? 'selected' : ''}>III</option>
                            <option value="IV" ${m.year === 'IV' ? 'selected' : ''}>IV</option>
                        </select>
                    </div>
                </div>
            `;

            membersListContainer.appendChild(card);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }

        attachMemberListeners();
    }

    function attachMemberListeners() {
        // Input changes
        document.querySelectorAll('.input-m-name').forEach(el => {
            el.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].name = e.target.value;
                updateLivePreview();
            });
        });

        document.querySelectorAll('.input-m-gender').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].gender = e.target.value;
                updateLivePreview();
                checkSIHCompliance();
            });
        });

        document.querySelectorAll('.input-m-email').forEach(el => {
            el.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].email = e.target.value;
                updateLivePreview();
            });
        });

        document.querySelectorAll('.input-m-mobile').forEach(el => {
            el.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].mobile = e.target.value;
                updateLivePreview();
            });
        });

        document.querySelectorAll('.input-m-stream').forEach(el => {
            el.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].stream = e.target.value;
                updateLivePreview();
            });
        });

        document.querySelectorAll('.input-m-year').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.members[idx].year = e.target.value;
                updateLivePreview();
            });
        });

        // Remove member buttons
        document.querySelectorAll('.btn-remove-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index, 10);
                state.members.splice(idx, 1);
                // Ensure first member remains team leader
                if (state.members.length > 0) {
                    state.members[0].role = 'Team Leader';
                }
                renderMemberCards();
                updateLivePreview();
                checkSIHCompliance();
            });
        });
    }

    // Update Download Filename previews
    function updateFilenames() {
        const rawId = teamIdInput.value.trim() || 'nomination_doc';
        const safeId = rawId.replace(/[\\/*?:"<>|]/g, '_');
        const filename = `${safeId}.docx`;
        previewFilename.textContent = filename;
        footerBtnFilename.textContent = filename;
    }

    // Check SIH Rules (6 Members & At least 1 Female Member)
    function checkSIHCompliance() {
        const count = state.members.length;
        const femaleCount = state.members.filter(m => m.gender === 'F').length;

        if (count === 6 && femaleCount >= 1) {
            sihRuleBadge.className = 'compliance-badge';
            complianceText.textContent = `SIH Ready: 6 Members (${femaleCount} Female)`;
        } else if (count === 6 && femaleCount === 0) {
            sihRuleBadge.className = 'compliance-badge warning';
            complianceText.textContent = `SIH Warning: Needs ≥ 1 Female Member`;
        } else {
            sihRuleBadge.className = 'compliance-badge warning';
            complianceText.textContent = `${count} Members (SIH Standard is 6)`;
        }
    }

    // Update Live Document Preview (Right Panel)
    function updateLivePreview() {
        pvDate.textContent = state.date_str || '17/September/2026';
        pvHackathon.textContent = state.hackathon_name || 'Smart India Hackathon 2026';
        pvAicte.textContent = state.aicte_code || 'U-0436';
        pvTeamName.textContent = state.team_name || 'FORGE-26';
        pvSignatoryName.textContent = state.signatory_name || 'Dr. Sasangan Ramanathan';
        pvSignatoryTitle.textContent = state.signatory_title || 'Dean Academics';
        pvCollegeName.textContent = state.college_name || 'Amrita Vishwa Vidyapeetham, Coimbatore.';

        // Render Table Rows in Preview
        pvTableBody.innerHTML = '';
        state.members.forEach((m, idx) => {
            const tr = document.createElement('tr');
            const roleText = m.role || (idx === 0 ? 'Team Leader' : 'Team Member');
            
            // Format email with soft breaks for narrow columns
            const emailFormatted = escapeHtml(m.email || '');

            tr.innerHTML = `
                <td>${escapeHtml(roleText)}</td>
                <td>${escapeHtml(m.name || '')}</td>
                <td>${escapeHtml(m.gender || '')}</td>
                <td style="word-break: break-all;">${emailFormatted}</td>
                <td>${escapeHtml(m.mobile || '')}</td>
                <td>${escapeHtml(m.stream || '')}</td>
                <td>${escapeHtml(m.year || '')}</td>
            `;
            pvTableBody.appendChild(tr);
        });
    }

    // Event Listeners for Main Form Inputs
    teamIdInput.addEventListener('input', (e) => {
        state.team_id = e.target.value;
        updateFilenames();
    });

    teamNameInput.addEventListener('input', (e) => {
        state.team_name = e.target.value;
        updateLivePreview();
    });

    dateStrInput.addEventListener('input', (e) => {
        state.date_str = e.target.value;
        updateLivePreview();
    });

    aicteCodeInput.addEventListener('input', (e) => {
        state.aicte_code = e.target.value;
        updateLivePreview();
    });

    hackathonNameInput.addEventListener('input', (e) => {
        state.hackathon_name = e.target.value;
        updateLivePreview();
    });

    signatoryNameInput.addEventListener('input', (e) => {
        state.signatory_name = e.target.value;
        updateLivePreview();
    });

    signatoryTitleInput.addEventListener('input', (e) => {
        state.signatory_title = e.target.value;
        updateLivePreview();
    });

    collegeNameInput.addEventListener('input', (e) => {
        state.college_name = e.target.value;
        updateLivePreview();
    });

    // Quick Date: Today
    btnTodayDate.addEventListener('click', () => {
        const today = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const formatted = `${today.getDate()}/${months[today.getMonth()]}/${today.getFullYear()}`;
        dateStrInput.value = formatted;
        state.date_str = formatted;
        updateLivePreview();
        showToast('Nomination date set to today', 'info');
    });

    // Add Member
    btnAddMember.addEventListener('click', () => {
        const newIndex = state.members.length + 1;
        state.members.push({
            role: 'Team Member',
            name: '',
            gender: 'M',
            email: '',
            mobile: '',
            stream: state.members[0]?.stream || 'CSE',
            year: state.members[0]?.year || 'I'
        });
        renderMemberCards();
        updateLivePreview();
        checkSIHCompliance();
        showToast(`Member #${newIndex} added`, 'info');
    });

    // Load Sample Data
    btnSample.addEventListener('click', async () => {
        try {
            const resp = await fetch('/api/sample');
            if (resp.ok) {
                const sampleData = await resp.json();
                state = sampleData;
                populateForm();
                showToast('Sample data loaded successfully!', 'success');
            } else {
                throw new Error('Could not fetch sample API');
            }
        } catch (err) {
            console.warn('API error, loading fallback sample:', err);
            // Fallback
            state = {
                team_id: '074_forge26',
                team_name: 'FORGE-26',
                date_str: '17/September/2026',
                hackathon_name: 'Smart India Hackathon 2026',
                aicte_code: 'U-0436',
                signatory_name: 'Dr. Sasangan Ramanathan',
                signatory_title: 'Dean Academics',
                college_name: 'Amrita Vishwa Vidyapeetham, Coimbatore.',
                members: [
                    { role: 'Team Leader', name: 'Savetha Aravindan', gender: 'F', email: 'cb.en.u4elc26045@cb.students.amrita.edu', mobile: '9843865733', stream: 'ELC', year: 'I' },
                    { role: 'Team Member', name: 'Vidhun J H', gender: 'M', email: 'cb.en.u4elc26055@cb.students.amrita.edu', mobile: '9384469559', stream: 'ELC', year: 'I' },
                    { role: 'Team Member', name: 'Venyaa J D', gender: 'F', email: 'cb.en.u4elc26054@cb.students.amrita.edu', mobile: '7812893626', stream: 'ELC', year: 'I' },
                    { role: 'Team Member', name: 'Tharaneesh M K', gender: 'M', email: 'cb.en.u4elc26149@cb.students.amrita.edu', mobile: '9842616770', stream: 'ELC', year: 'I' },
                    { role: 'Team Member', name: 'Sanjanaa Eswaran', gender: 'F', email: 'cb.en.u4elc26043@cb.students.amrita.edu', mobile: '9363774785', stream: 'ELC', year: 'I' },
                    { role: 'Team Member', name: 'Mithunesh G', gender: 'M', email: 'cb.en.u4elc26027@cb.students.amrita.edu', mobile: '6382627316', stream: 'ELC', year: 'I' }
                ]
            };
            populateForm();
            showToast('Sample data loaded!', 'success');
        }
    });

    // Clear Form
    btnClear.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all fields?')) {
            state = {
                team_id: '',
                team_name: '',
                date_str: '17/September/2026',
                hackathon_name: 'Smart India Hackathon 2026',
                aicte_code: 'U-0436',
                signatory_name: 'Dr. Sasangan Ramanathan',
                signatory_title: 'Dean Academics',
                college_name: 'Amrita Vishwa Vidyapeetham, Coimbatore.',
                members: [
                    { role: 'Team Leader', name: '', gender: 'M', email: '', mobile: '', stream: '', year: 'I' }
                ]
            };
            populateForm();
            showToast('Form reset', 'info');
        }
    });

    // Client-side DOCX generator for GitHub Pages (Zero backend required)
    async function generateDocxClientSide(data) {
        const res = await fetch('./074_forge26.docx');
        if (!res.ok) throw new Error('Could not load template 074_forge26.docx');
        const arrayBuffer = await res.arrayBuffer();

        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml').async('string');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'application/xml');
        const wNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

        const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'p'));

        // 1. Date
        for (const p of paragraphs) {
            if (p.textContent.trim().startsWith('Date:')) {
                const runs = p.getElementsByTagNameNS(wNS, 'r');
                for (let i = runs.length - 1; i > 0; i--) p.removeChild(runs[i]);
                if (runs.length > 0) {
                    const t = runs[0].getElementsByTagNameNS(wNS, 't')[0];
                    if (t) t.textContent = `Date: ${data.date_str || '17/September/2026'}`;
                }
                break;
            }
        }

        // 2. Subject
        for (const p of paragraphs) {
            if (p.textContent.includes('Smart India Hackathon') && p.textContent.includes('Nomination')) {
                const runs = p.getElementsByTagNameNS(wNS, 'r');
                for (let i = runs.length - 1; i > 0; i--) p.removeChild(runs[i]);
                if (runs.length > 0) {
                    const t = runs[0].getElementsByTagNameNS(wNS, 't')[0];
                    if (t) t.textContent = `Sub: ${data.hackathon_name || 'Smart India Hackathon 2026'} – Nomination`;
                }
                break;
            }
        }

        // 3. Body (AICTE code)
        for (const p of paragraphs) {
            if (p.textContent.includes('AICTE Application No') || p.textContent.includes('UGC Registration No')) {
                const runs = Array.from(p.getElementsByTagNameNS(wNS, 'r'));
                for (const r of runs) {
                    const t = r.getElementsByTagNameNS(wNS, 't')[0];
                    if (t && (t.textContent.includes('U-0436') || t.textContent.includes('U-'))) {
                        t.textContent = `${data.aicte_code || 'U-0436'}.`;
                    }
                }
                break;
            }
        }

        // 4. Team Name
        for (const p of paragraphs) {
            if (p.textContent.trim().startsWith('Team:')) {
                const runs = p.getElementsByTagNameNS(wNS, 'r');
                if (runs.length > 0) {
                    const lastRun = runs[runs.length - 1];
                    const t = lastRun.getElementsByTagNameNS(wNS, 't')[0];
                    if (t) t.textContent = data.team_name || 'FORGE-26';
                }
                break;
            }
        }

        // 5. Table Rows
        const tables = xmlDoc.getElementsByTagNameNS(wNS, 'tbl');
        if (tables.length > 0) {
            const tbl = tables[0];
            const rows = Array.from(tbl.getElementsByTagNameNS(wNS, 'tr'));
            const members = data.members || [];

            for (let idx = 0; idx < members.length && idx < rows.length - 1; idx++) {
                const row = rows[idx + 1];
                const cells = Array.from(row.getElementsByTagNameNS(wNS, 'tc'));
                const m = members[idx];

                const setCell = (cell, val) => {
                    const tList = cell.getElementsByTagNameNS(wNS, 't');
                    if (tList.length > 0) {
                        tList[0].textContent = val || '';
                        for (let j = 1; j < tList.length; j++) tList[j].textContent = '';
                    }
                };

                if (cells[0]) setCell(cells[0], m.role || (idx === 0 ? 'Team Leader' : 'Team Member'));
                if (cells[1]) setCell(cells[1], m.name || '');
                if (cells[2]) setCell(cells[2], m.gender || '');
                if (cells[3]) setCell(cells[3], m.email || '');
                if (cells[4]) setCell(cells[4], m.mobile || '');
                if (cells[5]) setCell(cells[5], m.stream || '');
                if (cells[6]) setCell(cells[6], m.year || '');
            }
        }

        // 6. Signatory
        let foundSinc = false;
        for (const p of paragraphs) {
            const text = p.textContent || '';
            if (text.includes('Sincerely')) {
                foundSinc = true;
            } else if (foundSinc && (text.includes('Dr.') || text.includes('Sasangan') || text.includes('Signatory'))) {
                const tList = p.getElementsByTagNameNS(wNS, 't');
                if (tList.length > 0) {
                    tList[0].textContent = `${data.signatory_name || 'Dr. Sasangan Ramanathan'} `;
                    for (let j = 1; j < tList.length; j++) tList[j].textContent = '';
                }
            } else if (foundSinc && (text.includes('Dean') || text.includes('Academics') || text.includes('Principal'))) {
                const tList = p.getElementsByTagNameNS(wNS, 't');
                if (tList.length > 0) {
                    tList[0].textContent = `${data.signatory_title || 'Dean Academics'} `;
                    for (let j = 1; j < tList.length; j++) tList[j].textContent = '';
                }
            } else if (foundSinc && (text.includes('Amrita') || text.includes('Vidyapeetham') || text.includes('College'))) {
                const tList = p.getElementsByTagNameNS(wNS, 't');
                if (tList.length > 0) {
                    tList[0].textContent = data.college_name || 'Amrita Vishwa Vidyapeetham, Coimbatore.';
                    for (let j = 1; j < tList.length; j++) tList[j].textContent = '';
                }
            }
        }

        const serializer = new XMLSerializer();
        const newXmlStr = serializer.serializeToString(xmlDoc);
        zip.file('word/document.xml', newXmlStr);

        return await zip.generateAsync({ type: 'blob' });
    }

    // Download .docx Trigger (Tries Backend API, falls back seamlessly to Client-side on GitHub Pages)
    btnDownloadDocx.addEventListener('click', async () => {
        if (!state.team_id || !state.team_name) {
            showToast('Please enter Team ID and Team Name first', 'error');
            teamIdInput.focus();
            return;
        }

        const safeId = state.team_id.replace(/[\\/*?:"<>|]/g, '_');
        const filename = `${safeId}.docx`;
        
        btnDownloadDocx.disabled = true;
        btnDownloadDocx.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Generating...`;
        if (window.lucide) window.lucide.createIcons();

        try {
            let blob;
            try {
                const resp = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(state)
                });
                if (resp.ok) {
                    blob = await resp.blob();
                } else {
                    throw new Error('API unavailable, falling back to client-side generator');
                }
            } catch (backendErr) {
                console.log('Using client-side DOCX generation:', backendErr.message);
                blob = await generateDocxClientSide(state);
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            showToast(`Downloaded Word Document: ${filename}`, 'success');
        } catch (err) {
            console.error('Download error:', err);
            showToast('Failed to generate Word document.', 'error');
        } finally {
            btnDownloadDocx.disabled = false;
            btnDownloadDocx.innerHTML = `<i data-lucide="file-text"></i> <span>Download .docx (<span id="footer-btn-filename">${filename}</span>)</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // Download .pdf Trigger
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', async () => {
            if (!state.team_id || !state.team_name) {
                showToast('Please enter Team ID and Team Name first', 'error');
                teamIdInput.focus();
                return;
            }

            const safeId = state.team_id.replace(/[\\/*?:"<>|]/g, '_');
            const pdfFilename = `${safeId}.pdf`;

            btnDownloadPdf.disabled = true;
            btnDownloadPdf.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Creating PDF...`;
            if (window.lucide) window.lucide.createIcons();

            try {
                const element = document.getElementById('paper-doc');
                const opt = {
                    margin:       [10, 10, 10, 10],
                    filename:     pdfFilename,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                if (window.html2pdf) {
                    await window.html2pdf().set(opt).from(element).save();
                    showToast(`Downloaded PDF: ${pdfFilename}`, 'success');
                } else {
                    window.print();
                }
            } catch (err) {
                console.error('PDF error:', err);
                showToast('Printing document as PDF...', 'info');
                window.print();
            } finally {
                btnDownloadPdf.disabled = false;
                btnDownloadPdf.innerHTML = `<i data-lucide="file-down"></i> <span>Download .pdf</span>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // Print / PDF
    btnPrintPreview.addEventListener('click', () => {
        window.print();
    });

    // Zoom Controls
    function setZoom(factor) {
        zoomLevel = Math.max(0.5, Math.min(1.5, factor));
        paperDoc.style.transform = `scale(${zoomLevel})`;
        zoomVal.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    btnZoomIn.addEventListener('click', () => setZoom(zoomLevel + 0.1));
    btnZoomOut.addEventListener('click', () => setZoom(zoomLevel - 0.1));
    btnZoomReset.addEventListener('click', () => setZoom(1.0));

    // Theme Toggle
    btnTheme.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        if (window.lucide) window.lucide.createIcons();
    });

    // =========================================================================
    // BATCH MODE & CSV HANDLING
    // =========================================================================
    btnBatchModal.addEventListener('click', () => {
        batchModal.style.display = 'flex';
    });

    function closeBatchModal() {
        batchModal.style.display = 'none';
    }

    btnCloseBatch.addEventListener('click', closeBatchModal);
    btnCancelBatch.addEventListener('click', closeBatchModal);

    // CSV File Select & Drag-and-drop
    btnBrowseCsv.addEventListener('click', () => csvFileInput.click());
    csvDropzone.addEventListener('click', (e) => {
        if (e.target !== btnBrowseCsv) csvFileInput.click();
    });

    csvDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        csvDropzone.classList.add('drag-over');
    });

    csvDropzone.addEventListener('dragleave', () => {
        csvDropzone.classList.remove('drag-over');
    });

    csvDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        csvDropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleCsvFile(e.dataTransfer.files[0]);
        }
    });

    csvFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleCsvFile(e.target.files[0]);
        }
    });

    async function handleCsvFile(file) {
        if (!file.name.endsWith('.csv')) {
            showToast('Please upload a valid .csv file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch('/api/parse-csv', {
                method: 'POST',
                body: formData
            });

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.error || 'Failed to parse CSV');
            }

            const data = await resp.json();
            parsedBatchTeams = data.teams || [];

            if (parsedBatchTeams.length === 0) {
                showToast('No teams found in uploaded CSV', 'error');
                return;
            }

            renderParsedTeamsTable();
            parsedSection.style.display = 'block';
            btnGenerateZip.disabled = false;
            showToast(`Loaded ${parsedBatchTeams.length} teams from CSV!`, 'success');

        } catch (err) {
            console.error('CSV error:', err);
            showToast(err.message, 'error');
        }
    }

    function renderParsedTeamsTable() {
        parsedCount.textContent = parsedBatchTeams.length;
        parsedTableBody.innerHTML = '';

        parsedBatchTeams.forEach((team, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(team.team_id || '')}</strong></td>
                <td>${escapeHtml(team.team_name || '')}</td>
                <td>${team.members?.length || 0} members</td>
                <td>${escapeHtml(team.signatory_name || '')}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-secondary btn-load-team" data-index="${idx}" title="Load this team into editor">
                        Load in Editor
                    </button>
                </td>
            `;
            parsedTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-load-team').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                state = parsedBatchTeams[idx];
                populateForm();
                closeBatchModal();
                showToast(`Loaded team: ${state.team_id}`, 'success');
            });
        });
    }

    // Generate ZIP of all parsed teams
    btnGenerateZip.addEventListener('click', async () => {
        if (parsedBatchTeams.length === 0) return;

        btnGenerateZip.disabled = true;
        btnGenerateZip.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Creating ZIP...`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const resp = await fetch('/api/batch-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedBatchTeams)
            });

            if (!resp.ok) {
                throw new Error('Batch generation failed');
            }

            const blob = await resp.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = 'sih_nomination_docs.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            showToast(`Downloaded ZIP with ${parsedBatchTeams.length} documents!`, 'success');
            closeBatchModal();
        } catch (err) {
            console.error('Batch ZIP error:', err);
            showToast('Failed to download ZIP archive.', 'error');
        } finally {
            btnGenerateZip.disabled = false;
            btnGenerateZip.innerHTML = `<i data-lucide="archive"></i> <span>Generate & Download ZIP</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // Helper: Toast Notifications
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial load
    populateForm();
});
