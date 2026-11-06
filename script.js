// Cash Advance System – Full Supabase Integration
// Sidebar navigation → page switching
// Dashboard, Areas, Employees, CA Form, CA Table, Deductions, Logs

document.addEventListener('DOMContentLoaded', () => {
  // ── Supabase client ──
  const SUPABASE_URL = 'https://vnufcnasmkojljwoygvi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SqulGHXb8A_ESwA2_RzBQw_V-W0rNfQ';
  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Session state ──
  const session = { role: null, payslip: null };
  const persistSession = () => localStorage.setItem('caSession', JSON.stringify(session));
  const clearSession   = () => { session.role = null; session.payslip = null; localStorage.removeItem('caSession'); };
  const loadSession    = () => {
    try { const s = JSON.parse(localStorage.getItem('caSession')); if (s && s.role) Object.assign(session, s); } catch(e) {}
  };
  loadSession();

  // ── DOM refs ──
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle  = document.getElementById('sidebarToggle');
  const sidebarClose   = document.getElementById('sidebarClose');

  // Areas
  const newAreaInput   = document.getElementById('newAreaInput');
  const addAreaBtn     = document.getElementById('addAreaBtn');
  const areaList       = document.getElementById('areaList');

  // Employees
  const newEmpName     = document.getElementById('newEmpName');
  const newEmpArea     = document.getElementById('newEmpArea');
  const newEmpPaySlip  = document.getElementById('newEmpPaySlip');
  const addEmployeeBtn = document.getElementById('addEmployeeBtn');
  const employeeList   = document.getElementById('employeeList');

  // CA Form
  const form                  = document.getElementById('cashForm');
  const areaSelect            = document.getElementById('area');
  const empNameSelect         = document.getElementById('empName');
  const paySlipInput          = document.getElementById('paySlip');
  const initialBalanceInput   = document.getElementById('initialBalance');
  const remainingBalanceInput = document.getElementById('remainingBalance');
  const submitBtn             = document.getElementById('submitCashAdvanceBtn');

  // Deductions
  const deductEmpSelect = document.getElementById('deductEmpSelect');
  const loadEmpCABtn    = document.getElementById('loadEmpCABtn');
  const caInfoBanner    = document.getElementById('caInfoBanner');
  const caInfoName      = document.getElementById('caInfoName');
  const caInfoPaySlip   = document.getElementById('caInfoPaySlip');
  const caInfoInitial   = document.getElementById('caInfoInitial');
  const caInfoRemaining = document.getElementById('caInfoRemaining');
  const monthInput      = document.getElementById('deductionMonth');
  const dateInput       = document.getElementById('deductionDate');
  const amountInput     = document.getElementById('deductionAmount');
  const addBtn          = document.getElementById('addDeductionBtn');
  const deductionsBody  = document.getElementById('deductionsBody');

  // Dashboard
  const statTotalCA        = document.getElementById('statTotalCA');
  const statTotalPaid      = document.getElementById('statTotalPaid');
  const statTotalRemaining = document.getElementById('statTotalRemaining');

  // CA Table
  const cashAdvancesBody = document.getElementById('cashAdvancesBody');
  const caTableEmpty     = document.getElementById('caTableEmpty');

  // Logs
  const logContent = document.getElementById('logContent');

  // Status bar
  const statusBar  = document.getElementById('statusBar');

  // ── Theme Switcher refs & logic ──
  const THEME_KEY        = 'ca_theme';
  const themeDarkBtn     = document.getElementById('themeDarkBtn');
  const themeClassicBtn  = document.getElementById('themeClassicBtn');
  const themeStatusPill  = document.getElementById('themeStatusPill');
  const loginThemeToggle = document.getElementById('loginThemeToggle');
  const loginThemeIcon   = document.getElementById('loginThemeIcon');
  const loginThemeText   = document.getElementById('loginThemeText');

  function applyTheme(theme, save = true) {
    const isClassic = theme === 'classic';
    const activeTheme = isClassic ? 'classic' : 'dark';

    if (isClassic) {
      document.documentElement.setAttribute('data-theme', 'classic');
      document.body.classList.add('theme-classic');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.remove('theme-classic');
    }

    if (themeDarkBtn && themeClassicBtn) {
      themeDarkBtn.classList.toggle('active', !isClassic);
      themeClassicBtn.classList.toggle('active', isClassic);
    }

    if (themeStatusPill) {
      themeStatusPill.textContent = isClassic ? 'Classic' : 'Dark';
    }

    if (loginThemeIcon && loginThemeText) {
      loginThemeIcon.textContent = isClassic ? '☀️' : '🌙';
      loginThemeText.textContent = isClassic ? 'Classic' : 'Dark';
    }

    if (save) {
      try {
        localStorage.setItem(THEME_KEY, activeTheme);
      } catch (e) {}
    }
  }

  function initTheme() {
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    } catch (e) {}

    applyTheme(savedTheme, false);

    if (themeDarkBtn) {
      themeDarkBtn.addEventListener('click', () => {
        applyTheme('dark');
        addLog('Theme switched to Dark theme.');
      });
    }

    if (themeClassicBtn) {
      themeClassicBtn.addEventListener('click', () => {
        applyTheme('classic');
        addLog('Theme switched to Classic theme.');
      });
    }

    if (loginThemeToggle) {
      loginThemeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'classic' ? 'dark' : 'classic';
        applyTheme(next);
        addLog(`Theme switched to ${next === 'classic' ? 'Classic' : 'Dark'} theme.`);
      });
    }
  }

  initTheme();

  let selectedCashAdvanceId = null;

  // ── Helpers ──
  const fmt = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function showStatus(msg, type = 'success') {
    statusBar.textContent = msg;
    statusBar.className = 'status-bar show ' + type;
    setTimeout(() => { statusBar.className = 'status-bar'; }, 4000);
  }

  function addLog(msg) {
    const now = new Date().toLocaleTimeString();
    const line = `[${now}] ${msg}\n`;
    if (logContent.textContent === 'Waiting for actions…') {
      logContent.textContent = line;
    } else {
      logContent.textContent += line;
    }
    logContent.scrollTop = logContent.scrollHeight;
  }

  // ═══════════════════════════════════════
  //  SIDEBAR TOGGLE (mobile)
  // ═══════════════════════════════════════
  function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); }

  sidebarToggle.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // ═══════════════════════════════════════
  //  PAGE NAVIGATION
  // ═══════════════════════════════════════
  const navLinks = document.querySelectorAll('.nav-link');
  const pages    = document.querySelectorAll('.page');

  // ── Role-based UI ──
  function applyRoleUI() {
    const overlay  = document.getElementById('loginOverlay');
    const wrapper  = document.getElementById('appWrapper');
    const badge    = document.getElementById('userBadge');
    const banner   = document.getElementById('viewerInfoBanner');
    const payDisp  = document.getElementById('viewerPayslipDisplay');

    if (!session.role) {
      overlay.classList.remove('hidden');
      wrapper.classList.add('hidden');
      return;
    }

    overlay.classList.add('hidden');
    wrapper.classList.remove('hidden');

    // Badge
    badge.textContent = session.role === 'admin' ? '🔐 Admin' : `👁️ Viewer (${session.payslip})`;
    badge.className   = 'user-badge role-' + session.role;

    // Nav visibility
    navLinks.forEach(link => {
      const allowed = link.dataset.role; // "admin" or "all"
      if (session.role === 'admin') {
        link.style.display = '';
      } else {
        // Viewer: only show links marked "all"
        link.style.display = allowed === 'all' ? '' : 'none';
      }
    });

    // Viewer info banner
    if (session.role === 'viewer' && banner) {
      banner.classList.remove('hidden');
      payDisp.textContent = session.payslip;
    } else if (banner) {
      banner.classList.add('hidden');
    }
  }

  function showPage(pageId) {
    // Role guard – viewers can only see "all" pages
    const targetPage = document.getElementById(pageId);
    if (targetPage && session.role === 'viewer' && targetPage.dataset.role === 'admin') {
      showStatus('⚠️ Viewers cannot access this page.', 'error');
      return;
    }

    // Hide all pages
    pages.forEach(p => p.classList.remove('active'));
    // Remove active from nav links
    navLinks.forEach(l => l.classList.remove('active'));

    // Show target page
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Mark the correct nav link
    const targetLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (targetLink) {
      targetLink.classList.add('active');
    }

    // Close sidebar on mobile
    closeSidebar();

    // Load data for the target page
    if (pageId === 'dashboard')      loadDashboard();
    if (pageId === 'page-ca-table')  loadCashTable();
    if (pageId === 'page-deductions') { loadDeductionEmployees(); loadDeductionHistory(); }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      showPage(pageId);
    });
  });

  // ═══════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════
  async function loadDashboard() {
    const { data, error } = await db
      .from('cash_advances')
      .select('initial_balance, remaining_balance');

    if (error) { console.error(error); return; }

    let totalInitial   = 0;
    let totalRemaining = 0;

    (data || []).forEach(ca => {
      totalInitial   += Number(ca.initial_balance);
      totalRemaining += Number(ca.remaining_balance);
    });

    const totalPaid = totalInitial - totalRemaining;

    statTotalCA.textContent        = fmt(totalInitial);
    statTotalPaid.textContent      = fmt(totalPaid);
    statTotalRemaining.textContent = fmt(totalRemaining);
  }

  // ═══════════════════════════════════════
  //  AREA MANAGEMENT
  // ═══════════════════════════════════════
  async function loadAreas() {
    const { data, error } = await db.from('areas').select('*').order('name');
    if (error) {
      console.error('Load areas error:', error);
      if (error.message && error.message.includes('does not exist')) {
        showStatus('⚠️ "areas" table not found. Run the SQL setup first.', 'error');
      }
      return [];
    }

    // Update area list on Manage Areas page
    areaList.innerHTML = '';
    data.forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${a.name}</span>
        <button class="delete-item" data-id="${a.id}" data-type="area">✕</button>
      `;
      areaList.appendChild(li);
    });

    // Update dropdowns
    const defaultOpt = '<option value="" disabled selected>Select area</option>';
    const opts = data.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
    areaSelect.innerHTML = defaultOpt + opts;
    newEmpArea.innerHTML  = defaultOpt + opts;

    return data;
  }

  addAreaBtn.addEventListener('click', async () => {
    const name = newAreaInput.value.trim();
    if (!name) { alert('Enter an area name.'); return; }

    const { error } = await db.from('areas').insert([{ name }]);
    if (error) { console.error(error); showStatus('❌ Failed to add area.', 'error'); return; }

    newAreaInput.value = '';
    showStatus(`✅ Area "${name}" added.`);
    addLog(`Area added: ${name}`);
    await loadAreas();
  });

  // ═══════════════════════════════════════
  //  EMPLOYEE MANAGEMENT
  // ═══════════════════════════════════════
  async function loadEmployees() {
    const { data, error } = await db.from('employees').select('*').order('name');
    if (error) {
      console.error('Load employees error:', error);
      return [];
    }

    // Employee list
    employeeList.innerHTML = '';
    data.forEach(e => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-info">
          <span>${e.name}</span>
          <span class="item-sub">${e.area || '—'} · ${e.pay_slip_no || '—'}</span>
        </div>
        <button class="delete-item" data-id="${e.id}" data-type="employee">✕</button>
      `;
      employeeList.appendChild(li);
    });

    // CA form employee dropdown
    const defaultOpt = '<option value="" disabled selected>Select employee</option>';
    const opts = data.map(e => `<option value="${e.name}" data-payslip="${e.pay_slip_no || ''}" data-area="${e.area || ''}">${e.name}</option>`).join('');
    empNameSelect.innerHTML = defaultOpt + opts;

    return data;
  }

  // Auto-fill pay slip and area
  empNameSelect.addEventListener('change', () => {
    const selected = empNameSelect.selectedOptions[0];
    if (selected) {
      paySlipInput.value = selected.dataset.payslip || '';
      const areaVal = selected.dataset.area || '';
      if (areaVal) areaSelect.value = areaVal;
    }
  });

  addEmployeeBtn.addEventListener('click', async () => {
    const name    = newEmpName.value.trim();
    const area    = newEmpArea.value;
    const paySlip = newEmpPaySlip.value.trim();
    if (!name) { alert('Enter employee name.'); return; }

    const { error } = await db.from('employees').insert([{
      name,
      area: area || null,
      pay_slip_no: paySlip || null,
    }]);
    if (error) { console.error(error); showStatus('❌ Failed to add employee.', 'error'); return; }

    newEmpName.value = '';
    newEmpPaySlip.value = '';
    newEmpArea.selectedIndex = 0;
    showStatus(`✅ Employee "${name}" added.`);
    addLog(`Employee added: ${name} (${area || 'no area'})`);
    await loadEmployees();
    await loadDeductionEmployees();
  });

  // Delete area or employee
  document.addEventListener('click', async (e) => {
    if (!e.target.matches('.delete-item')) return;
    const id   = e.target.dataset.id;
    const type = e.target.dataset.type;
    const table = type === 'area' ? 'areas' : 'employees';

    if (!confirm(`Delete this ${type}?`)) return;

    const { error } = await db.from(table).delete().eq('id', id);
    if (error) { console.error(error); showStatus('❌ Delete failed.', 'error'); return; }

    showStatus(`🗑️ ${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`);
    addLog(`${type} deleted (id: ${id.substring(0, 8)}…)`);
    if (type === 'area') await loadAreas();
    else { await loadEmployees(); await loadDeductionEmployees(); }
  });

  // ═══════════════════════════════════════
  //  CASH ADVANCE – SAVE
  // ═══════════════════════════════════════
  initialBalanceInput.addEventListener('input', () => {
    remainingBalanceInput.value = (parseFloat(initialBalanceInput.value) || 0).toFixed(2);
  });

  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const payload = {
      area:              areaSelect.value,
      pay_slip_no:       paySlipInput.value,
      employee_name:     empNameSelect.value,
      date_requested:    document.getElementById('dateRequested').value,
      date_approved:     document.getElementById('dateApproved').value,
      initial_balance:   parseFloat(initialBalanceInput.value) || 0,
      remaining_balance: parseFloat(remainingBalanceInput.value) || 0,
      deduction_start:   document.getElementById('deductionStart').value,
    };

    for (const [key, val] of Object.entries(payload)) {
      if (!val && val !== 0) { alert('Please fill all fields before saving.'); return; }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving…';

    const { data, error } = await db
      .from('cash_advances')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      showStatus('❌ Save failed: ' + (error.message || 'Unknown error'), 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Save Cash Advance';
      return;
    }

    showStatus('✅ Cash advance saved!');
    addLog(`CA saved for ${payload.employee_name} — ${fmt(payload.initial_balance)}`);
    submitBtn.innerHTML = '✅ Saved';

    setTimeout(() => {
      form.reset();
      remainingBalanceInput.value = '';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Save Cash Advance';
      loadDeductionEmployees();
    }, 1500);
  });

  // ═══════════════════════════════════════
  //  CASH ADVANCE TABLE
  // ═══════════════════════════════════════
  async function loadCashTable() {
    let query = db
      .from('cash_advances')
      .select('*')
      .order('created_at', { ascending: false });

    // Viewer: filter to their own payslip only
    if (session.role === 'viewer' && session.payslip) {
      query = query.eq('pay_slip_no', session.payslip);
    }

    const { data, error } = await query;

    if (error) { console.error(error); return; }

    cashAdvancesBody.innerHTML = '';

    if (!data || data.length === 0) {
      caTableEmpty.style.display = 'block';
      return;
    }

    caTableEmpty.style.display = 'none';

    data.forEach((ca, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${ca.employee_name}</td>
        <td>${ca.area}</td>
        <td>${ca.pay_slip_no}</td>
        <td>${fmt(ca.initial_balance)}</td>
        <td>${fmt(ca.remaining_balance)}</td>
        <td>${ca.deduction_start}</td>
      `;
      cashAdvancesBody.appendChild(tr);
    });
  }

  // ═══════════════════════════════════════
  //  DEDUCTIONS – LOAD EMPLOYEE's CA
  // ═══════════════════════════════════════
  async function loadDeductionEmployees() {
    const { data, error } = await db
      .from('cash_advances')
      .select('id, employee_name, pay_slip_no, remaining_balance')
      .gt('remaining_balance', 0)
      .order('employee_name');

    if (error) { console.error(error); return; }

    const defaultOpt = '<option value="" disabled selected>Choose employee with active CA…</option>';
    const opts = (data || []).map(ca =>
      `<option value="${ca.id}">${ca.employee_name} (${ca.pay_slip_no}) — Bal: ${fmt(ca.remaining_balance)}</option>`
    ).join('');
    deductEmpSelect.innerHTML = defaultOpt + opts;
  }

  loadEmpCABtn.addEventListener('click', async () => {
    const caId = deductEmpSelect.value;
    if (!caId) { alert('Select an employee first.'); return; }

    const { data, error } = await db
      .from('cash_advances')
      .select('*')
      .eq('id', caId)
      .single();

    if (error) { console.error(error); showStatus('❌ Failed to load CA.', 'error'); return; }

    selectedCashAdvanceId = data.id;

    caInfoName.textContent      = data.employee_name;
    caInfoPaySlip.textContent   = data.pay_slip_no;
    caInfoInitial.textContent   = fmt(data.initial_balance);
    caInfoRemaining.textContent = fmt(data.remaining_balance);
    caInfoBanner.style.display  = 'grid';

    await loadDeductionRows(data.id);
    showStatus(`✅ Loaded CA for ${data.employee_name}`);
    addLog(`Loaded CA for ${data.employee_name}`);
  });

  async function loadDeductionRows(caId) {
    deductionsBody.innerHTML = '';

    const { data, error } = await db
      .from('deductions')
      .select('*')
      .eq('cash_advance_id', caId)
      .order('created_at');

    if (error) { console.error(error); return; }

    data.forEach((d, i) => {
      const monthStr = d.month ? d.month.substring(0, 7) : '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${monthStr}</td>
        <td>${d.deduction_date}</td>
        <td>${fmt(d.amount)}</td>
        <td><button class="action-btn" data-ded-id="${d.id}" data-amount="${d.amount}">Remove</button></td>
      `;
      deductionsBody.appendChild(tr);
    });
  }

  // ═══════════════════════════════════════
  //  DEDUCTION HISTORY (all employees)
  // ═══════════════════════════════════════
  const deductionHistoryBody  = document.getElementById('deductionHistoryBody');
  const deductionHistoryEmpty = document.getElementById('deductionHistoryEmpty');

  async function loadDeductionHistory() {
    const { data, error } = await db
      .from('deductions')
      .select('*, cash_advances(employee_name, pay_slip_no)')
      .order('created_at', { ascending: false });

    if (error) { console.error('Deduction history error:', error); return; }

    deductionHistoryBody.innerHTML = '';

    if (!data || data.length === 0) {
      deductionHistoryEmpty.style.display = 'block';
      return;
    }

    deductionHistoryEmpty.style.display = 'none';

    data.forEach((d, i) => {
      const empName  = d.cash_advances?.employee_name || '—';
      const paySlip  = d.cash_advances?.pay_slip_no   || '—';
      const monthStr = d.month ? d.month.substring(0, 7) : '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${empName}</td>
        <td>${paySlip}</td>
        <td>${monthStr}</td>
        <td>${d.deduction_date}</td>
        <td>${fmt(d.amount)}</td>
      `;
      deductionHistoryBody.appendChild(tr);
    });
  }

  // ═══════════════════════════════════════
  //  ADD DEDUCTION
  // ═══════════════════════════════════════
  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!selectedCashAdvanceId) { alert('Load an employee\'s CA first.'); return; }

    const month  = monthInput.value;
    const date   = dateInput.value;
    const amount = parseFloat(amountInput.value);

    if (!month || !date || isNaN(amount) || amount <= 0) {
      alert('Fill month, date and a positive amount.');
      return;
    }

    const { data: caData, error: caErr } = await db
      .from('cash_advances')
      .select('remaining_balance')
      .eq('id', selectedCashAdvanceId)
      .single();

    if (caErr) { console.error(caErr); showStatus('❌ Balance fetch failed.', 'error'); return; }

    const currentRemaining = caData.remaining_balance;
    if (amount > currentRemaining) { alert('Deduction exceeds remaining balance.'); return; }

    const { error: dedErr } = await db.from('deductions').insert([{
      cash_advance_id: selectedCashAdvanceId,
      month:           month + '-01',
      deduction_date:  date,
      amount:          amount,
    }]);
    if (dedErr) { console.error(dedErr); showStatus('❌ Deduction save failed.', 'error'); return; }

    const newRemaining = currentRemaining - amount;
    const { error: updErr } = await db
      .from('cash_advances')
      .update({ remaining_balance: newRemaining })
      .eq('id', selectedCashAdvanceId);
    if (updErr) { console.error(updErr); showStatus('❌ Balance update failed.', 'error'); return; }

    caInfoRemaining.textContent = fmt(newRemaining);
    await loadDeductionRows(selectedCashAdvanceId);
    await loadDeductionEmployees();

    showStatus(`✅ Deducted ${fmt(amount)} — Remaining: ${fmt(newRemaining)}`);
    addLog(`Deducted ${fmt(amount)} — Remaining: ${fmt(newRemaining)}`);

    monthInput.value = '';
    dateInput.value = '';
    amountInput.value = '';
  });

  // ═══════════════════════════════════════
  //  REMOVE DEDUCTION
  // ═══════════════════════════════════════
  deductionsBody.addEventListener('click', async (e) => {
    if (!e.target.matches('button.action-btn')) return;
    const btn    = e.target;
    const dedId  = btn.dataset.dedId;
    const amount = parseFloat(btn.dataset.amount);

    if (!confirm('Remove this deduction?')) return;

    const { error: delErr } = await db.from('deductions').delete().eq('id', dedId);
    if (delErr) { console.error(delErr); showStatus('❌ Delete failed.', 'error'); return; }

    const { data: caData } = await db
      .from('cash_advances')
      .select('remaining_balance')
      .eq('id', selectedCashAdvanceId)
      .single();

    const newRemaining = (caData?.remaining_balance || 0) + amount;
    await db.from('cash_advances')
      .update({ remaining_balance: newRemaining })
      .eq('id', selectedCashAdvanceId);

    caInfoRemaining.textContent = fmt(newRemaining);
    await loadDeductionRows(selectedCashAdvanceId);
    await loadDeductionEmployees();

    showStatus(`🔄 Deduction removed — Balance: ${fmt(newRemaining)}`);
    addLog(`Deduction removed — Balance restored to ${fmt(newRemaining)}`);
  });
  // ═══════════════════════════════════════
  //  LOGIN / LOGOUT
  // ═══════════════════════════════════════
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123';

  const loginOverlay    = document.getElementById('loginOverlay');
  const adminLoginForm  = document.getElementById('adminLoginForm');
  const viewerLoginForm = document.getElementById('viewerLoginForm');
  const loginTabs       = document.getElementById('loginTabs');
  const loginError      = document.getElementById('loginError');
  const loginErrorMsg   = document.getElementById('loginErrorMsg');
  const logoutBtn       = document.getElementById('logoutBtn');

  // Tab switching
  loginTabs.addEventListener('click', (e) => {
    if (!e.target.matches('.login-tab')) return;
    const role = e.target.dataset.role;
    loginTabs.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.role === role));
    adminLoginForm.classList.toggle('hidden', role !== 'admin');
    viewerLoginForm.classList.toggle('hidden', role !== 'viewer');
    loginError.classList.add('hidden');
  });

  // Admin login
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('adminUsername').value.trim();
    const pass = document.getElementById('adminPassword').value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      session.role = 'admin';
      session.payslip = null;
      persistSession();
      applyRoleUI();
      showPage('dashboard');
      loginError.classList.add('hidden');
      addLog('Admin logged in.');
    } else {
      loginErrorMsg.textContent = 'Invalid admin credentials';
      loginError.classList.remove('hidden');
    }
  });

  // Viewer login – validate payslip against employees table
  viewerLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payslip = document.getElementById('viewerPayslip').value.trim();
    if (!payslip) { loginErrorMsg.textContent = 'Enter a Pay Slip Number'; loginError.classList.remove('hidden'); return; }

    const { data, error } = await db.from('employees').select('pay_slip_no').eq('pay_slip_no', payslip).single();
    if (error || !data) {
      loginErrorMsg.textContent = 'Pay Slip Number not found';
      loginError.classList.remove('hidden');
      return;
    }

    session.role = 'viewer';
    session.payslip = payslip;
    persistSession();
    applyRoleUI();
    showPage('page-ca-table');
    loginError.classList.add('hidden');
    addLog(`Viewer logged in (${payslip}).`);
  });

  // Password toggle
  document.getElementById('togglePw').addEventListener('click', () => {
    const pw = document.getElementById('adminPassword');
    pw.type = pw.type === 'password' ? 'text' : 'password';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    clearSession();
    applyRoleUI();
    adminLoginForm.reset();
    viewerLoginForm.reset();
    loginTabs.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.role === 'admin'));
    adminLoginForm.classList.remove('hidden');
    viewerLoginForm.classList.add('hidden');
    loginError.classList.add('hidden');
    addLog('User logged out.');
  });

  // ═══════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════
  (async () => {
    applyRoleUI();
    await loadAreas();
    await loadEmployees();
    await loadDashboard();
    await loadDeductionEmployees();
    // Auto-navigate to correct default page if already logged in
    if (session.role === 'admin') showPage('dashboard');
    else if (session.role === 'viewer') showPage('page-ca-table');
    addLog('System initialized.');
  })();
});
