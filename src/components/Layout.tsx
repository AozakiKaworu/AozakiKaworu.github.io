import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  BookOpen, 
  BarChart3, 
  LogOut,
  User,
  Moon,
  Sun,
  Maximize,
  Minimize
} from 'lucide-react';
import { useAppStore } from '@/store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const darkMode = useAppStore(state => state.darkMode);
  const toggleDarkMode = useAppStore(state => state.toggleDarkMode);
  const focusMode = useAppStore(state => state.focusMode);
  const toggleFocusMode = useAppStore(state => state.toggleFocusMode);

  // 改进8：初始化暗色模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
    { path: '/classrooms', label: '课堂管理', icon: BookOpen },
    { path: '/upload', label: '视频上传', icon: Video },
  ];

  return (
    <div className={`min-h-screen flex ${focusMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Sidebar - 专注模式时隐藏 */}
      {!focusMode && (
        <aside className="w-64 bg-gradient-to-b from-primary-900 to-primary-800 dark:from-gray-900 dark:to-gray-800 text-white flex flex-col flex-shrink-0">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              ClassInsight
            </h1>
            <p className="text-sm text-gray-300 mt-1">课堂状态分析平台</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Controls */}
          <div className="px-4 py-2 border-t border-white/10">
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                title={darkMode ? "切换亮色模式" : "切换暗色模式"}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleFocusMode}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                title="专注模式"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user?.name || '教师用户'}</p>
                <p className="text-xs text-gray-400">{user?.email || 'teacher@school.edu'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${
        focusMode 
          ? 'p-4' 
          : darkMode 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-50'
      }`}>
        {/* 专注模式的退出按钮 */}
        {focusMode && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleFocusMode}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all"
            >
              <Minimize className="w-4 h-4" />
              <span>退出专注</span>
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
