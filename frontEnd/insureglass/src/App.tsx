/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ViewState } from './types.ts';
import SignupView from './components/views/SignupView.tsx';
import LoginView from './components/views/LoginView.tsx';
import CoverageView from './components/views/CoverageView.tsx';
import UploadView from './components/views/UploadView.tsx';
import AssistantView from './components/views/AssistantView.tsx';

export default function App() {
  const [view, setView] = useState<ViewState>('signup');

  const renderView = () => {
    switch (view) {
      case 'signup':
        return <SignupView onNavigate={setView} />;
      case 'login':
        return <LoginView onNavigate={setView} />;
      case 'coverage':
        return <CoverageView onNavigate={setView} />;
      case 'upload':
        return <UploadView onNavigate={setView} />;
      case 'assistant':
        return <AssistantView />;
      default:
        return <SignupView onNavigate={setView} />;
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
