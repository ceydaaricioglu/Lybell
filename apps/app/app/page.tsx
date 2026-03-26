'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@cursor-deneme/shared';
import { Category, TimelineTask, Note, NoteFolder } from '@cursor-deneme/shared';
import {
  saveTaskToSupabase,
  fetchTasksFromSupabase,
  fetchNotesFromSupabase,
  fetchNoteFoldersFromSupabase,
  createNoteToSupabase,
  updateNoteToSupabase,
  getMockCategories,
  filterRecurringTasks,
  syncTaskToGoogleCalendar,
} from '@cursor-deneme/shared';
import { FREE_MAX_TASKS } from '@cursor-deneme/shared';
import {
  getNotificationsEnabled,
  getDailyDigestEnabled,
  getDailyDigestTime,
  getOverdueReminderEnabled,
  getOverdueReminderTime,
  getNotificationSound,
  playNotificationSound,
  requestNotificationPermission,
  LAST_DAILY_DIGEST_PREFIX,
  LAST_OVERDUE_REMINDER_PREFIX,
} from '@cursor-deneme/shared';
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
import FirstTaskPromptView from '@/components/FirstTaskPromptView';
import type { PlanId } from '@/components/ProUpgradeView';
import BottomNav from '@/components/BottomNav';
import PomodoroTimer from '@/components/PomodoroTimer';
import CalendarView from '@/components/CalendarView';
import { LocaleProvider } from '@/components/LocaleContext';
import { DEFAULT_NAV_TABS, getVisibleNavTabs } from '@cursor-deneme/shared';
import AppDrawer from '@/components/AppDrawer';
import NotesPlaceholderView from '@/components/NotesPlaceholderView';
import NotesFoldersPlaceholderView from '@/components/NotesFoldersPlaceholderView';
import WidgetPlaceholderView from '@/components/WidgetPlaceholderView';
import NoteEditorPlaceholderView from '@/components/NoteEditorPlaceholderView';

