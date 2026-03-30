import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import { useProject } from '../context/ProjectContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const workTypeConfig = {
  development: { label: '开发', color: 'bg-blue-100 text-blue-700' },
  meeting: { label: '会议', color: 'bg-purple-100 text-purple-700' },
  review: { label: '评审', color: 'bg-orange-100 text-orange-700' },
  testing: { label: '测试', color: 'bg-green-100 text-green-700' },
  documentation: { label: '文档', color: 'bg-cyan-100 text-cyan-700' },
  other: { label: '其他', color: 'bg-slate-100 text-slate-700' },
};

const statusConfig = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
  submitted: { label: '已提交', color: 'bg-blue-50 text-blue-700' },
  approved: { label: '已审批', color: 'bg-green-50 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-50 text-red-700' },
};

export default function TimeLogsPage() {
  const { projectId, currentProject } = useProject();
  const { user } = useAuth();
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // 筛选条件
  const [filters, setFilters] = useState({
    startDate: getMonday(new Date()).toISOString().split('T')[0],
    endDate: getSunday(new Date()).toISOString().split('T')[0],
    userId: '',
  });

  // 填报表单
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    hours: 8,
    work_type: 'development',
    task_id: '',
    description: '',
  });

  // 周视图数据
  const [weekDays, setWeekDays] = useState([]);

  // 加载工时记录
  const loadTimeLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params = {
        projectId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (filters.userId) params.userId = filters.userId;

      const { data } = await api.get('/api/time-logs', { params });
      setTimeLogs(data);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    loadTimeLogs();
  }, [loadTimeLogs]);

  // 计算周视图
  useEffect(() => {
    const start = new Date(filters.startDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = timeLogs.filter((t) => t.work_date === dateStr);
      const dayHours = dayLogs.reduce((sum, t) => sum + t.hours, 0);
      days.push({
        date: dateStr,
        dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        logs: dayLogs,
        totalHours: dayHours,
      });
    }
    setWeekDays(days);
  }, [timeLogs, filters.startDate]);

  // 填报工时
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/time-logs', {
        project_id: projectId,
        ...formData,
        task_id: formData.task_id || null,
      });
      setShowForm(false);
      setFormData({
        work_date: new Date().toISOString().split('T')[0],
        hours: 8,
        work_type: 'development',
        task_id: '',
        description: '',
      });
      loadTimeLogs();
    } catch (err) {
      setMsg(err.message);
    }
  };

  // 删除记录
  const handleDelete = async (id) => {
    if (!window.confirm('确认删除此工时记录？')) return;
    try {
      await api.delete(`/api/time-logs/${id}`);
      loadTimeLogs();
    } catch (err) {
      setMsg(err.message);
    }
  };

  // 统计
  const stats = {
    totalHours: timeLogs.reduce((sum, t) => sum + t.hours, 0),
    totalDays: new Set(timeLogs.map((t) => t.work_date)).size,
    avgHours: timeLogs.length > 0 ? (timeLogs.reduce((sum, t) => sum + t.hours, 0) / timeLogs.length).toFixed(1) : 0,
    byType: Object.entries(workTypeConfig).map(([key, { label }]) => ({
      type: key,
      label,
      hours: timeLogs.filter((t) => t.work_type === key).reduce((sum, t) => sum + t.hours, 0),
    })),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">工时填报</h1>
          <p className="mt-1 text-sm text-slate-600">
            {currentProject?.name || '请选择项目'} · {filters.startDate} ~ {filters.endDate}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + 填报工时
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {msg}
        </div>
      )}

      {!projectId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          请先选择项目
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="本周总工时" value={`${stats.totalHours}h`} color="brand" />
            <StatCard label="工作天数" value={stats.totalDays} />
            <StatCard label="日均工时" value={`${stats.avgHours}h`} />
            <StatCard label="记录数" value={timeLogs.length} />
          </div>

          {/* 工时分布 */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700">工时分布</h3>
            <div className="mt-3 flex gap-2">
              {stats.byType.map((item) => (
                <div
                  key={item.type}
                  className={`flex-1 rounded-lg px-3 py-2 text-center ${
                    item.hours > 0 ? workTypeConfig[item.type].color : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-lg font-semibold">{item.hours}h</div>
                  <div className="text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span className="text-sm font-medium text-slate-700">日期范围：</span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setFilters((f) => ({
                  ...f,
                  startDate: getMonday(today).toISOString().split('T')[0],
                  endDate: getSunday(today).toISOString().split('T')[0],
                }));
              }}
              className="text-sm text-brand-600 hover:underline"
            >
              本周
            </button>
          </div>

          {/* 周视图 */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="grid grid-cols-7 divide-x divide-slate-200">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`p-2 ${day.isWeekend ? 'bg-slate-50' : ''} ${day.isToday ? 'ring-2 ring-brand-500 ring-inset' : ''}`}
                >
                  <div className="text-center">
                    <div className={`text-xs ${day.isToday ? 'font-semibold text-brand-600' : 'text-slate-500'}`}>
                      周{day.dayName}
                    </div>
                    <div className={`text-sm font-medium ${day.isToday ? 'text-brand-700' : 'text-slate-900'}`}>
                      {day.date.slice(5)}
                    </div>
                    <div className={`mt-1 text-xs font-semibold ${day.totalHours > 8 ? 'text-red-600' : 'text-slate-600'}`}>
                      {day.totalHours}h
                    </div>
                  </div>

                  {/* 工时记录 */}
                  <div className="mt-2 space-y-1">
                    {day.logs.map((log) => (
                      <div
                        key={log.id}
                        className={`rounded px-1.5 py-1 text-xs ${workTypeConfig[log.work_type]?.color || 'bg-slate-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.hours}h</span>
                          {log.status === 'approved' && <span className="text-green-600">✓</span>}
                        </div>
                        {log.description && (
                          <div className="mt-0.5 line-clamp-1 text-xs opacity-75">{log.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 详细列表 */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <span className="text-sm font-semibold text-slate-700">工时明细</span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">加载中...</div>
              ) : timeLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">暂无工时记录</div>
              ) : (
                timeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded px-2 py-0.5 text-xs font-medium ${workTypeConfig[log.work_type]?.color}`}>
                        {workTypeConfig[log.work_type]?.label}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{log.work_date}</div>
                        <div className="text-xs text-slate-500">{log.description || '无备注'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900">{log.hours}h</div>
                        <div className={`text-xs ${statusConfig[log.status]?.color}`}>{statusConfig[log.status]?.label}</div>
                      </div>
                      {log.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 填报弹窗 */}
      {showForm && (
        <TimeLogForm
          projectId={projectId}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          msg={msg}
          setMsg={setMsg}
        />
      )}
    </div>
  );
}

// 统计卡片
function StatCard({ label, value, color = 'slate' }) {
  const colorMap = {
    brand: 'text-brand-600',
    slate: 'text-slate-700',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      <div className={`text-2xl font-semibold ${colorMap[color]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

// 填报表单
function TimeLogForm({ projectId, formData, setFormData, onSubmit, onClose, msg, setMsg }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (projectId) {
      api.get('/api/tasks', { params: { projectId } }).then((res) => setTasks(res.data));
    }
  }, [projectId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">填报工时</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">日期 *</label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={formData.work_date}
                onChange={(e) => setFormData((f) => ({ ...f, work_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">工时 *</label>
              <input
                type="number"
                required
                min="0.5"
                max="24"
                step="0.5"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={formData.hours}
                onChange={(e) => setFormData((f) => ({ ...f, hours: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">工作类型</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={formData.work_type}
                onChange={(e) => setFormData((f) => ({ ...f, work_type: e.target.value }))}
              >
                {Object.entries(workTypeConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">关联任务</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={formData.task_id}
                onChange={(e) => setFormData((f) => ({ ...f, task_id: e.target.value }))}
              >
                <option value="">不关联</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">备注说明</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="简要描述工作内容..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 辅助函数
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getSunday(date) {
  const monday = getMonday(date);
  return new Date(monday.setDate(monday.getDate() + 6));
}
