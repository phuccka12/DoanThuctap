import { useState, useEffect, useRef } from 'react';
import {
  FiShoppingBag, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiFilter, FiImage, FiToggleLeft, FiToggleRight, FiX, FiSave, FiAlertTriangle,
} from 'react-icons/fi';
import { GiCrystalBall } from 'react-icons/gi';
import {
  getShopItems, createShopItem, updateShopItem, deleteShopItem,
} from '../../services/adminService';

/* ─────────────────────────── helpers ─────────────────────────── */
const CATEGORIES = [
  { value: 'food',     label: '🍖 Thức ăn',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'skin',     label: '🎨 Skin',       color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'function', label: '⚡ Chức năng',  color: 'bg-blue-500/20   text-blue-400   border-blue-500/30'   },
];
const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

function CategoryBadge({ value }) {
  const c = catMap[value] || { label: value, color: 'bg-gray-700 text-gray-300' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.color}`}>{c.label}</span>
  );
}

function Toggle({ active, onChange }) {
  return (
    <button onClick={onChange} className={`text-xl transition-colors ${active ? 'text-green-400' : 'text-gray-600'}`}>
      {active ? <FiToggleRight /> : <FiToggleLeft />}
    </button>
  );
}

const EMPTY_FORM = {
  name: '', description: '', category: 'food', price: 10,
  effects: '{}', is_active: true, sort_order: 0,
};

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminShop() {
  const [items, setItems]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [catFilter, setCatFilter]   = useState('');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modal, setModal]           = useState(false);   // open/close
  const [editing, setEditing]       = useState(null);    // item being edited
  const [form, setForm]             = useState(EMPTY_FORM);
  const [imgFile, setImgFile]       = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const [deleteId, setDeleteId]     = useState(null);    // confirm delete modal
  const [fetchError, setFetchError] = useState('');
  const fileRef                     = useRef();
  const LIMIT = 12;

  /* ── fetch ── */
  const fetchItems = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, limit: LIMIT };
      if (catFilter) params.category = catFilter;
      if (search)    params.search   = search;
      const res = await getShopItems(params);
      setItems(res.data.data || res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setFetchError(e?.response?.data?.message || e?.message || 'Không thể kết nối server');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [page, catFilter, search]);

  /* ── open modal ── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImgFile(null);
    setImgPreview('');
    setError('');
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    let effectsStr = '{}';
    try { effectsStr = JSON.stringify(item.effects || {}, null, 2); } catch {}
    setForm({
      name: item.name, description: item.description || '',
      category: item.category, price: item.price,
      effects: effectsStr, is_active: item.is_active,
      sort_order: item.sort_order || 0,
    });
    setImgFile(null);
    setImgPreview(item.image_url || '');
    setError('');
    setModal(true);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Tên vật phẩm không được trống'); return; }
    let parsedEffects;
    try { parsedEffects = JSON.parse(form.effects); } catch { setError('Effects JSON không hợp lệ'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('category',    form.category);
      fd.append('price',       form.price);
      fd.append('effects',     JSON.stringify(parsedEffects));
      fd.append('is_active',   form.is_active);
      fd.append('sort_order',  form.sort_order);
      if (imgFile) fd.append('image', imgFile);

      if (editing) {
        await updateShopItem(editing._id, fd);
      } else {
        await createShopItem(fd);
      }
      setModal(false);
      setPage(1);
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || 'Lỗi lưu vật phẩm');
    }
    setSaving(false);
  };

  /* ── quick toggle active ── */
  const toggleActive = async (item) => {
    const fd = new FormData();
    fd.append('is_active', !item.is_active);
    await updateShopItem(item._id, fd);
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, is_active: !i.is_active } : i));
  };

  /* ── delete ── */
  const confirmDelete = async () => {
    await deleteShopItem(deleteId);
    setDeleteId(null);
    fetchItems();
  };

  /* ── image ── */
  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const totalPages = Math.ceil(total / LIMIT);

  /* ─────────────────── render ─────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-br from-orange-500 to-pink-600">
            <FiShoppingBag className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Cửa hàng</h1>
            <p className="text-gray-400 text-sm">Vật phẩm cho thú cưng — {total} item</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity">
          <FiPlus /> Thêm vật phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 flex-1 min-w-48">
          <FiSearch className="text-gray-500" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Tìm tên vật phẩm…" className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600" />
        </div>
        {/* Category filter */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
          <FiFilter className="text-gray-500" />
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-white text-sm outline-none">
            <option value="">Tất cả loại</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <FiAlertTriangle className="shrink-0 text-lg" />
          <span><strong>Lỗi tải dữ liệu:</strong> {fetchError}</span>
          <button onClick={fetchItems} className="ml-auto text-xs underline hover:no-underline">Thử lại</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-gray-600">
          <FiShoppingBag className="text-5xl mb-3" />
          <p>Chưa có vật phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {items.map(item => (
            <div key={item._id}
              className={`bg-gray-900 border rounded-2xl p-3 flex flex-col gap-2 transition-all hover:border-gray-600 ${item.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50'}`}>
              {/* Image */}
              <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                  : <FiImage className="text-gray-600 text-2xl" />}
              </div>
              {/* Info */}
              <p className="text-white text-sm font-semibold line-clamp-1">{item.name}</p>
              <CategoryBadge value={item.category} />
              <p className="text-yellow-400 text-sm font-bold">🪙 {item.price}</p>
              {/* Actions */}
              <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-800">
                <Toggle active={item.is_active} onChange={() => toggleActive(item)} />
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-blue-400 hover:text-blue-300 text-sm transition-colors"><FiEdit2 /></button>
                  <button onClick={() => setDeleteId(item._id)} className="text-red-400 hover:text-red-300 text-sm transition-colors"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all
                ${page === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Modal ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-bold text-lg">{editing ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white transition-colors"><FiX /></button>
            </div>
            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-400 text-sm">
                  <FiAlertTriangle /> {error}
                </div>
              )}

              {/* Image upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-500 transition-colors">
                  {imgPreview
                    ? <img src={imgPreview} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    : <FiImage className="text-gray-500 text-3xl" />}
                </div>
                <p className="text-gray-500 text-xs">Click để chọn ảnh pixel art (128×128)</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
              </div>

              {/* Name */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Tên vật phẩm *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500 transition-colors" />
              </div>

              {/* Description */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500 resize-none transition-colors" />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Loại</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Giá (Coins)</label>
                  <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500 transition-colors" />
                </div>
              </div>

              {/* Effects JSON */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Effects <span className="text-gray-600">(JSON)</span>
                </label>
                <p className="text-gray-600 text-xs mb-2">
                  VD: {`{"hunger_restore":30}`} | {`{"freeze_streak":true}`} | {`{"growth_points":50}`} | {`{"exp_bonus_pct":10}`}
                </p>
                <textarea value={form.effects} onChange={e => setForm(f => ({ ...f, effects: e.target.value }))} rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-orange-500 resize-none transition-colors" />
              </div>

              {/* Sort order + active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Thứ tự hiển thị</label>
                  <input type="number" min={0} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="text-gray-400 text-sm mb-2 block">Trạng thái</label>
                  <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all
                      ${form.is_active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    {form.is_active ? <FiToggleRight /> : <FiToggleLeft />}
                    {form.is_active ? 'Đang bán' : 'Ẩn'}
                  </button>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                <FiSave /> {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <FiTrash2 className="text-red-400 text-2xl" />
            </div>
            <p className="text-white font-semibold">Xác nhận ẩn vật phẩm?</p>
            <p className="text-gray-500 text-sm">Vật phẩm sẽ bị ẩn khỏi cửa hàng (soft delete).</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white bg-gray-800 text-sm transition-colors">Hủy</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
