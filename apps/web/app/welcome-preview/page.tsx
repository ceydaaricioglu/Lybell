'use client';

import { useState } from 'react';

// Öneri 1: Empty State + Quick Start
function Option1_EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome! 👋</h1>
        <p className="text-emerald-50">Let's get you started</p>
      </div>

      {/* Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Illustration */}
        <div className="mb-8">
          <div className="w-48 h-48 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl">
            <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Your tasks await</h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
          Start organizing your day by creating your first task. It only takes a moment!
        </p>

        {/* Quick Actions */}
        <div className="w-full max-w-md space-y-3">
          <button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            + Create Your First Task
          </button>
          <button className="w-full py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition-all">
            Explore Features
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 w-full max-w-md">
          <p className="text-sm text-gray-500 text-center mb-4">💡 Quick tip</p>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
            <p className="text-sm text-gray-700">
              You can organize tasks by categories like "Routines" and "Reading List" for better structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Öneri 2: Onboarding Slides
function Option2_OnboardingSlides() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      icon: (
        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Organize Everything",
      description: "Create tasks, set reminders, and keep track of your daily routines all in one place."
    },
    {
      icon: (
        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Plan Your Day",
      description: "Schedule tasks by date and time. View your timeline and never miss an important deadline."
    },
    {
      icon: (
        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "Stay Consistent",
      description: "Set recurring tasks for daily routines, weekly habits, or monthly goals."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex flex-col relative overflow-hidden">
      {/* Dekoratif öğeler */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Slide Content */}
        <div className="w-full max-w-md text-center mb-8">
          <div className="mb-8 flex justify-center">
            {slides[currentSlide].icon}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{slides[currentSlide].title}</h2>
          <p className="text-emerald-50 text-lg">{slides[currentSlide].description}</p>
        </div>

        {/* Dots Indicator */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-md flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={() => setCurrentSlide(currentSlide - 1)}
              className="flex-1 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              Previous
            </button>
          )}
          {currentSlide < slides.length - 1 ? (
            <button
              onClick={() => setCurrentSlide(currentSlide + 1)}
              className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Next
            </button>
          ) : (
            <button className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Öneri 3: Dashboard Overview
function Option3_DashboardOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Welcome back! 🎉</h1>
          <p className="text-emerald-50 text-sm">Ready to tackle your day?</p>
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

// Öneri 4: Guided Setup
function Option4_GuidedSetup() {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Choose Your Focus",
      description: "What would you like to organize first?",
      options: [
        { icon: "📚", label: "Reading List", color: "from-purple-400 to-pink-400" },
        { icon: "🏃", label: "Daily Routines", color: "from-blue-400 to-cyan-400" },
        { icon: "💼", label: "Work Tasks", color: "from-orange-400 to-red-400" },
        { icon: "🎯", label: "Personal Goals", color: "from-emerald-400 to-teal-400" }
      ]
    },
    {
      title: "Set Your Schedule",
      description: "When do you prefer to plan your day?",
      options: [
        { icon: "🌅", label: "Morning Person", color: "from-yellow-400 to-orange-400" },
        { icon: "🌆", label: "Evening Planner", color: "from-indigo-400 to-purple-400" },
        { icon: "🌙", label: "Flexible", color: "from-gray-400 to-gray-600" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white border-b border-emerald-100 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step + 1} of {steps.length}</span>
            <span className="text-sm font-medium text-emerald-600">{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">{steps[step].title}</h2>
          <p className="text-gray-600 text-center mb-8">{steps[step].description}</p>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {steps[step].options.map((option, index) => (
              <button
                key={index}
                className={`w-full p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all text-left flex items-center gap-4 hover:shadow-md`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <span className="font-semibold text-gray-900">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep(step + 1);
                } else {
                  alert('Setup complete!');
                }
              }}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {step < steps.length - 1 ? 'Continue' : 'Finish Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ana Component
export default function WelcomePreview() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (selectedOption === 1) return <Option1_EmptyState />;
  if (selectedOption === 2) return <Option2_OnboardingSlides />;
  if (selectedOption === 3) return <Option3_DashboardOverview />;
  if (selectedOption === 4) return <Option4_GuidedSetup />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Welcome Screen Options</h1>
        <p className="text-center text-gray-600 mb-12">Choose an option to preview</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(1)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">1. Empty State + Quick Start</h3>
              <p className="text-gray-600 text-sm mb-4">Simple, clean empty state with clear call-to-action. Perfect for first-time users.</p>
              <div className="text-xs text-gray-500">✓ Empty state illustration<br/>✓ Quick action buttons<br/>✓ Helpful tips</div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(2)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">2. Onboarding Slides</h3>
              <p className="text-gray-600 text-sm mb-4">Interactive slides introducing key features. Great for educating users.</p>
              <div className="text-xs text-gray-500">✓ Feature highlights<br/>✓ Slide navigation<br/>✓ Visual storytelling</div>
            </div>
          </div>

          {/* Option 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(3)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">3. Dashboard Overview</h3>
              <p className="text-gray-600 text-sm mb-4">Dashboard-style welcome with stats and quick actions. Ideal for returning users.</p>
              <div className="text-xs text-gray-500">✓ Stats cards<br/>✓ Quick actions<br/>✓ Empty state message</div>
            </div>
          </div>

          {/* Option 4 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setSelectedOption(4)}>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold mb-2 text-gray-900">4. Guided Setup</h3>
              <p className="text-gray-600 text-sm mb-4">Step-by-step setup wizard. Perfect for personalization and onboarding.</p>
              <div className="text-xs text-gray-500">✓ Progress indicator<br/>✓ Step-by-step flow<br/>✓ Customization options</div>
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