const AUTH_CHECK_TIMEOUT_MS = 6000;
const FORCE_ONBOARDING_PREFIX = 'force_onboarding_';

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [currentView, setCurrentView] = useState<
    | 'login'
    | 'onboarding1'
    | 'onboarding2'
    | 'first-task'
    | 'home'
    | 'category'
    | 'categories'
    | 'tasks'
    | 'calendar'
    | 'edit-task'
    | 'settings'
    | 'profile'
    | 'notes'
    | 'widget'
    | 'note-folders'
    | 'note-editor'
    | 'note-detail'
    | 'pro'
  >('login');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [viewingDate, setViewingDate] = useState<string | undefined>(undefined);
  const [pomodoroTask, setPomodoroTask] = useState<TimelineTask | null>(null);
  /** Görev ekleme/düzenlemeden Geri veya Kaydet sonrası dönülecek ekran */
  const [returnViewAfterEdit, setReturnViewAfterEdit] = useState<'home' | 'tasks' | 'category' | 'categories' | 'calendar'>('home');
  // Kategori detay ekranından (CategoryTaskView) "geri" ile çıkınca nereye dönülecek?
  // Kullanıcı Home'dan mı girdi, yoksa Kategoriler listesinden mi?
  const [returnViewAfterCategory, setReturnViewAfterCategory] = useState<'home' | 'categories'>('home');
  /** Takvimden seçilen gün; Görevler ekranında bu tarih vurgulanır */
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | undefined>(undefined);
  /** Karanlık mod (Ana Sayfa tasarımı Dark Refined olur) */
  const [isDarkMode, setIsDarkMode] = useState(false);
  /** Pro abonelik (mock – test için localStorage 'app_pro_mock' = '1' yapılabilir) */
  const [isPro, setIsPro] = useState(() => typeof window !== 'undefined' && localStorage.getItem('app_pro_mock') === '1');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [visibleNavTabs, setVisibleNavTabsState] = useState<string[]>(() => [...DEFAULT_NAV_TABS]);
  /** Optimistic silme: liste ekranında bu id'ler siliniyor gibi gizlenir */
  const [deletingTaskIds, setDeletingTaskIds] = useState<Set<string>>(new Set());
  /** Merkezi görev listesi – ekranlar arası tek fetch, mutasyonlarda refresh */
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  /** Sol hamburger menü */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resolveInitialView = useCallback((uid: string): 'home' | 'onboarding1' => {
    const onboardingCompleted = localStorage.getItem(`onboarding_${uid}`);
    if (onboardingCompleted === 'true') return 'home';

    const forceOnboardingKey = `${FORCE_ONBOARDING_PREFIX}${uid}`;
    const forceOnboarding = localStorage.getItem(forceOnboardingKey) === '1';
    if (forceOnboarding) {
      localStorage.removeItem(forceOnboardingKey);
      return 'onboarding1';
    }

    if (uid.startsWith('mock-')) return 'onboarding1';
    return 'home';
  }, []);
  const loadTasks = useCallback(async () => {
    if (!userId) return;
    const list = await fetchTasksFromSupabase(userId);
    setTasks(list);
  }, [userId]);
  /** Merkezi liste/kategori cache – ekranlar aynı listeyi kullanır */
  const [categories, setCategories] = useState<Category[]>([]);
  const loadCategories = useCallback(() => {
    if (!userId) return;
    setCategories(getMockCategories(userId));
  }, [userId]);
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Notlar (global)
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!userId) return;
    const list = await fetchNotesFromSupabase(userId);
    setNotes(list);
  }, [userId]);

  const loadNoteFolders = useCallback(async () => {
    if (!userId) return;
    const list = await fetchNoteFoldersFromSupabase(userId);
    setNoteFolders(list);
  }, [userId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadNoteFolders();
  }, [loadNoteFolders]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('app_dark_mode') : null;
    setIsDarkMode(stored === 'true');
  }, []);

  /** R0: Tailwind `dark:` varyantları `html.dark` ile çalışır (EditTaskView vb.) */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('app_pro_mock') : null;
    setIsPro(stored === '1');
  }, [currentView]);

  useEffect(() => {
    if (isPro) setVisibleNavTabsState(getVisibleNavTabs(true));
    else setVisibleNavTabsState([...DEFAULT_NAV_TABS]);
  }, [isPro]);

  // Google Takvim OAuth'dan dönünce doğrudan Takvim sekmesine geç (bağlantı yüklensin)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_calendar') === 'callback' && params.get('success') === '1') {
      setCurrentView('calendar');
    }
  }, []);

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

      // 1) Görev hatırlatmaları (reminderAt + reminderAt2) – saati geçmişse de bir kez bildir
      const todayTasks = filterRecurringTasks(tasks, todayStr);
      const [nowH, nowM] = now.split(':').map(Number);
      const currentMinutes = nowH * 60 + nowM;
      for (const task of todayTasks) {
        const reminders = [task.reminderAt, task.reminderAt2].filter((r): r is string => !!r?.trim());
        for (const rem of reminders) {
          const key = `reminder_done_${userId}_${task.id}_${todayStr}_${rem}`;
          if (localStorage.getItem(key)) continue;
          const [remH, remM] = rem.split(':').map(Number);
          const remMinutes = remH * 60 + remM;
          if (currentMinutes < remMinutes) continue;
          if (Notification.permission === 'default') await requestNotificationPermission();
          if (Notification.permission === 'granted') {
            const body = task.reminderMessage?.trim() || `${task.time} · Hatırlatma`;
            showNotification('⏰ ' + task.title, body, key);
            playNotificationSound(getNotificationSound());
            localStorage.setItem(key, '1');
          }
        }
      }

      // 2) Günlük özet (bir kez günde, ayarlanan saatte)
      if (getDailyDigestEnabled() && getDailyDigestTime() === now) {
        const digestKey = `${LAST_DAILY_DIGEST_PREFIX}${todayDateKey}`;
        if (!localStorage.getItem(digestKey)) {
          if (Notification.permission === 'default') await Notification.requestPermission();
          const count = filterRecurringTasks(tasks, todayStr).filter(t => !t.completed).length;
          showNotification('Günlük özet', count > 0 ? `Bugün ${count} görevin var.` : 'Bugün planlanan görev yok.', digestKey);
          playNotificationSound(getNotificationSound());
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
              playNotificationSound(getNotificationSound());
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
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const fromGoogleCalendar = params?.get('google_calendar') === 'callback' && params?.get('success') === '1';
        if (fromGoogleCalendar) {
          setCurrentView('calendar');
        } else {
          setCurrentView(resolveInitialView(session.user.id));
        }
      } else {
        setUserId('');
        const mockUserId = localStorage.getItem('mock_user_id');
        if (mockUserId) {
          setUserId(mockUserId);
          setCurrentView(resolveInitialView(mockUserId));
        } else {
          setCurrentView('login');
        }
      }
    };

    const checkAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('auth_timeout')), AUTH_CHECK_TIMEOUT_MS)
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = result?.data?.session ?? null;
        applySession(session);
      } catch (_) {
        setUserId('');
        const mockUserId = typeof window !== 'undefined' ? localStorage.getItem('mock_user_id') : null;
        if (mockUserId) {
          setUserId(mockUserId);
          setCurrentView(resolveInitialView(mockUserId));
        } else {
          setCurrentView('login');
        }
      }
    };

    const t = setTimeout(() => checkAuth(), 50);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const fromGoogleCalendar = params?.get('google_calendar') === 'callback' && params?.get('success') === '1';
        if (fromGoogleCalendar) setCurrentView('calendar');
        else {
          setCurrentView((prev) => {
            if (prev === 'login') {
              return resolveInitialView(session.user.id);
            }
            return prev;
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setCurrentView('login');
      }
    });

    return () => {
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [resolveInitialView]);

  const handleLogin = (newUserId: string) => {
    setUserId(newUserId);
    setCurrentView(resolveInitialView(newUserId));
  };

  const handleSkip = () => {
    const mockUserId = `mock-${Date.now()}`;
    localStorage.setItem('mock_user_id', mockUserId);
    setUserId(mockUserId);
    setCurrentView('onboarding1');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(`onboarding_${userId}`, 'true');
    setCurrentView('first-task');
  };

  const handleSaveTask = async (task: TimelineTask) => {
    const isNewTask = !editingTask && !task.id;
    if (isNewTask && !isPro && tasks.length >= FREE_MAX_TASKS) {
      setCurrentView('pro');
      return;
    }
    const savedId = await saveTaskToSupabase(userId, task);
    if (isPro && savedId) {
      const taskWithId = { ...task, id: savedId };
      if (task.syncToGoogle) {
        const action = task.googleEventId ? 'update' : 'create';
        await syncTaskToGoogleCalendar(userId, taskWithId, action, savedId);
      } else if (task.googleEventId) {
        await syncTaskToGoogleCalendar(userId, taskWithId, 'delete');
      }
    }
    setCurrentView(returnViewAfterEdit);
    setEditingTask(null);
    loadTasks();
  };

  if (currentView === 'login') {
    return <LoginView onLogin={handleLogin} onSkip={handleSkip} darkMode={isDarkMode} />;
  }

  if (currentView === 'onboarding1') {
    return (
      <OnboardingStep1
        onNext={() => setCurrentView('onboarding2')}
        onSkip={handleOnboardingComplete}
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
        darkMode={isDarkMode}
      />
    );
  }

  if (currentView === 'first-task') {
    return (
      <FirstTaskPromptView
        onCreateFirstTask={() => {
          setSelectedCategory('routines');
          setEditingTask(null);
          setViewingDate(undefined);
          setReturnViewAfterEdit('home');
          setCurrentView('edit-task');
        }}
        onLater={() => setCurrentView('home')}
      />
    );
  }

  const handleBottomNav = (view: string) => {
    if (view === 'menu') {
      setDrawerOpen((prev) => !prev);
      return;
    }
    // Bottom menüden başka bir sekmeye geçilince drawer’ı kapatıyoruz.
    setDrawerOpen(false);
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
    } else if (view === 'profile') {
      setCurrentView('profile');
    }
  };

  const handleDrawerNavigate = (view: 'home' | 'tasks' | 'calendar' | 'categories' | 'notes' | 'widget' | 'profile' | 'settings') => {
    if (view === 'notes') return setCurrentView('notes');
    if (view === 'widget') return setCurrentView('widget');
    if (view === 'profile') return setCurrentView('profile');
    if (view === 'settings') return setCurrentView('settings');
    return handleBottomNav(view);
  };

  // Drawer açık olsa bile alt menü tıklanabilir olsun diye nav’ı ilgili ekranlarda açık tutuyoruz.
  const showBottomNav = [
    'home',
    'tasks',
    'calendar',
    'category',
    'categories',
    'edit-task',
    'settings',
    'profile',
    'notes',
    'widget',
    'note-folders',
    'note-editor',
    'note-detail',
  ].includes(currentView);

  const notesCountByFolderId = notes.reduce<Record<string, number>>((acc, n) => {
    const folderId = n.folderId;
    if (!folderId) return acc;
    const key = String(folderId);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const handleLogout = () => {
    setUserId('');
    setSelectedCategory(null);
    setEditingTask(null);
    setCurrentView('login');
  };

  const handleSessionLost = () => {
    setUserId('');
    setSelectedCategory(null);
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    if (currentView === 'profile') {
      return (
        <ProfileView
          userId={userId}
          darkMode={isDarkMode}
          onBack={() => setCurrentView('home')}
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
          onUpgrade={() => { /* TODO: ödeme akışı (selectedPlan) */ }}
          onTestUpgrade={() => setIsPro(true)}
        />
      );
    }

    if (currentView === 'settings') {
      return (
        <SettingsView
          userId={userId}
          onLogout={handleLogout}
          onSessionLost={handleSessionLost}
          darkMode={isDarkMode}
          onDarkModeChange={handleDarkModeChange}
          onOpenProfile={() => setCurrentView('profile')}
          onOpenPro={() => setCurrentView('pro')}
          isPro={isPro}
          onNavTabsChange={(tabs) => setVisibleNavTabsState(tabs)}
          onShowOnboarding={() => setCurrentView('onboarding1')}
          onExitPro={() => {
            if (typeof window !== 'undefined') localStorage.removeItem('app_pro_mock');
            setIsPro(false);
          }}
        />
      );
    }

    if (currentView === 'notes') {
      return (
        <NotesPlaceholderView
          darkMode={isDarkMode}
          onBack={() => setCurrentView('home')}
          onOpenFolders={() => setCurrentView('note-folders')}
          onCreateNote={() => setCurrentView('note-editor')}
          onOpenNote={(noteId) => {
            setSelectedNoteId(noteId);
            setCurrentView('note-detail');
          }}
          notes={notes}
          folders={noteFolders}
        />
      );
    }

    if (currentView === 'widget') {
      return <WidgetPlaceholderView darkMode={isDarkMode} onBack={() => setCurrentView('home')} />;
    }

    if (currentView === 'note-folders') {
      return (
        <NotesFoldersPlaceholderView
          darkMode={isDarkMode}
          onBack={() => setCurrentView('notes')}
          folders={noteFolders}
          totalNotesCount={notes.length}
          notesCountByFolderId={notesCountByFolderId}
        />
      );
    }

    if (currentView === 'note-editor') {
      return (
        <NoteEditorPlaceholderView
          darkMode={isDarkMode}
          onBack={() => setCurrentView('notes')}
          onSave={async (input) => {
            if (!userId) return;
            const id = await createNoteToSupabase(userId, {
              title: input.title,
              content: input.content,
              transcript: input.transcript,
              folderId: null,
              audioUrl: input.audioUrl,
            });
            if (!id) throw new Error('note_create_failed');
            await loadNotes();
          }}
        />
      );
    }

    if (currentView === 'note-detail') {
      const note = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) ?? null : null;
      if (!note) return <NotesPlaceholderView darkMode={isDarkMode} onBack={() => setCurrentView('notes')} notes={notes} />;
      return (
        <NoteEditorPlaceholderView
          darkMode={isDarkMode}
          onBack={() => setCurrentView('notes')}
          initialTitle={note.title ?? null}
          initialContent={note.content ?? ''}
          initialTranscript={note.transcript ?? null}
          initialAudioUrl={note.audioUrl ?? null}
          onSave={async (input) => {
            if (!userId) return;
            const ok = await updateNoteToSupabase(userId, note.id, {
              folderId: note.folderId ?? null,
              title: input.title,
              content: input.content,
              transcript: input.transcript,
              audioUrl: input.audioUrl,
            });
            if (!ok) throw new Error('note_update_failed');
            await loadNotes();
          }}
        />
      );
    }

    if (currentView === 'edit-task') {
      return (
        <EditTaskView
          task={editingTask || undefined}
          darkMode={isDarkMode}
          isPro={isPro}
          onOpenPro={() => setCurrentView('pro')}
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
          onDeleteStart={returnViewAfterEdit === 'category' ? (taskId) => setDeletingTaskIds((s) => new Set(s).add(taskId)) : undefined}
          onDeleteDone={(taskId) => setDeletingTaskIds((s) => { const n = new Set(s); n.delete(taskId); return n; })}
          onDeleteFailed={(taskId) => setDeletingTaskIds((s) => { const n = new Set(s); n.delete(taskId); return n; })}
          userId={userId}
          defaultDate={editingTask?.date}
          defaultCategory={selectedCategory}
          viewingDate={viewingDate}
          categories={categories}
        />
      );
    }

    if (currentView === 'category' && selectedCategory) {
      return (
        <CategoryTaskView
          category={selectedCategory}
          onBack={() => setCurrentView(returnViewAfterCategory)}
          userId={userId}
          isPro={isPro}
          deletingTaskIds={deletingTaskIds}
          onEditTask={(task, date) => {
            setReturnViewAfterEdit('category');
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          onAddTask={(categoryId) => {
            setSelectedCategory(categoryId);
            setReturnViewAfterEdit('category');
            setEditingTask(null);
            setViewingDate(undefined);
            setCurrentView('edit-task');
          }}
          onStartPomodoro={(task) => setPomodoroTask(task)}
          tasks={tasks}
          setTasks={setTasks}
          categories={categories}
        />
      );
    }

    if (currentView === 'tasks') {
      return (
        <TasksView
          userId={userId}
          darkMode={isDarkMode}
          isPro={isPro}
          initialDateFromCalendar={calendarSelectedDate}
          onBack={() => setCurrentView('home')}
          onViewCalendar={() => setCurrentView('calendar')}
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
          tasks={tasks}
          setTasks={setTasks}
        />
      );
    }

    if (currentView === 'calendar') {
      return (
        <CalendarView
          userId={userId}
          darkMode={isDarkMode}
          isPro={isPro}
          onOpenPro={() => setCurrentView('pro')}
          onBack={() => setCurrentView('home')}
          onSessionLost={handleSessionLost}
          onDateSelect={(date) => {
            setSelectedCategory(null);
            setCalendarSelectedDate(date);
            setCurrentView('tasks');
          }}
          onNewTask={(date) => {
            setReturnViewAfterEdit('calendar');
            setEditingTask(null);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          onEditTask={(task, date) => {
            setReturnViewAfterEdit('calendar');
            setEditingTask(task);
            setViewingDate(date);
            setCurrentView('edit-task');
          }}
          tasks={tasks}
          categories={categories}
        />
      );
    }

    if (currentView === 'categories') {
      return (
        <CategoriesView
          userId={userId}
          darkMode={isDarkMode}
          isPro={isPro}
          onOpenPro={() => setCurrentView('pro')}
          onBack={() => setCurrentView('home')}
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            setReturnViewAfterCategory('categories');
            setCurrentView('category');
          }}
          tasks={tasks}
          onRefreshTasks={loadTasks}
          categories={categories}
          onRefreshCategories={loadCategories}
        />
      );
    }

    return (
      <HomeView
        darkMode={isDarkMode}
        isPro={isPro}
        onCategorySelect={(category) => {
          if (category === 'add-task') {
            setReturnViewAfterEdit('home');
            setEditingTask(null);
            setCurrentView('edit-task');
          } else if (category === 'categories') {
            setCurrentView('categories');
          } else {
            setSelectedCategory(category);
            setReturnViewAfterCategory('home');
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
        tasks={tasks}
        categories={categories}
      />
    );
  };

  return (
    <LocaleProvider>
      <div className="main-content-pad flex flex-col flex-1 min-h-screen bg-white dark:bg-[#0f172a]">
        <AppDrawer
          open={drawerOpen}
          darkMode={isDarkMode}
          currentView={currentView}
          onNavigate={handleDrawerNavigate}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          {renderCurrentView()}
        </div>
        {showBottomNav && (
          <BottomNav
            currentView={currentView}
            onNavigate={handleBottomNav}
            darkMode={isDarkMode}
            visibleTabs={isPro ? visibleNavTabs : undefined}
          />
        )}
        {pomodoroTask && (
          <PomodoroTimer
            task={pomodoroTask}
            isPro={isPro}
            userId={userId}
            onClose={() => setPomodoroTask(null)}
          />
        )}
      </div>
    </LocaleProvider>
  );
}
