import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import { useProject } from '../context/ProjectContext.jsx';

export default function WorkloadPage() {
  const { projectId, currentProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [workloadData, setWorkloadData] = useState({ members: [], summary: {} });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'

  // 筛选条件
  const [filters, setFilters] = useState({
    startDate: getMonday(new Date()).toISOString().split('T')[0],
    endDate: getSunday(new Date()).toISOString().split('T')[0],
  });

  // 加载负载数据
  const loadWorkload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/api/time-logs/workload', {
        params: { projectId, ...filters },
      });
      setWorkloadData(data);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    loadWorkload();
  }, [loadWorkload]);

  // 负载状态颜色
  const getLoadColor = (rate) => {
    if (rate > 100) return 'bg-red-500';
    if (rate > 80) return 'bg-orange-500';
    if (rate > 60) return 'bg-yellow-500';
    if (rate > 40) return 'bg-green-500';
    return 'bg-slate-300';
  };

  const getLoadTextColor = (rate) => {
    if (rate > 100) return 'text-red-700';
    if (rate > 80) return 'text-orange-700';
    if (rate > 60) return 'text-yellow-700';
    return 'text-green-700';
  };

  const getLoadLabel = (status) => {
    switch (status) {
      case 'overload': return '超负荷';
      case 'warning': return '预警';
      case 'normal': return '正常';
      default: return '正常';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">人力负载看板</h1>
          <p className="mt-1 text-sm text-slate-600">
            {currentProject?.name || '请选择项目'} · {filters.startDate} ~ {filters.endDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === 'table' ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            列表视图
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === 'chart' ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            图表视图
          </button>
        </div>
      </div>

      {!projectId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          请先选择项目
        </div>
      ) : (
        <>
          {/* 筛选栏 */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span className="text-sm font-medium text-slate-700">统计周期：</span>
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
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setFilters((f) => ({
                  ...f,
                  startDate: monthStart.toISOString().split('T')[0],
                  endDate: monthEnd.toISOString().split('T')[0],
                }));
              }}
              className="text-sm text-brand-600 hover:underline"
            >
              本月
            </button>
          </div>

          {/* 汇总卡片 */}
          <div className="grid grid-cols-5 gap-4">
            <SummaryCard
              label="参与人数"
              value={workloadData.summary.total_members || 0}
              suffix="人"
            />
            <SummaryCard
              label="总工时"
              value={workloadData.summary.total_hours || 0}
              suffix="h"
              color="brand"
            />
            <SummaryCard
              label="平均负载"
              value={workloadData.summary.avg_load_rate || 0}
              suffix="%"
              color={workloadData.summary.avg_load_rate > 80 ? 'red' : 'green'}
            />
            <SummaryCard
              label="超负荷预警"
              value={workloadData.summary.overload_count || 0}
              suffix="人"
              color="red"
              highlight
            />
            <SummaryCard
              label="空闲人员"
              value={workloadData.summary.idle_count || 0}
              suffix="人"
              color="yellow"
            />
          </div>

          {/* 列表视图 */}
          {viewMode === 'table' && (
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                <span className="text-sm font-semibold text-slate-700">人员负载明细</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">加载中...</div>
              ) : workloadData.members.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">暂无数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">成员</th>
                        <th className="px-4 py-3 text-left font-medium">部门</th>
                        <th className="px-4 py-3 text-center font-medium">任务分配</th>
                        <th className="px-4 py-3 text-center font-medium">工时填报</th>
                        <th className="px-4 py-3 text-center font-medium">负载率</th>
                        <th className="px-4 py-3 text-center font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workloadData.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                                {(member.full_name || member.username || '?').charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{member.full_name || member.username}</div>
                                <div className="text-xs text-slate-500">@{member.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{member.department_name || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{member.task_count || 0}</span>
                              <div className="flex gap-0.5">
                                {member.in_progress_count > 0 && (
                                  <span className="h-2 w-2 rounded-full bg-yellow-400" title="进行中" />
                                )}
                                {member.todo_count > 0 && (
                                  <span className="h-2 w-2 rounded-full bg-slate-300" title="待办" />
                                )}
                                {member.blocked_count > 0 && (
                                  <span className="h-2 w-2 rounded-full bg-red-400" title="阻塞" />
                                )}
                                {member.done_count > 0 && (
                                  <span className="h-2 w-2 rounded-full bg-green-400" title="已完成" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div>
                              <span className="font-medium text-slate-900">{member.total_hours || 0}h</span>
                              <span className="text-xs text-slate-500"> / {member.expected_hours}h</span>
                            </div>
                            <div className="text-xs text-slate-500">{member.work_days || 0}天</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full transition-all ${getLoadColor(member.load_rate)}`}
                                  style={{ width: `${Math.min(100, member.load_rate)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${getLoadTextColor(member.load_rate)}`}>
                                {member.load_rate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                member.load_status === 'overload'
                                  ? 'bg-red-100 text-red-700'
                                  : member.load_status === 'warning'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {getLoadLabel(member.load_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 图表视图 */}
          {viewMode === 'chart' && (
            <div className="grid grid-cols-2 gap-4">
              {/* 负载分布柱状图 */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">人员负载分布</h3>
                <div className="mt-4 space-y-3">
                  {workloadData.members.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-20 truncate text-sm text-slate-700">{member.full_name || member.username}</div>
                      <div className="flex-1">
                        <div className="h-6 overflow-hidden rounded bg-slate-100">
                          <div
                            className={`flex h-full items-center justify-end px-2 text-xs font-medium text-white transition-all ${getLoadColor(member.load_rate)}`}
                            style={{ width: `${Math.min(100, member.load_rate)}%` }}
                          >
                            {member.load_rate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 负载状态饼图（简化版） */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">负载状态分布</h3>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <div className="text-2xl font-semibold text-red-700">
                      {workloadData.summary.overload_count || 0}
                    </div>
                    <div className="mt-1 text-xs text-red-600">超负荷</div>
                    <div className="mt-1 text-xs text-red-500">&gt;80%</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="text-2xl font-semibold text-green-700">
                      {(workloadData.summary.total_members || 0) - (workloadData.summary.overload_count || 0) - (workloadData.summary.idle_count || 0)}
                    </div>
                    <div className="mt-1 text-xs text-green-600">正常</div>
                    <div className="mt-1 text-xs text-green-500">40-80%</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-4 text-center">
                    <div className="text-2xl font-semibold text-yellow-700">
                      {workloadData.summary.idle_count || 0}
                    </div>
                    <div className="mt-1 text-xs text-yellow-600">空闲</div>
                    <div className="mt-1 text-xs text-yellow-500">&lt;40%</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-700">预警人员</h4>
                  <div className="mt-2 space-y-2">
                    {workloadData.members
                      .filter((m) => m.is_overload)
                      .slice(0, 5)
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                          <span className="text-sm font-medium text-red-900">{member.full_name || member.username}</span>
                          <span className="text-sm font-semibold text-red-700">{member.load_rate}%</span>
                        </div>
                      ))}
                    {workloadData.members.filter((m) => m.is_overload).length === 0 && (
                      <div className="py-4 text-center text-sm text-slate-500">暂无超负荷人员</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 任务分配详情 */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <span className="text-sm font-semibold text-slate-700">任务分配情况</span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="py-4 text-center text-sm text-slate-500">加载中...</div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {workloadData.members.slice(0, 8).map((member) => (
                    <div key={member.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                          {(member.full_name || member.username || '?').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{member.full_name || member.username}</div>
                          <div className="text-xs text-slate-500">{member.task_count || 0} 个任务</div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {member.todo_count > 0 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            待办 {member.todo_count}
                          </span>
                        )}
                        {member.in_progress_count > 0 && (
                          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                            进行 {member.in_progress_count}
                          </span>
                        )}
                        {member.blocked_count > 0 && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                            阻塞 {member.blocked_count}
                          </span>
                        )}
                        {member.done_count > 0 && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                            完成 {member.done_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 汇总卡片
function SummaryCard({ label, value, suffix = '', color = 'slate', highlight = false }) {
  const colorMap = {
    brand: 'text-brand-600',
    slate: 'text-slate-700',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className={`rounded-lg border ${highlight ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'} p-4 text-center`}>
      <div className={`text-2xl font-semibold ${colorMap[color]}`}>
        {value}
        <span className="text-sm font-normal">{suffix}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
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
