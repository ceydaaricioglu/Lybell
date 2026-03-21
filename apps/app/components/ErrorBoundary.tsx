'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
          <p className="text-stone-700 font-medium mb-2">Sayfa yüklenemedi</p>
          <p className="text-stone-500 text-sm text-center mb-4">
            Tarayıcı konsolunda (F12) hata detayını görebilirsin.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
          >
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
