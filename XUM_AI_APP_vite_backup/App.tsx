
import React, { useState, useEffect } from 'react';
import { ScreenName } from './types';
import { SplashScreen, OnboardingScreen, AuthScreen, ForgotPasswordScreen, OTPScreen } from './screens/AuthScreens';
import {
  HomeScreen,
  WalletScreen,
  ProfileScreen,
  LeaderboardScreen,
  SubmissionTrackerScreen,
  SettingsScreen,
  NotificationsScreen,
  WithdrawScreen,
  ReferralScreen,
  SupportScreen
} from './screens/DashboardScreens';
import {
  TaskMarketplaceScreen,
  TaskDetailsScreen,
  CreateTaskScreen,
  CaptureAudioScreen,
  MediaCaptureScreen,
  CaptureChoiceScreen,
  HybridCaptureScreen,
  LinguasenseScreen,
  LanguageTaskRunnerScreen,
  TextInputTaskScreen,
  ValidationTaskScreen,
  TaskSubmissionScreen,
  TaskSuccessScreen,
  XUMJudgeTaskScreen,
  RLHFCorrectionTaskScreen,
  CaptureVideoScreen
} from './screens/TaskScreens';
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  UserManagementScreen,
  TaskModerationScreen,
  AdminPayoutsScreen
} from './screens/AdminScreens';
import { UserProvider, useUser } from './contexts/UserContext';

const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    primary: '#1349ec',
    bg: '#101522',
    surface: '#1e2330',
    cardGradient: 'linear-gradient(135deg, #1349ec 0%, #4338ca 100%)'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#10b981',
    bg: '#061a14',
    surface: '#0a2920',
    cardGradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'
  },
  {
    id: 'solar',
    name: 'Solar',
    primary: '#f59e0b',
    bg: '#1a1605',
    surface: '#2a2408',
    cardGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
  },
  {
    id: 'amoled',
    name: 'Amoled',
    primary: '#ffffff',
    bg: '#000000',
    surface: '#111111',
    cardGradient: 'linear-gradient(135deg, #333333 0%, #000000 100%)'
  },
  {
    id: 'night',
    name: 'Night',
    primary: '#94a3b8',
    bg: '#0f172a',
    surface: '#1e293b',
    cardGradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)'
  },
  {
    id: 'crimson',
    name: 'Crimson',
    primary: '#ef4444',
    bg: '#1a0505',
    surface: '#2a0808',
    cardGradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)'
  },
];

