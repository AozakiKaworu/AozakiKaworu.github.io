export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Classroom {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}

export interface StateData {
  state: 'listening' | 'note-taking' | 'interacting' | 'away';
  duration: number;
}

export interface TrendData {
  timestamp: string;
  engagement: number;
}

export interface AnalysisResult {
  classroomId: string;
  stateData: StateData[];
  trendData: TrendData[];
  suggestions: string[];
  overallEngagement: number;
  totalDuration: number;
}

export interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  classroomId?: string;
}
