import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Users, 
  Award,
  Lightbulb,
  BarChart3,
  Star,
  AlertCircle
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Layout from '@/components/Layout';
import { ExportButton } from '@/components/ExportButton';
import { FloatingSwitcher } from '@/components/FloatingSwitcher';
import { useAppStore } from '@/store';
import { 
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analysis = mockAnalysisResult;
  const darkMode = useAppStore(state => state.darkMode);
  const focusMode = useAppStore(state => state.focusMode);
  const compareWithAverage = useAppStore(state => state.compareWithAverage);

  // 改进2：智能高亮时刻
  const keyMoments = useMemo(() => findKeyMoments(analysis.trendData), [analysis]);

  // 改进5：对比历史平均
  const comparison = useMemo(() => id ? compareWithAverage(id) : null, [id, compareWithAverage]);

  // 状态时长图表数据 - 改进1：正向语言
  const stateChartData = useMemo(() => {
    const data = analysis.stateData;
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
  }, [analysis]);

  // 趋势图表数据 - 改进2：智能高亮标记
  const trendChartData = useMemo(() => {
    const data = analysis.trendData;
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
  }, [analysis, keyMoments]);

  // 饼图数据
  const doughnutData = useMemo(() => {
    const data = analysis.stateData;
    return {
      labels: data.map(item => {
        const display = getStateDisplay(item.state);
        return `${display.emoji} ${display.label}`;
      }),
      datasets: [
        {
          data: data.map(item => item.duration),
          backgroundColor: data.map(item => getStateDisplay(item.state).color),
          borderWidth: 0,
        },
      ],
    };
  }, [analysis]);

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
              const stateData = analysis.stateData[index];
              if (stateData) {
                const insight = getInsight(
                  stateData.state, 
                  stateData.duration, 
                  analysis.totalDuration
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: darkMode ? '#fff' : '#374151',
        },
      },
    },
  };

  const stats = [
    {
      title: '总体参与度',
      value: `${analysis.overallEngagement}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: darkMode ? 'bg-green-900/20' : 'bg-green-50',
      change: comparison ? `${
        (analysis.overallEngagement - comparison.avgEngagement) > 0 ? '+' : ''
      }${(analysis.overallEngagement - comparison.avgEngagement).toFixed(1)}% vs 平均` : null,
    },
    {
      title: '课堂时长',
      value: formatDuration(analysis.totalDuration),
      icon: Clock,
      color: 'text-cyan-500',
      bg: darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50',
    },
  ];

  return (
    <Layout>
      <div className={`${focusMode ? 'h-full overflow-auto' : 'p-8'}`} id="analysis-charts">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                课堂分析报告
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                高等数学 - 第1节课 · 2024-06-15
              </p>
            </div>
          </div>
          {!focusMode && (
            <ExportButton targetId="analysis-charts" filename="课堂分析报告" />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`rounded-2xl p-6 shadow-sm border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className={`text-xs mt-1 ${
                        stat.change.includes('+') ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 改进2：智能高亮时刻展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-2xl p-6 shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Star className="w-5 h-5 text-yellow-500" />
              高光时刻
            </h3>
            <div className="space-y-3">
              {keyMoments.peak.map((peak, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${
                  darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <span className={`font-medium ${
                    darkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}>{peak.timestamp}</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                    {peak.engagement}% 参与度
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-2xl p-6 shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <AlertCircle className="w-5 h-5 text-gray-500" />
              需要关注
            </h3>
            <div className="space-y-3">
              {keyMoments.valley.map((valley, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <span className={`font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{valley.timestamp}</span>
                  <span className="text-gray-600 dark:text-gray-400 font-bold">
                    {valley.engagement}% 参与度
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* State Distribution - Doughnut */}
          <div className={`rounded-2xl p-6 shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              状态分布
            </h3>
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className={`rounded-2xl p-6 shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              参与度趋势
            </h3>
            <div className="h-64">
              <Line data={trendChartData} options={trendChartOptions} />
            </div>
          </div>
        </div>

        {/* State Duration Chart */}
        <div className={`rounded-2xl p-6 shadow-sm border mb-8 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            状态时长统计
          </h3>
          <div className="h-64">
            <Bar data={stateChartData} options={chartOptions} />
          </div>
        </div>

        {/* Suggestions */}
        <div className={`rounded-2xl p-6 shadow-sm border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
              <Lightbulb className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              教学改进建议
            </h3>
          </div>
          <div className="grid gap-4">
            {analysis.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 border-cyan-500 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 改进7：快速切换侧边栏 */}
      {!focusMode && <FloatingSwitcher />}
    </Layout>
  );
};

export default Analysis;
