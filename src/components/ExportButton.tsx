import React from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  targetId: string;
  filename: string;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  targetId, 
  filename,
  label = "导出图片" 
}) => {
  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      console.error('Element not found:', targetId);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
    >
      <Download className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

export default ExportButton;
