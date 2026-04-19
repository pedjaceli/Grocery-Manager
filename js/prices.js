'use strict';

// ─── State ────────────────────────────────────────────────────
let pricesTab        = 'product';   // product | store
let pricesSearch     = '';
let editingPriceId   = null;
let editingStoreId   = null;
let expandedProduct  = null;        // product name currently expanded

// ─── Entry point ──────────────────────────────────────────────
function renderPrices() {
  if (pricesTab === 'product') {
    _renderByProduct();
  } else {
    _renderByStore();
  }
}

function switchPricesTab(tab) {
  pricesTab = tab;
  document.querySelectorAll('.prices-tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  renderPrices();
}

// ─── "Par produit" tab ────────────────────────────────────────
function _renderByProduct() {
  const container = document.getElementById('prices-content');
  const records   = db.priceRecords;

  // Group by product name (case-insensitive)
  const grouped = {};
  records.forEach(r => {
    const key = r.product_name.toLowerCase();
    if (!grouped[key]) grouped[key] = { name: r.product_name, records: [] };
    grouped[key].records.push(r);
  });

  // Filter by search
  const q = pricesSearch.toLowerCase();
  const products = Object.values(grouped)
    .filter(p => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state mt-4">
        <i class="bi bi-tags" style="font-size:3rem;"></i>
        <p class="fw-semibold mt-2">${t('prices_empty')}</p>
        <p class="text-muted small">${t('prices_empty_sub')}</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(p => _productCard(p)).join('');
}

function _productCard(product) {
  const recs    = product.records.sort((a, b) => b.date.localeCompare(a.date));
  const best    = [...recs].sort((a, b) => a.price - b.price)[0];
  const isOpen  = expandedProduct === product.name.toLowerCase();
  const unit    = best.unit ? ` / ${escHtml(best.unit)}` : '';

  return `
    <div class="card mb-2 price-product-card">
      <div class="card-body py-2 px-3">
        <div class="d-flex align-items-center justify-content-between gap-2"
             onclick="toggleProductExpand('${escHtml(product.name).replace(/'/g, "\\'")}')">
          <div class="flex-grow-1" style="cursor:pointer;">
            <div class="fw-semibold">${escHtml(product.name)}</div>
            <small class="text-muted">${recs.length} ${t('prices_records')}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold text-success">${fmt(best.price)}${unit}</div>
            <small class="text-muted">${t('prices_at')} ${escHtml(best.store_name)}</small>
          </div>
          <i class="bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted ms-1"></i>
        </div>
        ${isOpen ? _productHistory(recs) : ''}
      </div>
    </div>`;
}

function _productHistory(recs) {
  const byStore = {};
  recs.forEach(r => {
    if (!byStore[r.store_id]) byStore[r.store_id] = { name: r.store_name, records: [] };
    byStore[r.store_id].records.push(r);
  });
  const minPrice = Math.min(...recs.map(r => r.price));

  return `
    <div class="mt-2 pt-2 border-top">
      <table class="table table-sm mb-0">
        <thead><tr>
          <th>${t('label_store')}</th>
          <th>${t('label_price')}</th>
          <th>${t('col_date')}</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${recs.map(r => {
            const unit = r.unit ? ` / ${escHtml(r.unit)}` : '';
            const isBest = r.price === minPrice;
            return `<tr class="${isBest ? 'table-success' : ''}">
              <td>${escHtml(r.store_name)}${isBest ? ' <i class="bi bi-star-fill text-warning small"></i>' : ''}</td>
              <td class="fw-semibold">${fmt(r.price)}${unit}</td>
              <td class="text-muted small">${fmtDate(r.date)}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1 me-1" onclick="openEditPriceModal('${r.id}');event.stopPropagation()">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="confirmDeletePrice('${r.id}');event.stopPropagation()">
                  <i class="bi bi-trash3"></i>
                </button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function toggleProductExpand(name) {
  expandedProduct = expandedProduct === name.toLowerCase() ? null : name.toLowerCase();
  _renderByProduct();
}

// ─── "Par magasin" tab ────────────────────────────────────────
function _renderByStore() {
  const container = document.getElementById('prices-content');
  const stores    = db.stores;

  if (stores.length === 0) {
    container.innerHTML = `
      <div class="empty-state mt-4">
        <i class="bi bi-shop" style="font-size:3rem;"></i>
        <p class="fw-semibold mt-2">${t('stores_empty')}</p>
        <p class="text-muted small">${t('stores_empty_sub')}</p>
      </div>`;
    return;
  }

  container.innerHTML = stores.map(store => {
    const recs   = db.priceRecords.filter(r => r.store_id === store.id);
    const q      = pricesSearch.toLowerCase();
    const filtered = q ? recs.filter(r => r.product_name.toLowerCase().includes(q)) : recs;
    return _storeCard(store, filtered);
  }).join('');
}

function _storeCard(store, recs) {
  return `
    <div class="card mb-3">
      <div class="card-header d-flex align-items-center justify-content-between">
        <span class="fw-semibold"><i class="bi bi-shop me-2"></i>${escHtml(store.name)}</span>
        <div class="d-flex gap-1">
          <span class="badge bg-secondary">${recs.length} prix</span>
          <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="openEditStoreModal('${store.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="confirmDeleteStore('${store.id}')">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
      ${recs.length > 0 ? `
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-hover mb-0">
              <thead><tr>
                <th>${t('label_product_name')}</th>
                <th>${t('label_price')}</th>
                <th>${t('col_date')}</th>
                <th></th>
              </tr></thead>
              <tbody>
                ${recs.sort((a, b) => a.product_name.localeCompare(b.product_name)).map(r => {
                  const unit = r.unit ? ` / ${escHtml(r.unit)}` : '';
                  return `<tr>
                    <td class="fw-semibold">${escHtml(r.product_name)}</td>
                    <td>${fmt(r.price)}${unit}</td>
                    <td class="text-muted small">${fmtDate(r.date)}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-secondary py-0 px-1 me-1" onclick="openEditPriceModal('${r.id}')">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="confirmDeletePrice('${r.id}')">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
    </div>`;
}

// ─── Search ───────────────────────────────────────────────────
function onPricesSearch(val) {
  pricesSearch    = val;
  expandedProduct = null;
  renderPrices();
}

// ─── Price Modal ──────────────────────────────────────────────
function openAddPriceModal() {
  editingPriceId = null;
  document.getElementById('priceModalTitle').textContent = t('modal_add_price');
  document.getElementById('pf-product').value = '';
  document.getElementById('pf-price').value   = '';
  document.getElementById('pf-unit').value    = '';
  document.getElementById('pf-date').value    = new Date().toISOString().slice(0, 10);
  _clearPriceErrors();
  _populateStoreSelect(null);
  bsPriceModal.show();
}

function openEditPriceModal(id) {
  const rec = db.priceRecords.find(r => r.id === id);
  if (!rec) return;
  editingPriceId = id;
  document.getElementById('priceModalTitle').textContent = t('modal_edit_price');
  document.getElementById('pf-product').value = rec.product_name;
  document.getElementById('pf-price').value   = rec.price;
  document.getElementById('pf-unit').value    = rec.unit || '';
  document.getElementById('pf-date').value    = rec.date;
  _clearPriceErrors();
  _populateStoreSelect(rec.store_id);
  bsPriceModal.show();
}

function _populateStoreSelect(selectedId) {
  const sel = document.getElementById('pf-store');
  sel.innerHTML = `<option value="">— ${t('label_store')} —</option>` +
    db.stores.map(s =>
      `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${escHtml(s.name)}</option>`
    ).join('');
}

function _clearPriceErrors() {
  ['product', 'store', 'price'].forEach(f => {
    const el = document.getElementById('pf-' + f);
    if (el) el.classList.remove('is-invalid');
  });
  ['product', 'store', 'price'].forEach(f => {
    const el = document.getElementById('pe-' + f);
    if (el) el.textContent = '';
  });
}

async function savePriceModal() {
  let valid = true;
  const product = document.getElementById('pf-product').value.trim();
  const storeId = document.getElementById('pf-store').value;
  const price   = parseFloat(document.getElementById('pf-price').value);

  if (!product) {
    document.getElementById('pf-product').classList.add('is-invalid');
    document.getElementById('pe-product').textContent = t('err_price_product');
    valid = false;
  }
  if (!storeId) {
    document.getElementById('pf-store').classList.add('is-invalid');
    document.getElementById('pe-store').textContent = t('err_price_store');
    valid = false;
  }
  if (!price || price <= 0) {
    document.getElementById('pf-price').classList.add('is-invalid');
    document.getElementById('pe-price').textContent = t('err_price_amount');
    valid = false;
  }
  if (!valid) return;

  const data = {
    product_name: product,
    store_id:     storeId,
    price,
    unit:  document.getElementById('pf-unit').value.trim(),
    date:  document.getElementById('pf-date').value,
  };

  try {
    if (editingPriceId) {
      await updatePriceRecord(editingPriceId, data);
      showToast(t('toast_price_updated'), 'success');
    } else {
      await addPriceRecord(data);
      showToast(t('toast_price_added'), 'success');
    }
    bsPriceModal.hide();
    expandedProduct = null;
    renderPrices();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function confirmDeletePrice(id) {
  confirmDelete(t('confirm_delete_price'), async () => {
    try {
      await deletePriceRecord(id);
      showToast(t('toast_price_deleted'), 'success');
      expandedProduct = null;
      renderPrices();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
}

// ─── Store Modal ──────────────────────────────────────────────
function openAddStoreModal() {
  editingStoreId = null;
  document.getElementById('storeModalTitle').textContent = t('modal_add_store');
  document.getElementById('sf-name').value = '';
  document.getElementById('se-name').textContent = '';
  document.getElementById('sf-name').classList.remove('is-invalid');
  bsStoreModal.show();
}

function openEditStoreModal(id) {
  const store = db.stores.find(s => s.id === id);
  if (!store) return;
  editingStoreId = id;
  document.getElementById('storeModalTitle').textContent = t('modal_edit_store');
  document.getElementById('sf-name').value = store.name;
  document.getElementById('se-name').textContent = '';
  document.getElementById('sf-name').classList.remove('is-invalid');
  bsStoreModal.show();
}

async function saveStoreModal() {
  const name = document.getElementById('sf-name').value.trim();
  if (!name) {
    document.getElementById('sf-name').classList.add('is-invalid');
    document.getElementById('se-name').textContent = t('err_store_name');
    return;
  }
  try {
    if (editingStoreId) {
      await updateStore(editingStoreId, { name });
      showToast(t('toast_store_updated'), 'success');
    } else {
      await addStore({ name });
      showToast(t('toast_store_added'), 'success');
    }
    bsStoreModal.hide();
    renderPrices();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function confirmDeleteStore(id) {
  confirmDelete(t('confirm_delete_store'), async () => {
    try {
      await deleteStore(id);
      showToast(t('toast_store_deleted'), 'success');
      renderPrices();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
}
