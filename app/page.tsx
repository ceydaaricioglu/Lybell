'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TimelineTask } from '@/lib/types';
import { saveTaskToSupabase, fetchTasksFromSupabase, filterRecurringTasks } from '@/lib/helpers';
import {
  getNotificationsEnabled,
  getDailyDigestEnabled,
  getDailyDigestTime,
  getOverdueReminderEnabled,
  getOverdueReminderTime,
  LAST_DAILY_DIGEST_PREFIX,
  LAST_OVERDUE_REMINDER_PREFIX,
} from '@/lib/notifications';
import LoginView from '@/components/LoginView';
import { OnboardingStep1, OnboardingStep2 } from '@/components/Onboarding';
import HomeView from '@/components/HomeView';
import CategoryTaskView from '@/components/CategoryTaskView';
import CategoriesView from '@/components/CategoriesView';
import EditTaskView from '@/components/EditTaskView';
import TasksView from '@/components/TasksView';
import SettingsView from '@/components/SettingsView';
import ProfileView from '@/components/ProfileView';
import ProUpgradeView from '@/components/ProUpgradeView';
import type { PlanId } from '@/components/ProUpgradeView';
import BottomNav from '@/components/BottomNav';
import PomodoroTimer from '@/components/PomodoroTimer';
import CalendarView from '@/components/CalendarView';
import { LocaleProvider } from '@/components/LocaleContext';

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'login' | 'onboarding1' | 'onboarding2' | 'home' | 'category' | 'categories' | 'tasks' | 'calendar' | 'edit-task' | 'settings' | 'profile' | 'pro'>('login');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [viewingDate, setViewingDate] = useState<string | undefined>(undefined);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [pomodoroTask, setPomodoroTask] = useState<TimelineTask | null>(null);
  /** Görev ekleme/düzenlemeden Geri veya Kaydet sonrası dönülecek ekran */
  const [returnViewAfterEdit, setReturnViewAfterEdit] = useState<'home' | 'tasks' | 'category' | 'categories' | 'calendar'>('home');
  /** Takvimden seçilen gün; Görevler ekranında bu tarih vurgulanır */
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | undefined>(undefined);
  /** Karanlık mod (Ana Sayfa tasarımı Dark Refined olur) */
  const [isDarkMode, setIsDarkMode] = useState(false);
  /** Pro abonelik (mock – test için localStorage 'app_pro_mock' = '1' yapılabilir) */
  const [isPro, setIsPro] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('app_dark_mode') : null;
    setIsDarkMode(stored === 'true');
  }, []);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('app_pro_mock') : null;
    setIsPro(stored === '1');
  }, [currentView]);

  const handleDarkModeChange = (value: boolean) => {
    if (typeof window !== 'undefined') localStorage.setItem('app_dark_mode', String(value));
    setIsDarkMode(value);
  };

  // Bildirimler: hatırlatma + günlük özet + gecikmiş görev (ayar açıksa, dakikada bir kontrol)
  useEffect(() => {
    if (!userId || typeof window === 'undefined' || !('Notification' in window)) return;

    const today = new Date();
    const todayStr = today.getDate().toString();
    const todayDateKey = today.toISOString().slice(0, 10); // YYYY-MM-DD

    const getCurrentTime = () => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const showNotification = (title: string, body: string, tag: string) => {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, tag });
        }
      } catch (_) {}
    };

    const run = async () => {
      if (!getNotificationsEnabled()) return;

      const tasks = await fetchTasksFromSupabase(userId);
      const now = getCurrentTime();

      // 1) Görev hatırlatmaları (reminderAt)
      const todayTasks = filterRecurringTasks(tasks, todayStr).filter(t => t.reminderAt && t.reminderAt.trim());
      for (const task of todayTasks) {
        if (task.reminderAt?.trim() !== now) continue;
        const key = `reminder_done_${userId}_${task.id}_${todayStr}_${task.reminderAt}`;
        if (localStorage.getItem(key)) continue;
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') {
          showNotification(task.title, 'Hatırlatma', key);
          localStorage.setItem(key, '1');
        }
      }

      // 2) Günlük özet (bir kez günde, ayarlanan saatte)
      if (getDailyDigestEnabled() && getDailyDigestTime() === now) {
        const digestKey = `${LAST_DAILY_DIGEST_PREFIX}${todayDateKey}`;
        if (!localStorage.getItem(digestKey)) {
          if (Notification.permission === 'default') await Notification.requestPermission();
          const count = filterRecurringTasks(tasks, todayStr).filter(t => !t.completed).length;
          showNotification('Günlük özet', count > 0 ? `Bugün ${count} görevin var.` : 'Bugün planlanan görev yok.', digestKey);
          localStorage.setItem(digestKey, '1');
        }
      }

      // 3) Gecikmiş görev uyarısı (bir kez günde, ayarlanan saatte)
      if (getOverdueReminderEnabled() && getOverdueReminderTime() === now) {
        const overdueKey = `${LAST_OVERDUE_REMINDER_PREFIX}${todayDateKey}`;
        if (!localStorage.getItem(overdueKey)) {
          const todayNum = parseInt(todayStr, 10);
          const overdueCount = tasks.filter(t => !t.completed && t.date && parseInt(t.date, 10) < todayNum).length;
          if (overdueCount > 0) {
            if (Notification.permission === 'default') await Notification.requestPermission();
            if (Notification.permission === 'granted') {
              showNotification('Gecikmiş görevler', `${overdueCount} gecikmiş görevin var.`, overdueKey);
            }
            localStorage.setItem(overdueKey, '1');
          }
        }
      }
    };

    run();
    const interval = setInterval(run, 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // İlk yükleme + Supabase oturum değişince (giriş/çıkış, magic link, OAuth) güncelle
  useEffect(() => {
    const applySession = (session: { user: { id: string } } | null) => {
      if (session?.user) {
        setUserId(session.user.id);
        const onboardingCompleted = localStorage.getItem(`onboarding_${session.user.id}`);
        setCurrentView(onboardingCompleted ? 'home' : 'onboarding1');
      } else {
        setUserId('');
        const mockUserId = localStorage.getItem('mock_user_id');
        if (mockUserId) {
          setUserId(mockUserId);
          const onboardingCompleted = localStorage.getItem(`onboarding_${mockUserId}`);
          setCurrentView(onboardingCompleted ? 'home' : 'onboarding1');
        } else {
          setCurrentView('login');
        }
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      applySession(session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const onboardingCompleted = localStorage.getItem(`onboarding_${session.user.id}`);
        setCurrentView(onboardingCompleted ? 'home' : 'onboarding1');
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
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
    setCurrentView(returnViewAfterEdit);
    setEditingTask(null);
  };

  if (currentView === 'login') {
    return <LoginView onLogin={handleLogin} onSkip={handleSkip} darkMode={isDarkMode} />;
  }

  if (currentView === 'onboarding1') {
    return (
      <OnboardingStep1
        onNext={() => setCurrentView('onboarding2')}
        onSkip={handleOnboardingComplete}
        selectedFocus={selectedFocus}
        setSelectedFocus={setSelectedFocus}
        darkMode={isDarkMode}
      />
    );
  }

  if (currentView === 'onboarding2') {
    return (
      <OnboardingStep2
        onComplete={handleOnboardingComplete}
        onBack={() => setCurrentView('onboarding1')}
        onSkip={handleOnboardingComplete}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
        darkMode={isDarkMode}
      />
    );
  }

  const handleBottomNav = (view: string) => {
    if (view === 'home') {
      setSelectedCategory(null);
      setCurrentView('home');
    } else if (view === 'tasks') {
      setSelectedCategory(null);
      setCalendarSelectedDate(undefined);
      setCurrentView('tasks');
    } else if (view === 'calendar') {
      setSelectedCategory(null);
      setCurrentView('calendar');
    } else if (view === 'add-task') {
      setEditingTask(null);
      setReturnViewAfterEdit(
        currentView === 'tasks' ? 'tasks' : currentView === 'calendar' ? 'calendar' : currentView === 'category' ? 'category' : currentView === 'categories' ? 'categories' : 'home'
      );
      setCurrentView('edit-task');
    } else if (view === 'categories') {
      setCurrentView('categories');
    } else if (view === 'settings') {
      setCurrentView('settings');
    }
  };

  // Bottom nav'ın gösterileceği ekranlar (pro tam ekran, nav yok)
  const showBottomNav = ['home', 'tasks', 'calendar', 'category', 'categories', 'edit-task', 'settings', 'profile'].includes(currentView);

  const handleLogout = () => {
    setUserId('');
    setSelectedCategory(null);
    setEditingTask(null);
    setSelectedFocus(null);
    setSelectedSchedule(null);
    setCurrentView('login');
  };

  const renderCurrentView = () => {
if (currentView === 'profile') {
    return (
      <ProfileView
        userId={userId}
        darkMode={isDarkMode}
        onBack={() => setCurrentView('settings')}
      />
    );
  }

  if (currentView === 'pro') {
    return (
      <ProUpgradeView
        darkMode={isDarkMode}
        isPro={isPro}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        onClose={() => setCurrentView('settings')}
        onRestore={() => {}}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsView
        userId={userId}
        onLogout={handleLogout}
        darkMode={isDarkMode}
        onDarkModeChange={handleDarkModeChange}
        onOpenProfile={() => setCurrentView('profile')}
        onOpenPro={() => setCurrentView('pro')}
      />
    );
  }

    if (currentView === 'edit-task') {
      return (
        <EditTaskView
          task={editingTask || undefined}
          darkMode={isDarkMode}
          onBack={() => {
            setViewingDate(undefined);
            setCurrentView(returnViewAfterEdit);
          }}
          onSave={(task) => {
            handleSaveTask(task);
            setViewingDate(undefined);
          }}
          onDelete={() => {
            setEditingTask(null);
            setViewingDate(undefined);
            setCurrentView(returnViewAfterEdit);
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
            setReturnViewAfterEdit('category');
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
          darkMode={isDarkMode}
          initialDateFromCalendar={calendarSelectedDate}
          onBack={() => setCurrentView('home')}
          onEditTask={(task: TimelineTask, date?: string) => {
            setReturnViewAfterEdit('tasks');
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          onAddTask={() => {
            setReturnViewAfterEdit('tasks');
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
          darkMode={isDarkMode}
          onBack={() => setCurrentView('home')}
          onDateSelect={(date) => {
            setSelectedCategory(null);
            setCalendarSelectedDate(date);
            setCurrentView('tasks');
          }}
          onEditTask={(task, date) => {
            setReturnViewAfterEdit('calendar');
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
          darkMode={isDarkMode}
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
        darkMode={isDarkMode}
        onCategorySelect={(category) => {
          if (category === 'add-task') {
            setReturnViewAfterEdit('home');
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
          setReturnViewAfterEdit('home');
          setEditingTask(task);
          setViewingDate(date);
          setCurrentView('edit-task');
        }}
        onStartPomodoro={(task) => setPomodoroTask(task)}
      />
    );
  };

  return (
    <LocaleProvider>
      <div className="main-content-pad">
        {renderCurrentView()}
        {showBottomNav && (
          <BottomNav currentView={currentView} onNavigate={handleBottomNav} darkMode={isDarkMode} />
        )}
        {pomodoroTask && (
          <PomodoroTimer
            task={pomodoroTask}
            userId={userId}
            onClose={() => setPomodoroTask(null)}
          />
        )}
      </div>
    </LocaleProvider>
  );
}
