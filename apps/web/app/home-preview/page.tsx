'use client';

import { useState } from 'react';

// Seçenek 1: Dashboard Overview - Stats ve Quick Actions
function Option1_DashboardOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Welcome! 👋</h1>
          <p className="text-emerald-50 text-sm">Ready to organize your day?</p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
            <div className="text-3xl font-bold text-emerald-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Tasks Today</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
            <div className="text-3xl font-bold text-teal-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 text-left flex items-center justify-between shadow-lg hover:shadow-xl transition-all">
              <div>
                <div className="font-semibold">+ Add Task</div>
                <div className="text-sm text-emerald-50">Create a new task</div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button className="w-full bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl p-4 text-left flex items-center justify-between hover:bg-emerald-50 transition-all">
              <div>
                <div className="font-semibold">View Categories</div>
                <div className="text-sm text-gray-600">Organize by type</div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white rounded-xl p-4 border-2 border-emerald-100 hover:border-emerald-300 transition-all text-left">
              <div className="text-2xl mb-2">🏃</div>
              <div className="font-semibold text-gray-900">Rutinler</div>
              <div className="text-xs text-gray-500 mt-1">0 tasks</div>
            </button>
            <button className="bg-white rounded-xl p-4 border-2 border-emerald-100 hover:border-emerald-300 transition-all text-left">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-gray-900">Okuma Listesi</div>
              <div className="text-xs text-gray-500 mt-1">0 tasks</div>
            </button>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-600 text-sm mb-4">Start by creating your first task to get organized!</p>
          <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// Seçenek 2: Enhanced Category Cards - Görsel ve Açıklamalı
function Option2_EnhancedCategories() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100 px-6 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 text-sm mt-1">Organize your tasks by type</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-2">You're all set! 🎉</h2>
          <p className="text-emerald-50 text-sm">Choose a category to start organizing your tasks</p>
        </div>

        {/* Category Cards */}
        <div className="space-y-4 mb-6">
          <button className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                🏃
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Rutinler</h3>
                <p className="text-sm text-gray-600 mb-2">Daily routines and habits</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>0 tasks</span>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                📚
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Okuma Listesi</h3>
                <p className="text-sm text-gray-600 mb-2">Books and articles to read</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>0 tasks</span>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Add Category Button */}
        <button className="w-full bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-6 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-emerald-600 font-medium">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Category</span>
        </button>
      </div>
    </div>
  );
}

// Seçenek 3: Quick Start - Task Ekleme Odaklı
function Option3_QuickStart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Let's get started! 🚀</h1>
          <p className="text-emerald-50 text-sm">Create your first task in seconds</p>
        </div>
      </div>

      {/* Quick Add Task */}
      <div className="max-w-md mx-auto w-full px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Task</h2>
          <input
            type="text"
            placeholder="What do you need to do?"
            className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 mb-4"
          />
          <div className="flex gap-2 mb-4">
            <button className="flex-1 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors">
              Today
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Tomorrow
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Later
            </button>
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
            Add Task
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-md mx-auto w-full px-6 py-8 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Or browse by category</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white rounded-xl p-4 border-2 border-emerald-100 hover:border-emerald-300 transition-all text-center">
            <div className="text-3xl mb-2">🏃</div>
            <div className="font-semibold text-gray-900 text-sm">Rutinler</div>
          </button>
          <button className="bg-white rounded-xl p-4 border-2 border-emerald-100 hover:border-emerald-300 transition-all text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold text-gray-900 text-sm">Okuma Listesi</div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-white rounded-xl p-4 border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Tip</h3>
              <p className="text-sm text-gray-600">You can organize tasks by categories for better structure. Try creating a routine task!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Seçenek 4: Welcome Dashboard - Hoş Geldin + Özellikler
function Option4_WelcomeDashboard() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome! 🎉</h1>
          <p className="text-emerald-50">You're ready to organize your day</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Setup Complete!</h2>
              <p className="text-sm text-gray-600">Let's start organizing</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Categories</h2>
          <div className="space-y-3">
            <button className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  🏃
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rutinler</div>
                  <div className="text-xs text-gray-500">0 tasks</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  📚
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Okuma Listesi</div>
                  <div className="text-xs text-gray-500">0 tasks</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex gap-2">
            <button className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm">
              + Add Task
            </button>
            <button className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm">
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ana Component
export default function HomePreview() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (selectedOption === 1) return <Option1_DashboardOverview />;
  if (selectedOption === 2) return <Option2_EnhancedCategories />;
  if (selectedOption === 3) return <Option3_QuickStart />;
  if (selectedOption === 4) return <Option4_WelcomeDashboard />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Home Screen Options</h1>
        <p className="text-center text-gray-600 mb-12">After onboarding completion - Choose an option to preview</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(1)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">1. Dashboard Overview</h3>
              <p className="text-gray-600 text-sm mb-4">Stats cards, quick actions, and empty state. Perfect for showing progress.</p>
              <div className="text-xs text-gray-500">✓ Stats display<br/>✓ Quick actions<br/>✓ Category grid<br/>✓ Empty state</div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(2)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">2. Enhanced Categories</h3>
              <p className="text-gray-600 text-sm mb-4">Beautiful category cards with icons, descriptions, and task counts.</p>
              <div className="text-xs text-gray-500">✓ Visual category cards<br/>✓ Icons & descriptions<br/>✓ Task counts<br/>✓ Welcome message</div>
            </div>
          </div>

          {/* Option 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(3)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">3. Quick Start</h3>
              <p className="text-gray-600 text-sm mb-4">Task creation focused. Get users started immediately with quick add.</p>
              <div className="text-xs text-gray-500">✓ Quick add form<br/>✓ Date shortcuts<br/>✓ Category grid<br/>✓ Helpful tips</div>
            </div>
          </div>

          {/* Option 4 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(4)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">4. Welcome Dashboard</h3>
              <p className="text-gray-600 text-sm mb-4">Clean welcome screen with setup confirmation and category list.</p>
              <div className="text-xs text-gray-500">✓ Welcome message<br/>✓ Setup confirmation<br/>✓ Category list<br/>✓ Quick actions</div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Click on any option above to preview it</p>
          <button
            onClick={() => setSelectedOption(null)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Selection
          </button>
        </div>
      </div>
    </div>
  );
}