function AppContent() {
  const { user, profile, refreshProfile } = useUser();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.SPLASH);
  const [selectedEngine, setSelectedEngine] = useState<'grounding' | 'synthesis' | 'audit'>('grounding');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeThemeId, setActiveThemeId] = useState('midnight');

  const [history, setHistory] = useState([
    { title: "Task Reward: Image Labeling", date: "Today, 10:42 AM", amount: "+$2.50", type: "earn", icon: "image_search", color: "blue" },
    { title: "Withdrawal to PayPal", date: "Yesterday", amount: "-$100.00", type: "withdraw", icon: "arrow_outward", color: "red" },
    { title: "Quality Bonus", date: "Nov 12", amount: "+$5.00", type: "earn", icon: "award_star", color: "purple" }
  ]);

  // Sync navigation with auth state
  // PROTOTYPE MODE: Auth bypassed for demo purposes
  // TODO: Re-enable auth enforcement before production
  useEffect(() => {
    // For prototyping, always allow navigation after splash
    if (currentScreen === ScreenName.SPLASH) {
      // Auto-navigate to home after splash for demo
      const timer = setTimeout(() => {
        setCurrentScreen(ScreenName.HOME);
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Auth enforcement disabled for prototype
    // if (!user && ![ScreenName.SPLASH, ScreenName.AUTH, ScreenName.ONBOARDING, ScreenName.FORGOT_PASSWORD, ScreenName.OTP_VERIFICATION].includes(currentScreen)) {
    //   setCurrentScreen(ScreenName.AUTH);
    // }
  }, [currentScreen]);

  // Global style injection logic
  useEffect(() => {
    const theme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    const styleId = 'xum-theme-overrides';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --primary-theme: ${theme.primary};
        --bg-custom-dark: ${theme.bg};
        --surface-custom-dark: ${theme.surface};
        --card-gradient: ${theme.cardGradient};
      }
      .bg-primary { background-color: var(--primary-theme) !important; }
      .text-primary { color: var(--primary-theme) !important; }
      .border-primary { border-color: var(--primary-theme) !important; }
      .theme-card-gradient { background: var(--card-gradient) !important; }
      
      .dark body, .dark #root > div, .dark .bg-background-dark { background-color: var(--bg-custom-dark) !important; }
      .dark .bg-surface-dark { background-color: var(--surface-custom-dark) !important; }
    `;

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeThemeId, isDarkMode]);

  const navigate = (screen: ScreenName, engineType?: 'grounding' | 'synthesis' | 'audit') => {
    window.scrollTo(0, 0);
    if (engineType) setSelectedEngine(engineType);
    setCurrentScreen(screen);
  };

  const handleWithdraw = async (amount: number, method: string) => {
    await refreshProfile();
    const newEntry = {
      title: `Withdrawal to ${method.charAt(0).toUpperCase() + method.slice(1)}`,
      date: "Just now",
      amount: `-$${amount.toFixed(2)}`,
      type: "withdraw",
      icon: "arrow_outward",
      color: "red"
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const handleCompleteTask = async (reward: number, xp: number) => {
    await refreshProfile();
    const newEntry = {
      title: `Task Reward: Mission Sync`,
      date: "Just now",
      amount: `+$${reward.toFixed(2)}`,
      type: "earn",
      icon: "verified",
      color: "emerald"
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const renderScreen = () => {
    const commonProps = {
      onNavigate: navigate,
      balance: profile?.balance ?? 0,
      history,
      isDarkMode,
      setIsDarkMode,
      activeThemeId,
      setActiveThemeId,
      themes: THEMES,
      profile
    };

    switch (currentScreen) {
      case ScreenName.SPLASH:
        return <SplashScreen onNavigate={navigate} />;
      case ScreenName.ONBOARDING:
        return <OnboardingScreen onNavigate={navigate} />;
      case ScreenName.AUTH:
        return <AuthScreen onNavigate={navigate} />;
      case ScreenName.FORGOT_PASSWORD:
        return <ForgotPasswordScreen onNavigate={navigate} />;
      case ScreenName.OTP_VERIFICATION:
        return <OTPScreen onNavigate={navigate} />;

      // User Flow
      case ScreenName.HOME:
        return <HomeScreen {...commonProps} />;
      case ScreenName.WALLET:
        return <WalletScreen {...commonProps} />;
      case ScreenName.PROFILE:
        return <ProfileScreen {...commonProps} />;
      case ScreenName.LEADERBOARD:
        return <LeaderboardScreen {...commonProps} />;
      case ScreenName.SUBMISSION_TRACKER:
        return <SubmissionTrackerScreen {...commonProps} />;
      case ScreenName.SETTINGS:
        return <SettingsScreen {...commonProps} />;
      case ScreenName.NOTIFICATIONS:
        return <NotificationsScreen {...commonProps} />;
      case ScreenName.SUPPORT:
        return <SupportScreen {...commonProps} />;
      case ScreenName.WITHDRAW:
        return <WithdrawScreen {...commonProps} onConfirm={handleWithdraw} />;
      case ScreenName.REFERRALS:
        return <ReferralScreen onNavigate={navigate} />;
      case ScreenName.TASK_MARKETPLACE:
        return <TaskMarketplaceScreen onNavigate={navigate} />;
      case ScreenName.TASK_DETAILS:
        return <TaskDetailsScreen onNavigate={navigate} />;
      case ScreenName.CREATE_TASK:
        return <CreateTaskScreen onNavigate={navigate} />;
      case ScreenName.CAPTURE_CHOICE:
        return <CaptureChoiceScreen onNavigate={navigate} />;
      case ScreenName.CAPTURE_AUDIO:
        return <CaptureAudioScreen onNavigate={navigate} onCompleteTask={handleCompleteTask} />;
      case ScreenName.MEDIA_CAPTURE:
        return <MediaCaptureScreen onNavigate={navigate} onCompleteTask={handleCompleteTask} />;
      case ScreenName.HYBRID_CAPTURE:
        return <HybridCaptureScreen {...commonProps} onCompleteTask={handleCompleteTask} />;
      case ScreenName.CAPTURE_VIDEO:
        return <CaptureVideoScreen {...commonProps} onCompleteTask={handleCompleteTask} />;
      case ScreenName.LINGUASENSE:
        return <LinguasenseScreen onNavigate={navigate} />;
      case ScreenName.LANGUAGE_RUNNER:
        return <LanguageTaskRunnerScreen onNavigate={navigate} onCompleteTask={handleCompleteTask} engineType={selectedEngine} />;
      case ScreenName.TEXT_INPUT_TASK:
        return <TextInputTaskScreen onNavigate={navigate} onCompleteTask={handleCompleteTask} />;
      case ScreenName.VALIDATION_TASK:
        return <ValidationTaskScreen onNavigate={navigate} />;
      case ScreenName.TASK_SUBMISSION:
        return <TaskSubmissionScreen onNavigate={navigate} />;
      case ScreenName.TASK_SUCCESS:
        return <TaskSuccessScreen onNavigate={navigate} />;
      case ScreenName.XUM_JUDGE:
        return <XUMJudgeTaskScreen onNavigate={navigate} />;
      case ScreenName.RLHF_CORRECTION:
        return <RLHFCorrectionTaskScreen onNavigate={navigate} />;

      // Admin Flow Navigation Cases
      case ScreenName.ADMIN_LOGIN:
        return <AdminLoginScreen onNavigate={navigate} />;
      case ScreenName.ADMIN_DASHBOARD:
        return <AdminDashboardScreen onNavigate={navigate} />;
      case ScreenName.ADMIN_USER_MANAGEMENT:
        return <UserManagementScreen onNavigate={navigate} />;
      case ScreenName.ADMIN_TASK_MODERATION:
        return <TaskModerationScreen onNavigate={navigate} />;
      case ScreenName.ADMIN_PAYOUTS:
        return <AdminPayoutsScreen onNavigate={navigate} />;

      default:
        return <HomeScreen {...commonProps} />;
    }
  };

  return (
    <div className="font-display text-slate-900 dark:text-white bg-background-light dark:bg-background-dark min-h-screen max-w-md md:max-w-5xl lg:max-w-6xl mx-auto md:shadow-2xl overflow-hidden relative transition-all duration-500">
      {renderScreen()}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
