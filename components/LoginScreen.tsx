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
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called');
    console.log('Username:', username);
    console.log('Password:', password);
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        // 调用注册接口
        console.log('Calling register API');
        const response = await realApi.register(username, password);
        console.log('Register successful:', response);
        setError('注册成功，请登录');
        setIsRegistering(false);
      } else {
        // 调用登录接口
        console.log('Calling login API');
        // 直接使用fetch发送登录请求，看看是否能够成功
        const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        console.log('Login response status:', loginResponse.status);
        console.log('Login response headers:', loginResponse.headers);
        const loginData = await loginResponse.text();
        console.log('Login response data:', loginData);
        
        if (loginResponse.ok) {
          // 登录成功
          const loginJson = JSON.parse(loginData);
          const token = loginJson.token;
          console.log('Login successful, token:', token);
          localStorage.setItem('token', token);
          onLoginSuccess();
        } else {
          // 登录失败
          throw new Error(loginData);
        }
      }
    } catch (err) {
      // 登录或注册失败
      console.error('Operation failed:', err);
      setError(isRegistering ? '注册失败。请尝试其他用户名。' : '登录失败。请检查你的用户名或密码。');
    } finally {
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
              {isLoading ? (isRegistering ? '注册中...' : '登录中...') : (isRegistering ? '注册' : '登 录')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-400 hover:text-blue-300"
              disabled={isLoading}
            >
              {isRegistering ? '已有账号？点击登录' : '没有账号？点击注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


