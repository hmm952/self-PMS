import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';

export default function KpiPage() {
  const { user } = useAuth();
  const { projectId } = useProject();
  const [items, setItems] = useState([]);
  const now = new Date();
  const [form, setForm] = useState({
    metric_name: '',
    metric_unit: '',
    period_year: now.getFullYear(),
    period_month: now.getMonth() + 1,
    target_value: '',
    actual_value: '',
    score: '',
  });
  const [msg, setMsg] = useState('');

  async function load() {
    if (!projectId) return;
    const { data } = await api.get('/api/kpi', { params: { projectId } });
    setItems(data);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    if (!projectId) return;
    try {
      await api.post('/api/kpi', {
        project_id: projectId,
        user_id: user?.id,
        metric_name: form.metric_name,
        metric_unit: form.metric_unit || null,
        period_year: Number(form.period_year),
        period_month: Number(form.period_month),
        target_value: form.target_value === '' ? null : Number(form.target_value),
        actual_value: form.actual_value === '' ? null : Number(form.actual_value),
        score: form.score === '' ? null : Number(form.score),
      });
      setForm((f) => ({
        ...f,
        metric_name: '',
        metric_unit: '',
        target_value: '',
        actual_value: '',
        score: '',
      }));
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">人力与 KPI</h1>
        <p className="mt-1 text-sm text-slate-600">
          按项目维度记录指标达成（可扩展与考勤/工时系统集成）。
        </p>
      </div>

      {!projectId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          请先选择项目。
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">指标</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">人员</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">周期</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">目标/实际</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">得分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      暂无 KPI 记录
                    </td>
                  </tr>
                ) : (
                  items.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {k.metric_name}
                        {k.metric_unit ? (
                          <span className="text-xs font-normal text-slate-500"> ({k.metric_unit})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {k.full_name || k.username || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {k.period_year}-{String(k.period_month).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {k.target_value ?? '—'} / {k.actual_value ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{k.score ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-slate-900">为本项目添加 KPI 记录（关联当前登录用户）</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <label className="text-xs text-slate-500">指标名称</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.metric_name}
                  onChange={(e) => setForm((f) => ({ ...f, metric_name: e.target.value }))}
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-slate-500">单位</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="%"
                  value={form.metric_unit}
                  onChange={(e) => setForm((f) => ({ ...f, metric_unit: e.target.value }))}
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-500">年</label>
                <input
                  type="number"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.period_year}
                  onChange={(e) => setForm((f) => ({ ...f, period_year: e.target.value }))}
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-slate-500">月</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.period_month}
                  onChange={(e) => setForm((f) => ({ ...f, period_month: e.target.value }))}
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-500">目标</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.target_value}
                  onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-500">实际</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.actual_value}
                  onChange={(e) => setForm((f) => ({ ...f, actual_value: e.target.value }))}
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-500">得分</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                保存
              </button>
            </div>
            {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          </form>
        </>
      )}
    </div>
  );
}
