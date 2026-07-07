import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Award,
  ChevronRight,
  Star,
  AlertCircle
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Layout from '@/components/Layout';
import { ExportButton } from '@/components/ExportButton';
import { useAppStore } from '@/store';
import { 
  mockClassrooms, 
  mockAnalysisResult, 
  getStateDisplay, 
  findKeyMoments,
  getInsight,
  formatDuration
} from '@/utils/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const setClassrooms = useAppStore((state) => state.setClassrooms);
  const setAnalysisResult = useAppStore((state) => state.setAnalysisResult);
  const addToHistory = useAppStore(state => state.addToHistory);
  const compareWithAverage = useAppStore(state => state.compareWithAverage);
  const classrooms = useAppStore((state) => state.classrooms);
  const darkMode = useAppStore(state => state.darkMode);
  const focusMode = useAppStore(state => state.focusMode);

  // 改进3：渐进式渲染状态
  const [visibleDataIndex, setVisibleDataIndex] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    setClassrooms(mockClassrooms);
    setAnalysisResult('1', mockAnalysisResult);
    addToHistory(mockAnalysisResult);
  }, [setClassrooms, setAnalysisResult, addToHistory]);

  // 改进3：渐进式渲染动画
  useEffect(() => {
    setVisibleDataIndex(0);
    const totalPoints = mockAnalysisResult.trendData.length;
    
    const animate = () => {
      setVisibleDataIndex(prev => {
        if (prev >= totalPoints) {
          return prev;
        }
        return prev + 2;
      });
    };

    animationRef.current = window.setInterval(animate, 100);
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // 改进2：智能高亮时刻
  const keyMoments = useMemo(() => findKeyMoments(mockAnalysisResult.trendData), []);

  // 改进5：对比历史平均
  const comparison = compareWithAverage('1');

  // 状态时长图表数据 - 改进1：正向语言
  const stateChartData = useMemo(() => {
    const data = mockAnalysisResult.stateData;
    return {
      labels: data.map(item => {
        const display = getStateDisplay(item.state);
        return `${display.emoji} ${display.label}`;
      }),
      datasets: [
        {
          label: '时长(秒)',
          data: data.map(item => item.duration),
          backgroundColor: data.map(item => getStateDisplay(item.state).color),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, []);

  // 趋势图表数据 - 改进2：智能高亮标记
  const trendChartData = useMemo(() => {
    const data = mockAnalysisResult.trendData.slice(0, visibleDataIndex);
    const peakTimestamps = keyMoments.peak.map(p => p.timestamp);
    const valleyTimestamps = keyMoments.valley.map(v => v.timestamp);

    return {
      labels: data.map(item => item.timestamp),
      datasets: [
        {
          label: '参与度(%)',
          data: data.map(item => item.engagement),
          borderColor: '#0ea5e9',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.3)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: data.map(item => {
            if (peakTimestamps.includes(item.timestamp)) return 8;
            if (valleyTimestamps.includes(item.timestamp)) return 8;
            return 4;
          }),
          pointHoverRadius: 6,
          pointBackgroundColor: data.map(item => {
            if (peakTimestamps.includes(item.timestamp)) return '#fbbf24';
            if (valleyTimestamps.includes(item.timestamp)) return '#94a3b8';
            return '#0ea5e9';
          }),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [visibleDataIndex, keyMoments]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        // 改进4：悬浮摘要卡片
        callbacks: {
          afterBody: (context: any) => {
            if (context[0]) {
              const index = context[0].dataIndex;
              const stateData = mockAnalysisResult.stateData[index];
              if (stateData) {
                const insight = getInsight(
                  stateData.state, 
                  stateData.duration, 
                  mockAnalysisResult.totalDuration
                );
                if (insight) return `\n${insight}`;
              }
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const trendChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const stats = [
    {
      title: '总体参与度',
      value: `${mockAnalysisResult.overallEngagement}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      change: comparison ? `${mockAnalysisResult.overallEngagement - comparison.avgEngagement > 0 ? '+' : ''}${(mockAnalysisResult.overallEngagement - comparison.avgEngagement).toFixed(1)}% vs 平均` : '+5.2%',
    },
    {
      title: '课堂时长',
      value: formatDuration(mockAnalysisResult.totalDuration),
      icon: Clock,
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      title: '已分析课堂',
      value: (classrooms.length > 0 ? classrooms : mockClassrooms).filter(c => c.status === 'completed').length.toString(),
      icon: Users,
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      title: '平均评分',
      value: 'A',
      icon: Award,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <Layout>
      <div className={`${focusMode ? 'h-full overflow-auto' : 'p-8'}`} id="dashboard-charts">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              数据看板
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              查看课堂状态分析数据和参与度趋势
            </p>
          </div>
          {!focusMode && (
            <ExportButton targetId="dashboard-charts" filename="课堂报告" />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium ${
                      stat.change.includes('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* 改进2：智能高亮时刻展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Star className="w-5 h-5 text-yellow-500" />
              高光时刻
            </h3>
            <div className="space-y-3">
              {keyMoments.peak.map((peak, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{peak.timestamp}</span>
                  <span className="text-yellow-500 font-bold">{peak.engagement}% 参与度</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <AlertCircle className="w-5 h-5 text-gray-500" />
              需要关注
            </h3>
            <div className="space-y-3">
              {keyMoments.valley.map((valley, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{valley.timestamp}</span>
                  <span className="text-gray-500 font-bold">{valley.engagement}% 参与度</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* State Duration Chart */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>状态时长统计</h3>
            </div>
            <div className="h-64">
              <Bar data={stateChartData} options={chartOptions} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>参与度趋势</h3>
            </div>
            <div className="h-64">
              <Line data={trendChartData} options={trendChartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Classrooms */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">最近课堂</h3>
            <button
              onClick={() => navigate('/classrooms')}
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {(classrooms.length > 0 ? classrooms : mockClassrooms).slice(0, 3).map((classroom) => (
              <div
                key={classroom.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/analysis/${classroom.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    classroom.status === 'completed' ? 'bg-green-500' :
                    classroom.status === 'processing' ? 'bg-yellow-500' :
                    classroom.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{classroom.name}</p>
                    <p className="text-sm text-gray-500">{classroom.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    classroom.status === 'completed' ? 'bg-green-100 text-green-700' :
                    classroom.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    classroom.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {classroom.status === 'completed' ? '已完成' :
                     classroom.status === 'processing' ? '分析中' :
                     classroom.status === 'failed' ? '失败' : '待处理'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
