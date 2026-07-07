import { Classroom, AnalysisResult, TrendData } from '@/types';

// 改进1：状态名称正向语言重构
export interface StateDisplayConfig {
  label: string;
  emoji: string;
  color: string;
}

export const stateDisplayMap: Record<string, StateDisplayConfig> = {
  'listening': { label: '专注听讲', emoji: '🧠', color: '#0ea5e9' },
  'note-taking': { label: '随堂记录', emoji: '✍️', color: '#10b981' },
  'interacting': { label: '积极互动', emoji: '💡', color: '#f97316' },
  'away': { label: '暂离状态', emoji: '🚶', color: '#94a3b8' },
};

export const mockClassrooms: Classroom[] = [
  {
    id: '1',
    name: '高等数学 - 第1节课',
    date: '2024-06-15',
    status: 'completed',
  },
  {
    id: '2',
    name: '数据结构 - 复习课',
    date: '2024-06-14',
    status: 'completed',
  },
  {
    id: '3',
    name: '计算机网络 - 实验课',
    date: '2024-06-13',
    status: 'processing',
  },
];

export const mockAnalysisResult: AnalysisResult = {
  classroomId: '1',
  overallEngagement: 78,
  totalDuration: 2700,
  stateData: [
    { state: 'listening', duration: 1200 },
    { state: 'note-taking', duration: 600 },
    { state: 'interacting', duration: 450 },
    { state: 'away', duration: 450 },
  ],
  trendData: [
    { timestamp: '08:00', engagement: 85 },
    { timestamp: '08:15', engagement: 90 },
    { timestamp: '08:30', engagement: 82 },
    { timestamp: '08:45', engagement: 75 },
    { timestamp: '09:00', engagement: 70 },
    { timestamp: '09:15', engagement: 68 },
    { timestamp: '09:30', engagement: 72 },
    { timestamp: '09:45', engagement: 78 },
    { timestamp: '10:00', engagement: 80 },
    { timestamp: '10:15', engagement: 75 },
  ],
  suggestions: [
    '课堂前半段参与度较高，可以在第45分钟左右增加互动环节维持注意力',
    '低头记录状态占比较高，说明学生在认真做笔记，可考虑提供课件下载',
    '离座时间主要集中在课程后半段，建议合理安排休息时间',
  ],
};

// 改进1：获取状态显示信息
export const getStateDisplay = (state: string) => {
  return stateDisplayMap[state] || { label: state, emoji: '❓', color: '#6b7280' };
};

// 改进2：智能高亮时刻 - 查找峰值和谷值
export const findKeyMoments = (trendData: TrendData[]) => {
  const sorted = [...trendData].sort((a, b) => b.engagement - a.engagement);
  return {
    peak: sorted.slice(0, 3),
    valley: sorted.slice(-3).reverse(),
  };
};

// 改进4：获取悬浮摘要
export const getInsight = (state: string, duration: number, totalDuration: number) => {
  const ratio = duration / totalDuration;
  if (state === 'interacting' && ratio > 0.3) {
    return '🎉 互动充足，课堂氛围活跃！';
  }
  if (state === 'listening' && ratio > 0.6) {
    return '👂 学生专注度较高，可适当增加互动环节。';
  }
  if (state === 'note-taking' && ratio > 0.2) {
    return '✍️ 笔记记录积极，建议提供课件辅助学习。';
  }
  if (state === 'away' && ratio > 0.15) {
    return '🚶 暂离比例略高，可考虑增加互动来拉回注意力。';
  }
  return '';
};

// 改进9：进度条叙事文案
export const getUploadNarrative = (progress: number): string => {
  if (progress < 20) return '📤 正在接收视频文件...';
  if (progress < 50) return '🔍 识别课堂场景中...';
  if (progress < 80) return '🤖 AI 分析学生状态...';
  if (progress < 100) return '📊 生成可视化报告...';
  return '✅ 分析完成！点击查看报告';
};

// 格式化时长
export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};
