import React, { useState } from 'react';
// 1. 修复导入路径：从 'apiService' (模拟API) 改为 'api' (真实API)
import * as realApi from '../services/api';

// 2. 定义一个 Props 类型, 这样 App.tsx 才能在登录成功时得到通知
interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 3. 调用我们 Spring Boot 后端的 /api/auth/login 接口!
      await realApi.login(username, password);
      
      // 4. 登录成功！调用 onLoginSuccess prop
      onLoginSuccess();

    } catch (err) {
      // 5. 登录失败 (密码错误或用户不存在)
      console.error(err);
      setError('登录失败。请检查你的用户名或密码。');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">
          AI 猪舍监控系统
        </h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label 
              htmlFor="username" 
              className="text-sm font-medium text-slate-300"
            >
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="testuser"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label 
              htmlFor="password" 
              className="text-sm font-medium text-slate-300"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


