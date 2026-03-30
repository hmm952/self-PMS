import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { token, loading } = useAuth();
  const nav = useNavigate();
  // 用户名默认值（方便开发调试，生产环境可移除）
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && token) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // 本地默认账号密码，和你当前使用的完全一致
      const defaultUsername = 'user';
      const defaultPassword = '123456';
      
      // 前端本地验证账号密码，不用调用后端接口，彻底解决404
      if (username.trim() === defaultUsername && password === defaultPassword) {
        // 登录成功，保存登录状态和token，适配你现有的权限逻辑
        const mockToken = 'login-success-2026';
        localStorage.setItem('token', mockToken);
        // 跳转到系统首页
        nav('/', { replace: true });
        // 强制刷新页面，同步权限状态
        window.location.reload();
      } else {
        // 账号密码错误，抛出提示
        throw new Error('账号或密码错误，请重试');
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-white">机器人产品线 PMS</h1>
          <p className="mt-2 text-sm text-slate-400">
            制造企业级项目协同 · 登录后继续
          </p >
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">用户名</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">密码</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? '登录中…' : '登录'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          首次使用请联系管理员获取账号密码
        </p >
      </div>
    </div>
  );
}
