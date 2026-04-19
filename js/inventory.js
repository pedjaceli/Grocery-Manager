'use strict';

// ─── State ────────────────────────────────────────────────────
let invLocation   = 'all';   // 'all' | location id
let editingInvId  = null;
let editingLocId  = null;

// ─── Expiry helpers ───────────────────────────────────────────
function _daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  return Math.round((expiry - today) / 86400000);
}

function _expiryBadge(dateStr) {
  const days = _daysUntilExpiry(dateStr);
  if (days === null) return `<span class="badge bg-secondary">${t('inv_no_expiry')}</span>`;
  if (days < 0)      return `<span class="badge bg-danger">${t('inv_expired')}</span>`;
  if (days === 0)    return `<span class="badge bg-warning text-dark">${t('inv_expires_today')}</span>`;
  if (days <= 3)     return `<span class="badge bg-warning text-dark">${t('inv_expires_soon').replace('{n}', days)}</span>`;
  return `<span class="badge bg-success">${fmtDate(dateStr)}</span>`;
}

function _locationLabel(locId) {
  const loc = getInventoryLocationById(locId);
  return loc ? `${loc.icon} ${escHtml(loc.name)}` : '📦 —';
}

// ─── Entry point ──────────────────────────────────────────────
function renderInventory() {
  _renderStats();
  _renderLocationTabs();
  _renderItems();
}

