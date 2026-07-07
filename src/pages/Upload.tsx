import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  X, 
  FileVideo, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store';
import { UploadTask } from '@/types';
import { getUploadNarrative } from '@/utils/mockData';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const uploadTasks = useAppStore((state) => state.uploadTasks);
  const addUploadTask = useAppStore((state) => state.addUploadTask);
  const updateUploadTask = useAppStore((state) => state.updateUploadTask);
  const saveUploadDraft = useAppStore(state => state.saveUploadDraft);
  const clearUploadDraft = useAppStore(state => state.clearUploadDraft);
  const uploadDraft = useAppStore(state => state.uploadDraft);
  const darkMode = useAppStore(state => state.darkMode);
  const [isDragging, setIsDragging] = useState(false);

  // 改进6：从草稿箱恢复
  useEffect(() => {
    const savedDraft = localStorage.getItem('uploadDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // 继续处理草稿
        if (draft.status === 'processing') {
          addUploadTask(draft);
          let progress = draft.progress || 0;
          const uploadInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
              progress = 100;
              clearInterval(uploadInterval);
              updateUploadTask(draft.id, { progress: 100, status: 'completed' });
              clearUploadDraft();
            } else {
              updateUploadTask(draft.id, { progress: Math.min(progress, 100) });
              saveUploadDraft({ ...draft, progress: Math.min(progress, 100) });
            }
          }, 500);
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        handleFileUpload(file);
      }
    });
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        handleFileUpload(file);
      }
    });
  }, []);

  const handleFileUpload = (file: File) => {
    const taskId = Date.now().toString();
    const task: UploadTask = {
      id: taskId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };
    addUploadTask(task);

    // 改进6：保存草稿
    saveUploadDraft(task);

    // 模拟上传进度
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        updateUploadTask(taskId, { progress: 100, status: 'processing' });
        saveUploadDraft({ ...task, progress: 100, status: 'processing' });
        
        // 模拟处理过程
        setTimeout(() => {
          updateUploadTask(taskId, { status: 'completed' });
          clearUploadDraft();
        }, 3000);
      } else {
        updateUploadTask(taskId, { progress: Math.min(progress, 100) });
        saveUploadDraft({ ...task, progress: Math.min(progress, 100) });
      }
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return '上传中';
      case 'processing':
        return '分析中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            视频上传
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            上传课堂视频进行状态分析
          </p>
        </div>

        {/* 改进6：草稿箱提示 */}
        {uploadDraft && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            darkMode ? 'bg-cyan-900/20 border border-cyan-700' : 'bg-cyan-50 border border-cyan-200'
          }`}>
            <Info className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <div className="flex-1">
              <p className={`font-medium ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                有未完成的上传任务
              </p>
              <p className={`text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {uploadDraft.fileName} - 已自动恢复
              </p>
            </div>
            <button
              onClick={clearUploadDraft}
              className={`p-1 rounded ${darkMode ? 'hover:bg-cyan-800' : 'hover:bg-cyan-100'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`mb-8 border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
              : `border-gray-300 hover:border-cyan-400 ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="mb-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              darkMode ? 'bg-cyan-900/30' : 'bg-cyan-100'
            }`}>
              <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              拖拽视频文件到这里
            </h3>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              或者点击选择文件
            </p>
          </div>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all"
          >
            选择视频文件
          </button>
          <p className={`text-sm mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            支持 MP4, AVI, MOV 等常见视频格式
          </p>
        </div>

        {/* Upload Tasks */}
        {uploadTasks.length > 0 && (
          <div className={`rounded-2xl p-6 shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              上传任务
            </h3>
            <div className="space-y-4">
              {uploadTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <FileVideo className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {task.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(task.status)}
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    {(task.status === 'uploading' || task.status === 'processing') && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          {/* 改进9：进度条叙事文案 */}
                          <p className={`text-xs ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            {getUploadNarrative(task.progress)}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {Math.round(task.progress)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {task.status === 'completed' && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20' 
                          : 'text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50'
                      }`}
                    >
                      查看分析 <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadPage;
