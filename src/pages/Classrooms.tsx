import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Trash2,
  Calendar,
  Clock
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store';
import { mockClassrooms } from '@/utils/mockData';
import { Classroom } from '@/types';

const Classrooms: React.FC = () => {
  const navigate = useNavigate();
  const classrooms = useAppStore((state) => state.classrooms);
  const setClassrooms = useAppStore((state) => state.setClassrooms);
  const darkMode = useAppStore(state => state.darkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setClassrooms(mockClassrooms);
  }, [setClassrooms]);

  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    const classroom: Classroom = {
      id: Date.now().toString(),
      name: newClassroom.name,
      date: newClassroom.date,
      status: 'pending',
    };
    setClassrooms([...classrooms, classroom]);
    setShowModal(false);
    setNewClassroom({ name: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteClassroom = (id: string) => {
    setClassrooms(classrooms.filter(c => c.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
      case 'processing':
        return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '分析中';
      case 'failed':
        return '失败';
      default:
        return '待处理';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>课堂管理</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>管理和查看所有课堂记录</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            创建课堂
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索课堂..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Classroom List */}
        <div className="grid gap-4">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className={`rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getStatusDot(classroom.status)}`}></div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{classroom.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{classroom.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(classroom.status)}`}>
                    {getStatusLabel(classroom.status)}
                  </span>

                  <div className="flex items-center gap-2">
                    {classroom.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/analysis/${classroom.id}`)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20' 
                            : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50'
                        }`}
                        title="查看分析"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {classroom.status === 'pending' && (
                      <button
                        onClick={() => navigate('/upload')}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20' 
                            : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50'
                        }`}
                        title="上传视频"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClassroom(classroom.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredClassrooms.length === 0 && (
            <div className="text-center py-12">
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>没有找到课堂记录</p>
              <button
                onClick={() => setShowModal(true)}
                className={`mt-4 font-medium ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
              >
                创建第一个课堂
              </button>
            </div>
          )}
        </div>

        {/* Create Classroom Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>创建新课堂</h2>
              <form onSubmit={handleCreateClassroom} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>课堂名称</label>
                  <input
                    type="text"
                    value={newClassroom.name}
                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="请输入课堂名称"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>日期</label>
                  <input
                    type="date"
                    value={newClassroom.date}
                    onChange={(e) => setNewClassroom({ ...newClassroom, date: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 px-4 py-2.5 border font-medium rounded-xl transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all"
                  >
                    创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Classrooms;
