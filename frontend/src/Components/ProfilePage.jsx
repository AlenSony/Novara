import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../assets/navbar.jsx';
import { useToast } from '../assets/Toast.jsx';
import '../Stylings/ProfilePage.css';

const BASE = 'http://localhost:5000';

/* ─── tiny helpers ──────────────────────────────────────────────────────── */
const api = (path, opts = {}) =>
  fetch(`${BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });

const EMPTY_DEVICE = {
  name: '', company: '', price: '', description: '',
  ram: '', storage: '', category: 'Smartphone', stock: '100', variant: '', image: ''
};

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Inline editable device row ─────────────────────────────────────────── */
function DeviceRow({ device, onSave, onDelete, onAddVariant }) {
  // mode: 'view' | 'edit' | 'addVariant'
  const [mode, setMode] = useState('view');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: device.name,
    company: device.company,
    description: device.description || '',
    ram: device.ram || '',
    storage: device.storage || '',
    expected_price: device.expected_price,
    category: device.category || 'Smartphone',
    stock: device.stock,
    image_url: device.image_url || '',
  });

  // Extract base name (strip the "(…)" part if present)
  const baseName = device.name.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // Variant form state — pre-populate from parent device
  const [varForm, setVarForm] = useState({
    variant: '',
    price: device.expected_price ? String(device.expected_price) : '',
    ram: device.ram || '',
    storage: device.storage || '',
    image: device.image_url || '',
  });

  const [saving, setSaving] = useState(false);

  const handleEditChange = (e) =>
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleVarChange = (e) =>
    setVarForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(device._id, {
      ...editForm,
      expected_price: parseFloat(editForm.expected_price),
      actual_price: parseFloat(editForm.expected_price),
      stock: parseInt(editForm.stock, 10),
    });
    setSaving(false);
    setMode('view');
  };

  const handleAddVariant = async () => {
    if (!varForm.variant.trim()) return;

    if (!baseName) {
      alert("Invalid base model name. Cannot add variant.");
      return;
    }

    if (!device.company) {
      alert("Parent device is missing a company. Cannot add variant.");
      return;
    }

    const parsedPrice = parseFloat(varForm.price);
    if (isNaN(parsedPrice)) {
      alert("Please enter a valid Price.");
      return;
    }

    setSaving(true);
    await onAddVariant({
      name: baseName,
      company: device.company || '',
      description: device.description || '',
      category: device.category || 'Smartphone',
      variant: varForm.variant.trim(),
      expected_price: parsedPrice,
      actual_price: parsedPrice,
      stock: parseInt(device.stock, 10) || 100,
      ram: varForm.ram,
      storage: varForm.storage,
      image_url: varForm.image,
    });
    setSaving(false);
    // Reset variant form for next use, keep base fields
    setVarForm({
      variant: '',
      price: device.expected_price ? String(device.expected_price) : '',
      ram: device.ram || '',
      storage: device.storage || '',
      image: device.image_url || '',
    });
    setMode('view');
  };

  /* ── View mode ────────────────────────────────────────────────────────── */
  if (mode === 'view') {
    return (
      <div className="admin-row">
        <div className="admin-row__img-wrap">
          {device.image_url
            ? <img src={device.image_url} alt={device.name} className="admin-row__img" />
            : <span className="admin-row__no-img">📱</span>}
        </div>
        <div className="admin-row__info">
          <span className="admin-row__name">{device.name}</span>
          <span className="admin-row__meta">{device.company} · {device.category}</span>
          <span className="admin-row__meta">
            ₹{Number(device.expected_price).toLocaleString('en-IN')}
            {device.ram && ` · ${device.ram} RAM`}
            {device.storage && ` · ${device.storage}`}
            {` · Stock: ${device.stock}`}
          </span>
        </div>
        <div className="admin-row__actions">
          <button className="row-btn row-btn--variant" onClick={() => setMode('addVariant')} title="Add a sibling variant of this product">
            + Variant
          </button>
          <button className="row-btn row-btn--edit" onClick={() => setMode('edit')}>Edit</button>
          <button className="row-btn row-btn--delete" onClick={() => onDelete(device._id)}>Delete</button>
        </div>
      </div>
    );
  }

  /* ── Edit mode ────────────────────────────────────────────────────────── */
  if (mode === 'edit') {
    return (
      <div className="admin-row admin-row--editing">
        <div className="edit-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={editForm.name} onChange={handleEditChange} />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input name="company" value={editForm.company} onChange={handleEditChange} />
            </div>
          </div>
          <div className="form-row form-row--3">
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="expected_price" value={editForm.expected_price} onChange={handleEditChange} />
            </div>
            <div className="form-group">
              <label>RAM</label>
              <input name="ram" value={editForm.ram} onChange={handleEditChange} placeholder="e.g. 8GB" />
            </div>
            <div className="form-group">
              <label>Storage</label>
              <input name="storage" value={editForm.storage} onChange={handleEditChange} placeholder="e.g. 256GB" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={editForm.category} onChange={handleEditChange} className="form-select">
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop</option>
                <option value="Foldable Smartphone">Foldable Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="Smartwatch">Smartwatch</option>
                <option value="Accessory">Accessory</option>
              </select>
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value={editForm.stock} onChange={handleEditChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={editForm.description} onChange={handleEditChange} rows="2" />
          </div>
          <div className="form-group">
            <label>Image URL / Path</label>
            <input name="image_url" value={editForm.image_url} onChange={handleEditChange} placeholder="/images/device.jpg" />
          </div>
          <div className="edit-form__actions">
            <button className="row-btn row-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="row-btn row-btn--cancel" onClick={() => setMode('view')}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Add Variant mode ─────────────────────────────────────────────────── */
  return (
    <div className="admin-row admin-row--editing admin-row--variant-mode">
      <div className="variant-form-header">
        <span className="variant-form-header__icon">🔀</span>
        <div>
          <span className="variant-form-header__title">Add a variant of</span>
          <strong className="variant-form-header__base">{baseName}</strong>
        </div>
      </div>

      <div className="edit-form">
        {/* Variant descriptor */}
        <div className="form-group">
          <label>
            Variant Descriptor <span className="field-hint">— what makes this variant unique</span>
          </label>
          <input
            name="variant"
            value={varForm.variant}
            onChange={handleVarChange}
            placeholder="e.g. 512GB, Natural Titanium"
            autoFocus
          />
          {varForm.variant.trim() && (
            <p className="variant-name-preview">
              <span className="preview-label">Will be stored as: </span>
              <strong>{baseName} ({varForm.variant.trim()})</strong>
            </p>
          )}
        </div>

        {/* Differing specs for this variant */}
        <div className="form-row form-row--3">
          <div className="form-group">
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              value={varForm.price}
              onChange={handleVarChange}
              step="0.01" min="0"
            />
          </div>
          <div className="form-group">
            <label>RAM</label>
            <input name="ram" value={varForm.ram} onChange={handleVarChange} placeholder="e.g. 8GB" />
          </div>
          <div className="form-group">
            <label>Storage</label>
            <input name="storage" value={varForm.storage} onChange={handleVarChange} placeholder="e.g. 512GB" />
          </div>
        </div>

        <div className="form-group">
          <label>Image URL / Path <span className="field-hint">(leave blank to reuse parent image)</span></label>
          <input name="image" value={varForm.image} onChange={handleVarChange} placeholder="/iphone/iphone-16-pro-titanium.jpg" />
        </div>

        <div className="edit-form__actions">
          <button className="row-btn row-btn--save" onClick={handleAddVariant} disabled={saving || !varForm.variant.trim()}>
            {saving ? 'Adding…' : 'Add Variant'}
          </button>
          <button className="row-btn row-btn--cancel" onClick={() => setMode('view')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin user row ─────────────────────────────────────────────────────── */
function AdminRow({ admin, currentUserId, onRevoke }) {
  const isSelf = String(admin._id) === String(currentUserId);
  return (
    <div className="admin-row">
      <div className="admin-row__avatar-sm">
        {admin.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="admin-row__info">
        <span className="admin-row__name">{admin.name}</span>
        <span className="admin-row__meta">{admin.email}</span>
      </div>
      <div className="admin-row__actions">
        {isSelf
          ? <span className="row-badge row-badge--self">You</span>
          : <button className="row-btn row-btn--delete" onClick={() => onRevoke(admin._id, admin.name)}>Revoke</button>
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main ProfilePage
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userRole, setUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  /* profile */
  const [userInfo, setUserInfo] = useState({ name: '', email: '', address: '', phone: '' });

  /* add-device form */
  const [deviceForm, setDeviceForm] = useState(EMPTY_DEVICE);
  const [showAddDevice, setShowAddDevice] = useState(false);

  /* add-admin form */
  const [adminForm, setAdminForm] = useState({ email: '' });
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  /* lists */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  /* search / filter */
  const [productSearch, setProductSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  /* ── Fetch user ─────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await api('/api/user');
        if (res.status === 401) { navigate('/login'); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUserRole(data.role || 'user');
        setCurrentUserId(data._id || data.id);
        setUserInfo({ name: data.name || '', email: data.email || '', address: data.address || '', phone: data.phone || '' });
      } catch {
        showToast('Failed to load profile.', 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate]);

  /* ── Fetch products when tab becomes active ─────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await api('/api/admin/products');
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      showToast('Could not load products.', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  /* ── Fetch admins when tab becomes active ───────────────────────────── */
  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await api('/api/admin/users');
      if (!res.ok) throw new Error();
      setAdmins(await res.json());
    } catch {
      showToast('Could not load admins.', 'error');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'devices' && userRole === 'admin') fetchProducts();
    if (activeTab === 'admins' && userRole === 'admin') fetchAdmins();
  }, [activeTab, userRole]);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleUserInfoChange = (e) =>
    setUserInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDeviceFormChange = (e) =>
    setDeviceForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdateUserInfo = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/user/profile', { method: 'PATCH', body: JSON.stringify(userInfo) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Update failed'); }
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: deviceForm.name, company: deviceForm.company, description: deviceForm.description,
        ram: deviceForm.ram, storage: deviceForm.storage,
        expected_price: parseFloat(deviceForm.price), actual_price: parseFloat(deviceForm.price),
        stock: parseInt(deviceForm.stock, 10) || 100,
        category: deviceForm.category, image_url: deviceForm.image,
        variant: deviceForm.variant.trim(),
      };
      const res = await api('/api/admin/product', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed to add device'); }
      setDeviceForm(EMPTY_DEVICE);
      setShowAddDevice(false);
      showToast('Device added!', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateDevice = async (id, data) => {
    try {
      const res = await api(`/api/admin/product/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Update failed'); }
      showToast('Device updated!', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const res = await api(`/api/admin/product/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Delete failed'); }
      showToast('Device deleted.', 'success');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Called by DeviceRow when admin clicks "Add Variant"
  const handleAddVariant = async (variantData) => {
    try {
      const body = {
        name: variantData.name,
        company: variantData.company,
        description: variantData.description,
        ram: variantData.ram,
        storage: variantData.storage,
        expected_price: variantData.expected_price,
        actual_price: variantData.actual_price,
        stock: variantData.stock,
        category: variantData.category,
        image_url: variantData.image_url,
        variant: variantData.variant,  // backend appends as "(variant)"
      };
      const res = await api('/api/admin/product', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed to add variant'); }
      const result = await res.json();
      showToast(`Variant "${result.product?.name}" added!`, 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/admin/set-admin', { method: 'PATCH', body: JSON.stringify(adminForm) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
      setAdminForm({ email: '' });
      setShowAddAdmin(false);
      showToast('Admin granted!', 'success');
      fetchAdmins();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeAdmin = async (id, name) => {
    if (!window.confirm(`Revoke admin access for ${name}?`)) return;
    try {
      const res = await api(`/api/admin/revoke-admin/${id}`, { method: 'PATCH' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
      showToast(`${name} demoted to user.`, 'success');
      setAdmins(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    await api('/api/logout', { method: 'POST' });
    navigate('/');
  };

  /* ── Derived ────────────────────────────────────────────────────────── */
  const avatarInitials = userInfo.name
    ? userInfo.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.company || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredAdmins = admins.filter(a =>
    (a.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(adminSearch.toLowerCase())
  );

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: '👤' },
    ...(userRole === 'admin' ? [
      { id: 'devices', label: 'Devices', icon: '📱' },
      { id: 'admins', label: 'Admins', icon: '🛡️' },
    ] : [])
  ];

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading__spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <NavBar />
      <div className="profile-layout">

        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <div className="sidebar-avatar">
            <span className="avatar-initials">{avatarInitials}</span>
            {userRole === 'admin' && <span className="avatar-badge">Admin</span>}
          </div>
          <div className="sidebar-user-info">
            <h2 className="sidebar-name">{userInfo.name || 'User'}</h2>
            <p className="sidebar-email">{userInfo.email}</p>
          </div>
          <nav className="sidebar-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-nav-item${activeTab === tab.id ? ' sidebar-nav-item--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
            <button className="sidebar-nav-item sidebar-nav-item--orders" onClick={() => navigate('/orders')}>
              <span className="nav-icon">📦</span>
              <span className="nav-label">My Orders</span>
            </button>
          </nav>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span>⏻</span> Logout
          </button>
        </aside>

        {/* ── Main Panel ── */}
        <main className="profile-main">

          {/* ── Tab: My Profile ── */}
          {activeTab === 'profile' && (
            <section className="profile-panel" key="profile">
              <div className="panel-header">
                <h1 className="panel-title">My Profile</h1>
                <p className="panel-subtitle">Manage your personal information</p>
              </div>
              <form onSubmit={handleUpdateUserInfo} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" name="name" value={userInfo.name} onChange={handleUserInfoChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={userInfo.email} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" value={userInfo.phone} onChange={handleUserInfoChange} placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input type="text" id="address" name="address" value={userInfo.address} onChange={handleUserInfoChange} placeholder="Your address" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn--primary">Save Changes</button>
                </div>
              </form>
            </section>
          )}

          {/* ── Tab: Device Management ── */}
          {activeTab === 'devices' && userRole === 'admin' && (
            <section className="profile-panel" key="devices">
              <div className="panel-header">
                <div className="panel-header__top">
                  <div>
                    <h1 className="panel-title">Device Management</h1>
                    <p className="panel-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} in catalogue</p>
                  </div>
                  <button className="btn btn--primary" onClick={() => setShowAddDevice(v => !v)}>
                    {showAddDevice ? '✕ Cancel' : '+ Add Device'}
                  </button>
                </div>
              </div>

              {/* ── Add device form (collapsible) ── */}
              {showAddDevice && (
                <div className="add-form-panel">
                  <h3 className="add-form-panel__title">New Device</h3>
                  <form onSubmit={handleAddDevice} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="device-name">Base Model Name</label>
                        <input type="text" id="device-name" name="name" value={deviceForm.name} onChange={handleDeviceFormChange} required placeholder="e.g. iPhone 16 Pro" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="device-company">Company</label>
                        <input type="text" id="device-company" name="company" value={deviceForm.company} onChange={handleDeviceFormChange} required placeholder="e.g. Apple" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="device-variant">
                        Variant <span className="field-hint">(optional — e.g. 256GB, Black)</span>
                      </label>
                      <input type="text" id="device-variant" name="variant" value={deviceForm.variant} onChange={handleDeviceFormChange} placeholder="e.g. 256GB, Black" />
                      {deviceForm.name && (
                        <p className="variant-name-preview">
                          <span className="preview-label">Stored as: </span>
                          <strong>
                            {deviceForm.variant.trim()
                              ? `${deviceForm.name.trim()} (${deviceForm.variant.trim()})`
                              : deviceForm.name.trim()}
                          </strong>
                        </p>
                      )}
                    </div>
                    <div className="form-row form-row--3">
                      <div className="form-group">
                        <label>Price (₹)</label>
                        <input type="number" name="price" value={deviceForm.price} onChange={handleDeviceFormChange} required step="0.01" min="0" placeholder="79999" />
                      </div>
                      <div className="form-group">
                        <label>RAM</label>
                        <input name="ram" value={deviceForm.ram} onChange={handleDeviceFormChange} placeholder="e.g. 8GB" />
                      </div>
                      <div className="form-group">
                        <label>Storage</label>
                        <input name="storage" value={deviceForm.storage} onChange={handleDeviceFormChange} placeholder="e.g. 256GB" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category</label>
                        <select name="category" value={deviceForm.category} onChange={handleDeviceFormChange} className="form-select">
                          <option value="Smartphone">Smartphone</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Foldable Smartphone">Foldable Smartphone</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Smartwatch">Smartwatch</option>
                          <option value="Accessory">Accessory</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Stock</label>
                        <input type="number" name="stock" value={deviceForm.stock} onChange={handleDeviceFormChange} min="0" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" value={deviceForm.description} onChange={handleDeviceFormChange} required rows="2" placeholder="Device description" />
                    </div>
                    <div className="form-group">
                      <label>Image URL / Path</label>
                      <input name="image" value={deviceForm.image} onChange={handleDeviceFormChange} placeholder="/iphone/iphone-16-pro.jpg" />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn--primary">Add Device</button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Search bar ── */}
              <div className="list-search">
                <span className="list-search__icon">🔍</span>
                <input
                  className="list-search__input"
                  placeholder="Search by name or company…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                {productSearch && <button className="list-search__clear" onClick={() => setProductSearch('')}>✕</button>}
              </div>

              {/* ── Product list ── */}
              {productsLoading ? (
                <div className="list-loading"><div className="profile-loading__spinner" /> Loading…</div>
              ) : filteredProducts.length === 0 ? (
                <div className="list-empty">
                  {productSearch ? `No products matching "${productSearch}"` : 'No products in catalogue yet.'}
                </div>
              ) : (
                <div className="admin-list">
                  {filteredProducts.map(p => (
                    <DeviceRow key={p._id} device={p} onSave={handleUpdateDevice} onDelete={handleDeleteDevice} onAddVariant={handleAddVariant} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Tab: Admin Management ── */}
          {activeTab === 'admins' && userRole === 'admin' && (
            <section className="profile-panel" key="admins">
              <div className="panel-header">
                <div className="panel-header__top">
                  <div>
                    <h1 className="panel-title">Admin Management</h1>
                    <p className="panel-subtitle">{admins.length} admin{admins.length !== 1 ? 's' : ''} currently active</p>
                  </div>
                  <button className="btn btn--primary" onClick={() => setShowAddAdmin(v => !v)}>
                    {showAddAdmin ? '✕ Cancel' : '+ Grant Admin'}
                  </button>
                </div>
              </div>

              {/* ── Grant admin form ── */}
              {showAddAdmin && (
                <div className="add-form-panel">
                  <h3 className="add-form-panel__title">Grant Admin Access</h3>
                  <form onSubmit={handleAddAdmin} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="admin-email">User Email</label>
                      <input type="email" id="admin-email" name="email" value={adminForm.email}
                        onChange={e => setAdminForm({ email: e.target.value })} required placeholder="user@example.com" />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn--primary">Grant Admin Access</button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Search bar ── */}
              <div className="list-search">
                <span className="list-search__icon">🔍</span>
                <input
                  className="list-search__input"
                  placeholder="Search by name or email…"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                />
                {adminSearch && <button className="list-search__clear" onClick={() => setAdminSearch('')}>✕</button>}
              </div>

              {/* ── Admin list ── */}
              {adminsLoading ? (
                <div className="list-loading"><div className="profile-loading__spinner" /> Loading…</div>
              ) : filteredAdmins.length === 0 ? (
                <div className="list-empty">
                  {adminSearch ? `No admins matching "${adminSearch}"` : 'No admins found.'}
                </div>
              ) : (
                <div className="admin-list">
                  {filteredAdmins.map(a => (
                    <AdminRow key={a._id} admin={a} currentUserId={currentUserId} onRevoke={handleRevokeAdmin} />
                  ))}
                </div>
              )}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default ProfilePage;