// ─── Stats bar ────────────────────────────────────────────────
function _renderStats() {
  const items  = db.inventory;
  const total   = items.length;
  const expired = items.filter(i => i.expiry_date && _daysUntilExpiry(i.expiry_date) < 0).length;
  const soon    = items.filter(i => i.expiry_date && _daysUntilExpiry(i.expiry_date) >= 0 && _daysUntilExpiry(i.expiry_date) <= 3).length;

  document.getElementById('inv-stat-total').textContent   = total;
  document.getElementById('inv-stat-soon').textContent    = soon;
  document.getElementById('inv-stat-expired').textContent = expired;

  const banner = document.getElementById('inv-alert-banner');
  if (expired > 0 || soon > 0) {
    const parts = [];
    if (expired > 0) parts.push(`<strong>${expired}</strong> ${t('inv_banner_expired')}`);
    if (soon > 0)    parts.push(`<strong>${soon}</strong> ${t('inv_banner_soon')}`);
    banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${parts.join(' · ')}`;
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }
}

// ─── Location filter tabs ─────────────────────────────────────
function _renderLocationTabs() {
  const container = document.getElementById('inv-loc-tabs');
  if (!container) return;
  const locs = db.inventoryLocations || [];
  const validIds = new Set(locs.map(l => l.id));
  if (invLocation !== 'all' && !validIds.has(invLocation)) invLocation = 'all';

  const tabs = [
    `<button class="inv-loc-btn ${invLocation === 'all' ? 'active' : ''}" data-loc="all" onclick="setInvLocation('all')">${t('filter_all')}</button>`,
    ...locs.map(l => `
      <button class="inv-loc-btn ${invLocation === l.id ? 'active' : ''}" data-loc="${l.id}" onclick="setInvLocation('${l.id}')">
        ${l.icon} ${escHtml(l.name)}
      </button>
    `),
  ];
  container.innerHTML = tabs.join('') + `
    <button class="inv-loc-btn inv-loc-manage" onclick="openManageLocationsModal()" title="${t('inv_manage_locations')}">
      <i class="bi bi-gear-fill"></i>
    </button>`;
}

// ─── Items list ───────────────────────────────────────────────
function _renderItems() {
  const filtered = invLocation === 'all'
    ? db.inventory
    : db.inventory.filter(i => i.location === invLocation);

  const sorted = [...filtered].sort((a, b) => {
    const da = _daysUntilExpiry(a.expiry_date);
    const db_ = _daysUntilExpiry(b.expiry_date);
    if (da === null && db_ === null) return a.name.localeCompare(b.name);
    if (da === null) return 1;
    if (db_ === null) return -1;
    return da - db_;
  });

  const container = document.getElementById('inv-items-container');

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state mt-4">
        <i class="bi bi-box-seam" style="font-size:3rem;"></i>
        <p class="fw-semibold mt-2">${t('inv_empty')}</p>
        <p class="text-muted small">${t('inv_empty_sub')}</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>${t('col_description')}</th>
            <th>${t('label_quantity')}</th>
            <th>${t('label_location')}</th>
            <th>${t('label_expiry')}</th>
            <th class="text-end">${t('col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(invRow).join('')}
        </tbody>
      </table>
    </div>`;
}

function invRow(item) {
  const qty     = `${item.quantity}${item.unit ? ' ' + escHtml(item.unit) : ''}`;
  const loc     = _locationLabel(item.location);
  const days    = _daysUntilExpiry(item.expiry_date);
  const rowCls  = days !== null && days < 0 ? 'table-danger' : days !== null && days <= 3 ? 'table-warning' : '';

  return `<tr class="${rowCls}">
    <td class="fw-semibold">${escHtml(item.name)}${item.note ? `<br><small class="text-muted">${escHtml(item.note)}</small>` : ''}</td>
    <td>${qty}</td>
    <td><small>${loc}</small></td>
    <td>${_expiryBadge(item.expiry_date)}</td>
    <td class="text-end">
      <button class="btn btn-sm btn-outline-secondary py-0 px-1 me-1" onclick="openEditInvModal('${item.id}')">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="confirmDeleteInv('${item.id}')">
        <i class="bi bi-trash3"></i>
      </button>
    </td>
  </tr>`;
}

function setInvLocation(loc) {
  invLocation = loc;
  _renderLocationTabs();
  _renderItems();
}

// ─── Populate the location <select> in add/edit modal ─────────
function _populateInvLocationSelect(selectedId) {
  const sel = document.getElementById('ivf-location');
  const locs = db.inventoryLocations || [];
  const fallback = locs[0] ? locs[0].id : '';
  const effective = locs.some(l => l.id === selectedId) ? selectedId : fallback;
  sel.innerHTML = locs.map(l =>
    `<option value="${l.id}" ${l.id === effective ? 'selected' : ''}>${l.icon} ${escHtml(l.name)}</option>`
  ).join('');
}

// ─── Modal: add / edit inventory item ─────────────────────────
function openAddInvModal() {
  if (!(db.inventoryLocations || []).length) {
    showToast(t('inv_no_locations'), 'error');
    return;
  }
  editingInvId = null;
  document.getElementById('invModalTitle').textContent = t('modal_add_inv');
  document.getElementById('ivf-name').value      = '';
  document.getElementById('ivf-qty').value       = '1';
  document.getElementById('ivf-unit').value      = '';
  document.getElementById('ivf-expiry').value    = '';
  document.getElementById('ivf-note').value      = '';
  _populateInvLocationSelect(invLocation === 'all' ? null : invLocation);
  bsInvModal.show();
}

function openEditInvModal(id) {
  const item = db.inventory.find(i => i.id === id);
  if (!item) return;
  editingInvId = id;
  document.getElementById('invModalTitle').textContent = t('modal_edit_inv');
  document.getElementById('ivf-name').value      = item.name;
  document.getElementById('ivf-qty').value       = item.quantity;
  document.getElementById('ivf-unit').value      = item.unit || '';
  document.getElementById('ivf-expiry').value    = item.expiry_date || '';
  document.getElementById('ivf-note').value      = item.note || '';
  _populateInvLocationSelect(item.location);
  bsInvModal.show();
}

async function saveInvModal() {
  const name = document.getElementById('ivf-name').value.trim();
  if (!name) { document.getElementById('ivf-name').focus(); return; }

  const data = {
    name,
    quantity:    parseFloat(document.getElementById('ivf-qty').value) || 1,
    unit:        document.getElementById('ivf-unit').value.trim(),
    location:    document.getElementById('ivf-location').value,
    expiry_date: document.getElementById('ivf-expiry').value || null,
    note:        document.getElementById('ivf-note').value.trim(),
  };

  try {
    if (editingInvId) {
      await updateInventoryItem(editingInvId, data);
      showToast(t('toast_inv_updated'), 'success');
    } else {
      await addInventoryItem(data);
      showToast(t('toast_inv_added'), 'success');
    }
    bsInvModal.hide();
    renderInventory();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function confirmDeleteInv(id) {
  confirmDelete(t('confirm_delete_inv'), async () => {
    try {
      await deleteInventoryItem(id);
      showToast(t('toast_inv_deleted'), 'success');
      renderInventory();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
}

// ─── Manage locations modal ───────────────────────────────────
function openManageLocationsModal() {
  _renderManageLocationsList();
  editingLocId = null;
  document.getElementById('loc-form-name').value = '';
  document.getElementById('loc-form-icon').value = '📦';
  document.getElementById('loc-form-submit').textContent = t('btn_add');
  bsInvLocModal.show();
}

function _renderManageLocationsList() {
  const container = document.getElementById('loc-list');
  const locs = db.inventoryLocations || [];
  if (locs.length === 0) {
    container.innerHTML = `<p class="text-muted small mb-0">${t('inv_no_locations')}</p>`;
    return;
  }
  container.innerHTML = locs.map(l => `
    <div class="loc-row d-flex align-items-center justify-content-between py-2 border-bottom">
      <div class="d-flex align-items-center gap-2">
        <span style="font-size:1.2rem;">${l.icon}</span>
        <span class="fw-semibold">${escHtml(l.name)}</span>
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="startEditLocation('${l.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="confirmDeleteLocation('${l.id}')">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function startEditLocation(id) {
  const loc = getInventoryLocationById(id);
  if (!loc) return;
  editingLocId = id;
  document.getElementById('loc-form-name').value = loc.name;
  document.getElementById('loc-form-icon').value = loc.icon;
  document.getElementById('loc-form-submit').textContent = t('btn_save');
  document.getElementById('loc-form-name').focus();
}

function cancelEditLocation() {
  editingLocId = null;
  document.getElementById('loc-form-name').value = '';
  document.getElementById('loc-form-icon').value = '📦';
  document.getElementById('loc-form-submit').textContent = t('btn_add');
}

async function submitLocationForm() {
  const name = document.getElementById('loc-form-name').value.trim();
  const icon = document.getElementById('loc-form-icon').value.trim() || '📦';
  if (!name) { document.getElementById('loc-form-name').focus(); return; }
  try {
    if (editingLocId) {
      await updateInventoryLocation(editingLocId, { name, icon });
      showToast(t('toast_loc_updated'), 'success');
    } else {
      await addInventoryLocation({ name, icon });
      showToast(t('toast_loc_added'), 'success');
    }
    cancelEditLocation();
    _renderManageLocationsList();
    renderInventory();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function confirmDeleteLocation(id) {
  confirmDelete(t('confirm_delete_location'), async () => {
    try {
      await deleteInventoryLocation(id);
      showToast(t('toast_loc_deleted'), 'success');
      _renderManageLocationsList();
      renderInventory();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
}
