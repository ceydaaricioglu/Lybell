'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TimelineTask } from '@/lib/types';
import { saveTaskToSupabase } from '@/lib/helpers';
import LoginView from '@/components/LoginView';
import { OnboardingStep1, OnboardingStep2 } from '@/components/Onboarding';
import HomeView from '@/components/HomeView';
import CategoryTaskView from '@/components/CategoryTaskView';
import CategoriesView from '@/components/CategoriesView';
import EditTaskView from '@/components/EditTaskView';
import TasksView from '@/components/TasksView';
import SettingsView from '@/components/SettingsView';
import BottomNav from '@/components/BottomNav';
import PomodoroTimer from '@/components/PomodoroTimer';
import CalendarView from '@/components/CalendarView';

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'login' | 'onboarding1' | 'onboarding2' | 'home' | 'category' | 'categories' | 'tasks' | 'calendar' | 'edit-task' | 'settings'>('login');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [viewingDate, setViewingDate] = useState<string | undefined>(undefined);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [pomodoroTask, setPomodoroTask] = useState<TimelineTask | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const onboardingCompleted = localStorage.getItem(`onboarding_${session.user.id}`);
        if (onboardingCompleted) {
          setCurrentView('home');
        } else {
          setCurrentView('onboarding1');
        }
      } else {
        const mockUserId = localStorage.getItem('mock_user_id');
        if (mockUserId) {
          setUserId(mockUserId);
          const onboardingCompleted = localStorage.getItem(`onboarding_${mockUserId}`);
          if (onboardingCompleted) {
            setCurrentView('home');
          } else {
            setCurrentView('onboarding1');
          }
        } else {
          setCurrentView('login');
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (newUserId: string) => {
    setUserId(newUserId);
    const onboardingCompleted = localStorage.getItem(`onboarding_${newUserId}`);
    if (onboardingCompleted) {
      setCurrentView('home');
    } else {
      setCurrentView('onboarding1');
    }
  };

  const handleSkip = () => {
    const mockUserId = `mock-${Date.now()}`;
    localStorage.setItem('mock_user_id', mockUserId);
    setUserId(mockUserId);
    setCurrentView('onboarding1');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(`onboarding_${userId}`, 'true');
    setCurrentView('home');
  };

  const handleSaveTask = async (task: TimelineTask) => {
    await saveTaskToSupabase(userId, task);
    setCurrentView(selectedCategory ? 'category' : 'tasks');
    setEditingTask(null);
  };

  if (currentView === 'login') {
    return <LoginView onLogin={handleLogin} onSkip={handleSkip} />;
  }

  if (currentView === 'onboarding1') {
    return (
      <OnboardingStep1
        onNext={() => setCurrentView('onboarding2')}
        selectedFocus={selectedFocus}
        setSelectedFocus={setSelectedFocus}
      />
    );
  }

  if (currentView === 'onboarding2') {
    return (
      <OnboardingStep2
        onComplete={handleOnboardingComplete}
        onBack={() => setCurrentView('onboarding1')}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
      />
    );
  }

  const handleBottomNav = (view: string) => {
    if (view === 'home') {
      setSelectedCategory(null);
      setCurrentView('home');
    } else if (view === 'tasks') {
      setSelectedCategory(null);
      setCurrentView('tasks');
    } else if (view === 'calendar') {
      setSelectedCategory(null);
      setCurrentView('calendar');
    } else if (view === 'add-task') {
      setEditingTask(null);
      setCurrentView('edit-task');
    } else if (view === 'categories') {
      setCurrentView('categories');
    } else if (view === 'settings') {
      setCurrentView('settings');
    }
  };

  // Bottom nav'ın gösterileceği ekranlar
  const showBottomNav = ['home', 'tasks', 'calendar', 'category', 'categories', 'edit-task', 'settings'].includes(currentView);

  const handleLogout = () => {
    setUserId('');
    setSelectedCategory(null);
    setEditingTask(null);
    setSelectedFocus(null);
    setSelectedSchedule(null);
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    if (currentView === 'settings') {
      return (
        <SettingsView
          userId={userId}
          onLogout={handleLogout}
        />
      );
    }

    if (currentView === 'edit-task') {
      return (
        <EditTaskView
          task={editingTask || undefined}
          onBack={() => {
            setViewingDate(undefined);
            setCurrentView(selectedCategory ? 'category' : 'home');
          }}
          onSave={(task) => {
            handleSaveTask(task);
            setViewingDate(undefined);
          }}
          onDelete={() => {
            setEditingTask(null);
            setViewingDate(undefined);
            setCurrentView(selectedCategory ? 'category' : 'home');
          }}
          userId={userId}
          defaultDate={editingTask?.date}
          viewingDate={viewingDate}
        />
      );
    }

    if (currentView === 'category' && selectedCategory) {
      return (
        <CategoryTaskView
          category={selectedCategory}
          onBack={() => setCurrentView('home')}
          userId={userId}
          onEditTask={(task, date) => {
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          onStartPomodoro={(task) => setPomodoroTask(task)}
        />
      );
    }

    if (currentView === 'tasks') {
      return (
        <TasksView
          userId={userId}
          onBack={() => setCurrentView('home')}
          onEditTask={(task: TimelineTask, date?: string) => {
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          onAddTask={() => {
            setEditingTask(null);
            setViewingDate(undefined);
            setCurrentView('edit-task');
          }}
          onStartPomodoro={(task) => setPomodoroTask(task)}
        />
      );
    }

    if (currentView === 'calendar') {
      return (
        <CalendarView
          userId={userId}
          onBack={() => setCurrentView('home')}
          onDateSelect={(date) => {
            setSelectedCategory(null);
            setCurrentView('tasks');
          }}
          onEditTask={(task, date) => {
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
        />
      );
    }

    if (currentView === 'categories') {
      return (
        <CategoriesView
          userId={userId}
          onBack={() => setCurrentView('home')}
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            setCurrentView('category');
          }}
        />
      );
    }

    return (
      <HomeView
        onCategorySelect={(category) => {
          if (category === 'add-task') {
            setEditingTask(null);
            setCurrentView('edit-task');
          } else if (category === 'categories') {
            setCurrentView('categories');
          } else {
            setSelectedCategory(category);
            setCurrentView('category');
          }
        }}
        userId={userId}
        onViewAll={() => setCurrentView('tasks')}
        onViewCalendar={() => setCurrentView('calendar')}
        onViewStats={() => setCurrentView('settings')}
        onEditTask={(task, date) => {
          setEditingTask(task);
          setViewingDate(date);
          setCurrentView('edit-task');
        }}
        onStartPomodoro={(task) => setPomodoroTask(task)}
      />
    );
  };

  return (
    <div className="pb-16">
      {renderCurrentView()}
      {showBottomNav && (
        <BottomNav currentView={currentView} onNavigate={handleBottomNav} />
      )}
      {pomodoroTask && (
        <PomodoroTimer
          task={pomodoroTask}
          userId={userId}
          onClose={() => setPomodoroTask(null)}
        />
      )}
    </div>
  );
}
