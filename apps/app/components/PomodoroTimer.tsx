'use client';

import { useState, useEffect, useRef } from 'react';
import { TimelineTask } from '@cursor-deneme/shared';
import { useToast } from './Toast';
import { savePomodoroRecord, getTodayPomodoroCount } from '@cursor-deneme/shared';

interface PomodoroTimerProps {
  task: TimelineTask;
  userId: string;
  onClose: () => void;
}

export default function PomodoroTimer({ task, userId, onClose }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 dakika (saniye cinsinden)
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const { showToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pomodoroStartTime = useRef<Date | null>(null);

  // Bugünkü pomodoro sayısını yükle
  useEffect(() => {
    const count = getTodayPomodoroCount(userId);
    setCompletedPomodoros(count);
  }, [userId]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Çalışma pomodoro'su tamamlandı - kaydet
      savePomodoroRecord(userId, {
        taskId: task.id || '',
        taskTitle: task.title,
        category: task.category || undefined,
        date: new Date().toISOString().split('T')[0],
        duration: 25,
        type: 'work',
      });
      
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      showToast('🎉 Pomodoro tamamlandı! Mola zamanı.', 'success');
      
      // Mola moduna geç (5 dakika)
      setIsBreak(true);
      setTimeLeft(5 * 60);
    } else {
      // Mola tamamlandı
      showToast('Mola bitti! Yeni pomodoro başlat.', 'info');
      setIsBreak(false);
      setTimeLeft(25 * 60);
    }

    // Ses çal (opsiyonel)
    if (typeof window !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eeeSwkMUKnj8LVjHAU3kdfy0HgsBS...');
      audio.play().catch(() => {});
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      pomodoroStartTime.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const skipBreak = () => {
    setIsBreak(false);
    setTimeLeft(25 * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((5 * 60 - timeLeft) / (5 * 60)) * 100
    : ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isBreak ? '☕ Mola Zamanı' : '🍅 Pomodoro'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Görev Adı */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold">
              {completedPomodoros}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Üzerinde Çalışılan Görev:</div>
              <div className="text-gray-700 font-medium">{task.title}</div>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-7xl font-bold mb-4 ${isBreak ? 'text-blue-600' : 'text-emerald-600'}`}>
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress Circle */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className={`${isBreak ? 'text-blue-500' : 'text-emerald-500'} transition-all duration-1000`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">
                  {isBreak ? 'Mola' : 'Çalışma'}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
            <span>Bugün: {completedPomodoros} 🍅</span>
            <span>•</span>
            <span>Hedef: 8 🍅</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Start/Pause Button */}
          <button
            onClick={toggleTimer}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
              isRunning
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : isBreak
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            }`}
          >
            {isRunning ? '⏸ Duraklat' : '▶ Başlat'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetTimer}
              className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sıfırla
            </button>
            
            {isBreak && (
              <button
                onClick={skipBreak}
                className="py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Molayı Geç
              </button>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-900 leading-relaxed">
              💡 <strong>Pomodoro Tekniği:</strong> 25 dakika odaklanma + 5 dakika mola. 
              4 pomodoro sonrası 15-30 dakika uzun mola önerilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
