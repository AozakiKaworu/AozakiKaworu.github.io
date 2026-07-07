import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import { mockClassrooms } from '@/utils/mockData';

export const FloatingSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const classrooms = useAppStore(state => state.classrooms.length > 0 
    ? state.classrooms 
    : mockClassrooms);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-64 max-h-80 overflow-y-auto">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2 px-2">
            最近课堂
          </h4>
          <div className="space-y-1">
            {classrooms.map(classroom => (
              <button
                key={classroom.id}
                onClick={() => {
                  if (classroom.status === 'completed') {
                    navigate(`/analysis/${classroom.id}`);
                    setIsOpen(false);
                  }
                }}
                disabled={classroom.status !== 'completed'}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  classroom.status === 'completed'
                    ? 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{classroom.name}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {classroom.date}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all group"
      >
        {isOpen ? (
          <ChevronRight className="w-6 h-6" />
        ) : (
          <ChevronLeft className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default FloatingSwitcher;
