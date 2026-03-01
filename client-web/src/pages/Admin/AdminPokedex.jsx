import { useState, useEffect, useRef } from 'react';
import {
  FiBook, FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiSave,
  FiAlertTriangle, FiChevronDown, FiChevronUp, FiZap,
} from 'react-icons/fi';
import { GiDragonSpiral } from 'react-icons/gi';
import {
  getPokedex, createSpecies, updateSpecies, addEvolution, deleteSpecies,
} from '../../services/adminService';

/* ─────────────────────────── helpers ─────────────────────────── */
const BUFF_TYPES = [
  { value: 'exp_bonus_pct',       label: 'EXP Bonus (%)' },
  { value: 'coin_bonus_pct',      label: 'Coin Bonus (%)' },
  { value: 'hunger_decay_reduce', label: 'Giảm đói (%)' },
];

const EMPTY_FORM = {
  species_key: '', name: '', description: '',
  is_active: true,
  evolutions: [],    // [{ level, label }]
  milestones: [],    // [{ level, required_exp }]
  buffs: [],         // [{ type, value, skill }]
};

const EMPTY_BUFF = { type: 'exp_bonus_pct', value: 10, skill: '' };
const EMPTY_MILESTONE = { level: 1, required_exp: 100 };

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminPokedex() {
  const [list, setList]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [expanded, setExpanded]     = useState(null); // species _id expanded

  /* ── Create / Edit modal ── */
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [imgFile, setImgFile]       = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  /* ── Evolution upload sub-modal ── */
  const [evoModal, setEvoModal]     = useState(false);
  const [evoSpecies, setEvoSpecies] = useState(null);
  const [evoForm, setEvoForm]       = useState({ level: 2, label: '' });
  const [evoFile, setEvoFile]       = useState(null);
  const [evoPreview, setEvoPreview] = useState('');
  const [evoSaving, setEvoSaving]   = useState(false);

  /* ── Delete ── */
  const [deleteId, setDeleteId]     = useState(null);

  const fileRef    = useRef();
  const evoFileRef = useRef();

  /* ── fetch ── */
  const fetchList = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getPokedex();
      // backend trả { success, data: [...] }
      const raw = res.data?.data ?? res.data?.species ?? res.data;
      setList(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setFetchError(e?.response?.data?.message || e?.message || 'Không thể kết nối server');
    }
    setLoading(false);
  };
  useEffect(() => { fetchList(); }, []);

  /* ── open create ── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImgFile(null);
    setImgPreview('');
    setError('');
    setModal(true);
  };

  /* ── open edit ── */
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      species_key: s.species_key,
      name: s.name,
      description: s.description || '',
      is_active: s.is_active,
      evolutions: (s.evolutions || []).map(e => ({ level: e.level, label: e.label || '' })),
      milestones: (s.milestones || []).map(m => ({ level: m.level, required_exp: m.required_exp })),
      buffs: (s.buffs || []).map(b => ({ type: b.type, value: b.value, skill: b.skill || '' })),
    });
    setImgFile(null);
    setImgPreview(s.base_image_url || '');
    setError('');
    setModal(true);
  };

  /* ── save species ── */
  const handleSave = async () => {
    if (!form.name.trim())        { setError('Tên loài không được trống'); return; }
    if (!form.species_key.trim()) { setError('species_key không được trống'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('species_key',  form.species_key.trim());
      fd.append('name',         form.name.trim());
      fd.append('description',  form.description.trim());
      fd.append('is_active',    form.is_active);
      fd.append('milestones',   JSON.stringify(form.milestones));
      fd.append('buffs',        JSON.stringify(form.buffs));
      if (imgFile) fd.append('image', imgFile);

      if (editing) {
        await updateSpecies(editing._id, fd);
      } else {
        await createSpecies(fd);
      }
      setModal(false);
      fetchList();
    } catch (e) {
      setError(e?.response?.data?.message || 'Lỗi lưu loài');
    }
    setSaving(false);
  };

  /* ── add evolution ── */
  const handleAddEvolution = async () => {
    if (!evoFile) { return; }
    setEvoSaving(true);
    try {
      const fd = new FormData();
      fd.append('level', evoForm.level);
      fd.append('label', evoForm.label);
      fd.append('image', evoFile);
      await addEvolution(evoSpecies._id, fd);
      setEvoModal(false);
      fetchList();
    } catch { /* ignore */ }
    setEvoSaving(false);
  };

  /* ── delete ── */
  const confirmDelete = async () => {
    await deleteSpecies(deleteId);
    setDeleteId(null);
    fetchList();
  };

  /* ── buff helpers ── */
  const addBuff = () => setForm(f => ({ ...f, buffs: [...f.buffs, { ...EMPTY_BUFF }] }));
  const updateBuff = (i, key, val) => setForm(f => {
    const b = [...f.buffs]; b[i] = { ...b[i], [key]: val }; return { ...f, buffs: b };
  });
  const removeBuff = (i) => setForm(f => ({ ...f, buffs: f.buffs.filter((_, idx) => idx !== i) }));

  /* ── milestone helpers ── */
  const addMilestone = () => setForm(f => ({ ...f, milestones: [...f.milestones, { ...EMPTY_MILESTONE }] }));
  const updateMilestone = (i, key, val) => setForm(f => {
    const m = [...f.milestones]; m[i] = { ...m[i], [key]: Number(val) }; return { ...f, milestones: m };
  });
  const removeMilestone = (i) => setForm(f => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }));

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600">
            <FiBook className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pet Pokédex</h1>
            <p className="text-gray-400 text-sm">Quản lý loài thú cưng, tiến hóa &amp; buff — {list.length} loài</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:opacity-90 transition-opacity">
          <FiPlus /> Thêm loài
        </button>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <FiAlertTriangle className="shrink-0 text-lg" />
          <span><strong>Lỗi tải dữ liệu:</strong> {fetchError}</span>
          <button onClick={fetchList} className="ml-auto text-xs underline hover:no-underline">Thử lại</button>
        </div>
      )}

      {/* Species list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-gray-600">
          <GiDragonSpiral className="text-5xl mb-3" />
          <p>Chưa có loài nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(s => {
            const open = expanded === s._id;
            return (
              <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all">
                {/* Row header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Base image */}
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {s.base_image_url
                      ? <img src={s.base_image_url} alt={s.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                      : <FiImage className="text-gray-600" />}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">{s.name}</p>
                      <code className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded-lg">{s.species_key}</code>
                      {!s.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Ẩn</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {s.evolutions?.length || 0} tiến hóa · {s.milestones?.length || 0} mốc · {s.buffs?.length || 0} buff
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setEvoSpecies(s); setEvoForm({ level: (s.evolutions?.length || 0) + 2, label: '' }); setEvoFile(null); setEvoPreview(''); setEvoModal(true); }}
                      title="Thêm tiến hóa" className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm">
                      <FiZap />
                    </button>
                    <button onClick={() => openEdit(s)} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => setDeleteId(s._id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm">
                      <FiTrash2 />
                    </button>
                    <button onClick={() => setExpanded(open ? null : s._id)}
                      className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors text-sm">
                      {open ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-gray-800 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Evolutions */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Tiến hóa</p>
                      {s.evolutions?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {s.evolutions.map((e, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 bg-gray-800 rounded-xl p-2">
                              <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden">
                                {e.image_url
                                  ? <img src={e.image_url} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                                  : <FiImage className="text-gray-600 text-xs m-auto mt-3" />}
                              </div>
                              <span className="text-gray-300 text-xs">Lv.{e.level}</span>
                              {e.label && <span className="text-gray-500 text-xs">{e.label}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-600 text-xs">Chưa có tiến hóa</p>}
                    </div>

                    {/* Milestones */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Mốc EXP</p>
                      {s.milestones?.length ? (
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-500"><th className="text-left py-0.5">Cấp</th><th className="text-right py-0.5">EXP cần</th></tr></thead>
                          <tbody>
                            {s.milestones.map((m, i) => (
                              <tr key={i} className="border-t border-gray-800/50">
                                <td className="text-white py-0.5">Lv.{m.level}</td>
                                <td className="text-yellow-400 text-right py-0.5">{m.required_exp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="text-gray-600 text-xs">Chưa có mốc</p>}
                    </div>

                    {/* Buffs */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Buffs</p>
                      {s.buffs?.length ? (
                        <div className="space-y-1">
                          {s.buffs.map((b, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5">
                              <span className="text-gray-300 text-xs">{BUFF_TYPES.find(t => t.value === b.type)?.label || b.type}</span>
                              <span className="text-green-400 text-xs font-bold">+{b.value}%</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-600 text-xs">Chưa có buff</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
              <h2 className="text-white font-bold text-lg">{editing ? 'Chỉnh sửa loài' : 'Thêm loài mới'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><FiX /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-400 text-sm">
                  <FiAlertTriangle /> {error}
                </div>
              )}

              {/* Image + base info */}
              <div className="flex gap-4">
                <div onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors shrink-0">
                  {imgPreview
                    ? <img src={imgPreview} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    : <FiImage className="text-gray-500 text-2xl" />}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files[0]; if (!f) return;
                  setImgFile(f); setImgPreview(URL.createObjectURL(f));
                }} />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">species_key *</label>
                      <input value={form.species_key}
                        onChange={e => setForm(f => ({ ...f, species_key: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                        placeholder="e.g. fluffy_cat"
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm font-mono outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Tên hiển thị *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Mô tả</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none resize-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-semibold">Mốc EXP (Level → EXP cần để lên cấp tiếp)</label>
                  <button onClick={addMilestone} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <FiPlus /> Thêm
                  </button>
                </div>
                {form.milestones.length === 0
                  ? <p className="text-gray-600 text-xs">Chưa có mốc. Hệ thống sẽ dùng công thức mặc định.</p>
                  : (
                    <div className="space-y-2">
                      {form.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-gray-500 text-xs w-8 shrink-0">Cấp</span>
                            <input type="number" min={1} value={m.level} onChange={e => updateMilestone(i, 'level', e.target.value)}
                              className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-white text-xs outline-none focus:border-emerald-500 transition-colors" />
                            <span className="text-gray-500 text-xs shrink-0">EXP cần</span>
                            <input type="number" min={1} value={m.required_exp} onChange={e => updateMilestone(i, 'required_exp', e.target.value)}
                              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-white text-xs outline-none focus:border-emerald-500 transition-colors" />
                          </div>
                          <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-300 text-sm"><FiX /></button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Buffs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-semibold">Buffs của loài</label>
                  <button onClick={addBuff} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    <FiPlus /> Thêm buff
                  </button>
                </div>
                {form.buffs.length === 0
                  ? <p className="text-gray-600 text-xs">Chưa có buff</p>
                  : (
                    <div className="space-y-2">
                      {form.buffs.map((b, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select value={b.type} onChange={e => updateBuff(i, 'type', e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-white text-xs outline-none focus:border-purple-500">
                            {BUFF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <input type="number" min={0} max={100} value={b.value} onChange={e => updateBuff(i, 'value', +e.target.value)}
                            className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-white text-xs outline-none focus:border-purple-500 transition-colors" />
                          <input value={b.skill} onChange={e => updateBuff(i, 'skill', e.target.value)}
                            placeholder="skill (tuỳ chọn)"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-white text-xs outline-none focus:border-purple-500 placeholder-gray-600 transition-colors" />
                          <button onClick={() => removeBuff(i)} className="text-red-400 hover:text-red-300 text-sm"><FiX /></button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Active toggle */}
              <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all w-fit
                  ${form.is_active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {form.is_active ? '✅ Đang hiển thị' : '🚫 Ẩn'}
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                <FiSave /> {saving ? 'Đang lưu…' : 'Lưu loài'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Evolution Modal ─── */}
      {evoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-bold">Thêm tiến hóa — {evoSpecies?.name}</h2>
              <button onClick={() => setEvoModal(false)} className="text-gray-500 hover:text-white"><FiX /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Evo image */}
              <div className="flex flex-col items-center gap-2">
                <div onClick={() => evoFileRef.current?.click()}
                  className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 transition-colors">
                  {evoPreview
                    ? <img src={evoPreview} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    : <FiImage className="text-gray-500 text-3xl" />}
                </div>
                <p className="text-gray-500 text-xs">Ảnh dạng tiến hóa (pixel art)</p>
                <input ref={evoFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files[0]; if (!f) return;
                  setEvoFile(f); setEvoPreview(URL.createObjectURL(f));
                }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Cấp tiến hóa</label>
                  <input type="number" min={2} value={evoForm.level} onChange={e => setEvoForm(f => ({ ...f, level: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Tên giai đoạn</label>
                  <input value={evoForm.label} onChange={e => setEvoForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="VD: Trưởng thành"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500 placeholder-gray-600 transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={() => setEvoModal(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors">Hủy</button>
              <button onClick={handleAddEvolution} disabled={evoSaving || !evoFile}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                <FiZap /> {evoSaving ? 'Đang upload…' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <FiTrash2 className="text-red-400 text-2xl" />
            </div>
            <p className="text-white font-semibold">Xóa loài thú cưng này?</p>
            <p className="text-gray-500 text-sm">Hành động không thể hoàn tác.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white bg-gray-800 text-sm transition-colors">Hủy</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
