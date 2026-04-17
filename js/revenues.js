'use strict';

function renderRevenueList() {
  _populateFilterDropdowns();

  const search = document.getElementById('search-input').value.toLowerCase();
  const catF   = document.getElementById('filter-category').value;
  const monthF = document.getElementById('filter-month').value;
  const yearF  = document.getElementById('filter-year').value;

  let filtered = db.revenues.filter(r => {
    const [y, m] = r.date.split('-');
    if (catF   && r.category !== catF)  return false;
    if (yearF  && y !== yearF)           return false;
    if (monthF && m !== monthF)          return false;
    if (search) {
      const hay = [r.description, r.notes || '', String(r.amount)].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const total = filtered.reduce((a, r) => a + r.amount, 0);
  document.getElementById('revenue-count').textContent          = `${filtered.length} ${t('stat_entries')}`;
  document.getElementById('revenue-total-filtered').textContent = filtered.length > 0 ? `${t('total_label')} : ${fmt(total)}` : '';

  const container = document.getElementById('revenue-table-container');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <p>${t('empty_no_match')}</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead><tr>
          <th>${t('col_date')}</th><th>${t('col_description')}</th>
          <th>${t('col_category')}</th><th>${t('col_amount')}</th>
          <th>${t('col_notes')}</th><th class="text-end">${t('col_actions')}</th>
        </tr></thead>
        <tbody>
          ${filtered.map(r => {
            const cat = getCategoryById(r.category);
            return `<tr>
              <td class="text-muted small text-nowrap">${fmtDate(r.date)}</td>
              <td class="fw-semibold">${escHtml(r.description)}</td>
              <td><span class="cat-badge" style="background:${cat.color}22; color:${cat.color};">
                ${cat.icon} ${escHtml(cat.name)}
              </span></td>
              <td class="amount-cell">${fmt(r.amount)}</td>
              <td class="text-muted small">${escHtml(r.notes || '—')}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-outline-secondary btn-sm me-1"
                        onclick="openEditModal('${r.id}')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm"
                        onclick="askDeleteRevenue('${r.id}')">
                  <i class="bi bi-trash3"></i>
                </button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function _populateFilterDropdowns() {
  const catSel = document.getElementById('filter-category');
  catSel.options[0].textContent = t('filter_all_categories');
  if (catSel.options.length <= 1) {
    db.categories.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = `${c.icon} ${c.name}`;
      catSel.appendChild(o);
    });
  }
  const yearSel = document.getElementById('filter-year');
  yearSel.options[0].textContent = t('filter_all_years');
  if (yearSel.options.length <= 1) {
    [...new Set(db.revenues.map(r => r.date.slice(0, 4)))].sort().reverse().forEach(y => {
      const o = document.createElement('option');
      o.value = y; o.textContent = y; yearSel.appendChild(o);
    });
  }
  const monthSel = document.getElementById('filter-month');
  monthSel.options[0].textContent = t('filter_all_months');
  if (monthSel.options.length <= 1) {
    getMonths().forEach((m, i) => {
      const o = document.createElement('option');
      o.value = String(i + 1).padStart(2, '0'); o.textContent = m;
      monthSel.appendChild(o);
    });
  }
}

function clearFilters() {
  document.getElementById('search-input').value    = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-month').value    = '';
  document.getElementById('filter-year').value     = '';
  renderRevenueList();
}

function askDeleteRevenue(id) {
  const r = db.revenues.find(x => x.id === id);
  if (!r) return;
  confirmDelete(
    `${t('btn_delete')} "${r.description}" (${fmt(r.amount)}) ?`,
    async () => {
      try {
        await deleteRevenue(id);
        showToast(t('toast_revenue_deleted'));
        refreshCurrentPage();
      } catch { showToast(t('toast_delete_error'), 'error'); }
    }
  );
}

async function submitRevenue() {
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date   = document.getElementById('f-date').value;
  const desc   = document.getElementById('f-desc').value.trim();
  const cat    = document.getElementById('f-cat').value;
  const notes  = document.getElementById('f-notes').value.trim();

  clearRevenueErrors();
  let valid = true;
  if (isNaN(amount) || amount <= 0) { setFieldError('amount', t('err_amount')); valid = false; }
  if (!date)                         { setFieldError('date',   t('err_date'));   valid = false; }
  if (!desc)                         { setFieldError('desc',   t('err_desc'));   valid = false; }
  if (!cat)                          { setFieldError('cat',    t('err_cat'));    valid = false; }
  if (!valid) return;

  const btn = document.getElementById('revenueSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> ${t('saving')}`;

  try {
    if (editingRevenueId) {
      await updateRevenue(editingRevenueId, { amount, date, description: desc, category: cat, notes });
      showToast(t('toast_revenue_updated'));
    } else {
      await addRevenue({ amount, date, description: desc, category: cat, notes });
      showToast(t('toast_revenue_added'));
    }
    bsRevenueModal.hide();
    refreshCurrentPage();
  } catch {
    showToast(t('toast_save_error'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingRevenueId ? t('btn_update') : t('btn_save');
  }
}
