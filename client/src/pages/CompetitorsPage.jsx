import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useProject } from '../context/ProjectContext.jsx';

const threatLabel = { low: '低', medium: '中', high: '高' };

export default function CompetitorsPage() {
  const { projectId } = useProject();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    model_or_line: '',
    price_position: '',
    threat_level: 'medium',
    key_features: '',
    gap_analysis: '',
  });
  const [msg, setMsg] = useState('');
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);

  async function load() {
    if (!projectId) return;
    const { data } = await api.get('/api/competitors', { params: { projectId } });
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
      await api.post('/api/competitors', {
        project_id: projectId,
        name: form.name,
        model_or_line: form.model_or_line || null,
        price_position: form.price_position || null,
        threat_level: form.threat_level,
        key_features: form.key_features || null,
        gap_analysis: form.gap_analysis || null,
      });
      setForm({
        name: '',
        model_or_line: '',
        price_position: '',
        threat_level: 'medium',
        key_features: '',
        gap_analysis: '',
      });
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function tryRag(e) {
    e.preventDefault();
    setRagResult(null);
    try {
      const { data } = await api.post('/api/integrations/rag/query', {
        query: ragQuery,
        topK: 5,
      });
      setRagResult(data);
    } catch (err) {
      setRagResult({ ok: false, message: err.message });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">竞品分析</h1>
        <p className="mt-1 text-sm text-slate-600">
          对标机型、价格带与能力差距；可与 RAG 知识库联动（接口已预留）。
        </p>
      </div>

      {!projectId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          请先选择项目。
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">知识检索占位（科大讯飞 RAG）</h2>
            <p className="mt-1 text-xs text-slate-500">
              在 server/.env 配置 IFLYTEK_RAG_* 后，于 server/src/services/ragClient.js 实现真实请求。
            </p>
            <form onSubmit={tryRag} className="mt-3 flex flex-wrap gap-2">
              <input
                className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="输入竞品或技术问题…"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                试检索
              </button>
            </form>
            {ragResult && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(ragResult, null, 2)}
              </pre>
            )}
          </div>

          <div className="grid gap-3">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                暂无竞品档案
              </div>
            ) : (
              items.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900">
                      {c.name}
                      {c.model_or_line && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          {c.model_or_line}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      威胁 {threatLabel[c.threat_level] || c.threat_level}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase text-slate-400">价格带</dt>
                      <dd>{c.price_position || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400">关键特性</dt>
                      <dd>{c.key_features || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase text-slate-400">差距分析</dt>
                      <dd className="leading-relaxed">{c.gap_analysis || '—'}</dd>
                    </div>
                  </dl>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-slate-900">新增竞品</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">名称</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">型号/系列</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.model_or_line}
                  onChange={(e) => setForm((f) => ({ ...f, model_or_line: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">价格定位</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.price_position}
                  onChange={(e) => setForm((f) => ({ ...f, price_position: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">威胁等级</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.threat_level}
                  onChange={(e) => setForm((f) => ({ ...f, threat_level: e.target.value }))}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">关键特性</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  value={form.key_features}
                  onChange={(e) => setForm((f) => ({ ...f, key_features: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">差距分析</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  value={form.gap_analysis}
                  onChange={(e) => setForm((f) => ({ ...f, gap_analysis: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                保存
              </button>
              {msg && <span className="ml-3 text-sm text-red-600">{msg}</span>}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
