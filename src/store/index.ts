import { create } from 'zustand';
import { User, Classroom, AnalysisResult, UploadTask } from '@/types';
import { mockAnalysisResult } from '@/utils/mockData';

interface AppState {
  user: User | null;
  classrooms: Classroom[];
  currentClassroom: Classroom | null;
  analysisResults: Record<string, AnalysisResult>;
  uploadTasks: UploadTask[];
  // 改进5：历史课堂数据池
  historyClassrooms: AnalysisResult[];
  // 改进8：主题模式
  darkMode: boolean;
  focusMode: boolean;
  // 改进6：草稿箱
  uploadDraft: UploadTask | null;
  
  setUser: (user: User | null) => void;
  setClassrooms: (classrooms: Classroom[]) => void;
  setCurrentClassroom: (classroom: Classroom | null) => void;
  addClassroom: (classroom: Classroom) => void;
  setAnalysisResult: (classroomId: string, result: AnalysisResult) => void;
  addUploadTask: (task: UploadTask) => void;
  updateUploadTask: (taskId: string, updates: Partial<UploadTask>) => void;
  // 改进5：添加历史记录和对比功能
  addToHistory: (result: AnalysisResult) => void;
  compareWithAverage: (currentId: string) => { 
    avgEngagement: number; 
    avgInteraction: number; 
  } | null;
  // 改进8：主题切换
  toggleDarkMode: () => void;
  toggleFocusMode: () => void;
  // 改进6：草稿箱
  saveUploadDraft: (draft: UploadTask) => void;
  clearUploadDraft: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  classrooms: [],
  currentClassroom: null,
  analysisResults: {},
  uploadTasks: [],
  historyClassrooms: [mockAnalysisResult],
  darkMode: false,
  focusMode: false,
  uploadDraft: null,
  
  setUser: (user) => set({ user }),
  setClassrooms: (classrooms) => set({ classrooms }),
  setCurrentClassroom: (classroom) => set({ currentClassroom: classroom }),
  addClassroom: (classroom) => set((state) => ({ 
    classrooms: [...state.classrooms, classroom] 
  })),
  setAnalysisResult: (classroomId, result) => set((state) => ({
    analysisResults: { ...state.analysisResults, [classroomId]: result }
  })),
  addUploadTask: (task) => set((state) => ({
    uploadTasks: [...state.uploadTasks, task]
  })),
  updateUploadTask: (taskId, updates) => set((state) => ({
    uploadTasks: state.uploadTasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    )
  })),
  
  // 改进5：历史记录功能
  addToHistory: (result) => set((state) => ({
    historyClassrooms: [...state.historyClassrooms.filter(h => h.classroomId !== result.classroomId), result]
  })),
  
  compareWithAverage: (currentId) => {
    const state = get();
    const current = state.analysisResults[currentId];
    if (!current) return null;
    
    const others = state.historyClassrooms.filter(c => c.classroomId !== currentId);
    if (others.length === 0) return null;
    
    const avgEngagement = others.reduce((sum, c) => sum + c.overallEngagement, 0) / others.length;
    const interactionData = current.stateData.find(s => s.state === 'interacting');
    const avgInteraction = interactionData ? interactionData.duration / current.totalDuration * 100 : 0;
    
    return { avgEngagement, avgInteraction };
  },
  
  // 改进8：主题切换
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: newMode };
  }),
  
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  
  // 改进6：草稿箱
  saveUploadDraft: (draft) => {
    localStorage.setItem('uploadDraft', JSON.stringify(draft));
    set({ uploadDraft: draft });
  },
  
  clearUploadDraft: () => {
    localStorage.removeItem('uploadDraft');
    set({ uploadDraft: null });
  },
}));
