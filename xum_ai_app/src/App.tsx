/**
 * XUM AI - Main Application Entry Point
 * 
 * This is a hybrid React Native / React Native Web application that serves as
 * the contributor interface for the XUM AI data labeling platform.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import { ScreenName } from './types';

// Import Auth Screens (Pure React Native - APK compatible)
import {
  SplashScreen as AuthSplashScreen,
  OnboardingScreen as AuthOnboardingScreen,
  AuthScreen,
  ForgotPasswordScreen,
  OTPScreen,
} from './screens/AuthScreensNative';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { XumJudgeScreen } from './screens/XumJudgeScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SupportScreen } from './screens/SupportScreen';
import { VoiceTaskScreen } from './screens/tasks/VoiceTaskScreen';
import { ImageTaskScreen } from './screens/tasks/ImageTaskScreen';
import { VideoTaskScreen } from './screens/tasks/VideoTaskScreen';
import { ValidationTaskScreen } from './screens/tasks/ValidationTaskScreen';
import { RLHFCorrectionScreen } from './screens/tasks/RLHFCorrectionScreen';
import { SafetyScoringScreen } from './screens/tasks/SafetyScoringScreen';
import { CulturalAppropriatenessScreen } from './screens/tasks/CulturalAppropriatenessScreen';
import { LexiconTaskScreen } from './screens/tasks/LexiconTaskScreen';
import { ReferralsScreen } from './screens/ReferralsScreen';
import { SubmissionTrackerScreen } from './screens/SubmissionTrackerScreen';
import { SubmissionValidationScreen } from './screens/tasks/SubmissionValidationScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AccountTypeScreen, getAccountType, clearAccountType } from './screens/AccountTypeScreen';
import { CompanyDashboardScreen } from './screens/CompanyDashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PaymentMethodsScreen } from './screens/PaymentMethodsScreen';
import { EnvironmentalSensingScreen } from './screens/EnvironmentalSensingScreen';
import { LinguaSenseEngineScreen } from './screens/LinguaSenseEngineScreen';
import { AppearanceLabsScreen } from './screens/AppearanceLabsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  UserManagementScreen,
  TaskModerationScreen,
  AdminPayoutsScreen,
  AdminCampaignScreen,
  AdminAuditLogsScreen,
  AdminFraudDetectionScreen,
  AdminSessionsScreen,
  AdminLexiconOrchestratorScreen,
  AdminMarketplaceManagementScreen,
} from './screens/AdminScreens';
import { LinguasenseScreen, LanguageTaskRunnerScreen } from './screens/TaskScreens';
import { SkillSetupScreen } from './screens/SkillSetupScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen'; // New
import { InterestedTasksScreen } from './screens/InterestedTasksScreen'; // New
import { PromptGeniusScreen } from './screens/PromptGeniusScreen'; // New
import { GapDashboardScreen } from './screens/GapDashboardScreen'; // New
import { DatasetSalesScreen } from './screens/DatasetSalesScreen';
import { TaskService } from './services/taskService';
import { Transaction } from './services/types';
import { getUserBalance, getTransactionHistory } from './services/walletService';
import { NotificationService } from './services/notificationService';
import { useAppStore } from './store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ThemeContext,
  ThemeId,
  ThemeColors,
  themePresets,
  useTheme,
  ThemeContextType,
} from './context/ThemeContext';
import { useAppFonts } from './config/fonts';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://b1bafa6378c923d2378b8133968da701@o4511044278222848.ingest.de.sentry.io/4511044285562960',
  debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

import { TaskMarketplaceScreen } from './screens/TaskMarketplaceScreen';
import { ContributorHubModal } from './components/ContributorHubModal';
import { NeuralInputModal } from './components/NeuralInputModal';
import { SPACING, TYPOGRAPHY, LAYOUT, SHADOWS } from './constants/designTokens';
import { ClerkProvider } from './context/ClerkProvider';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { normalizeScreen } from './navigation/taskRouting';

// Legacy support - will be replaced by context
let colors: ThemeColors = themePresets.midnight;

// ============================================================================
// TYPES
// ============================================================================

// ScreenName is imported from types.ts
// Transaction type imported from TaskService
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

// XumJudgeItems removed (unused in App.tsx)

// ============================================================================
// SPLASH SCREEN
// ============================================================================

// SplashScreen removed (imported from AuthScreensNative)

// ============================================================================
// ONBOARDING SCREEN
// ============================================================================

// OnboardingScreen removed (imported from AuthScreensNative)

// ============================================================================
// SCREENS NOW IMPORTED FROM EXTERNAL FILES
// HomeScreen, SettingsScreen, EnvironmentalSensingScreen, LinguaSenseEngineScreen, AppearanceLabsScreen
// ============================================================================

// ============================================================================
// CONTRIBUTOR HUB MODAL
// ============================================================================

// ContributorHubModal removed (imported from components)

// ============================================================================
// NEURAL INPUT MODAL - Redesigned with better UX
// ============================================================================

// NeuralInputModal removed (imported from components)


// ============================================================================
// WALLET SCREEN (REDESIGN PER IMAGE 4)
// ============================================================================

// WalletScreen moved to external file

// ============================================================================
// BOTTOM NAVIGATION COMPONENT
// ============================================================================

// BottomNavigation removed (unused in App.tsx)

// ============================================================================
// SETTINGS SCREEN - Redesigned with user-friendly language
// ============================================================================

// SettingsScreen removed (imported from screens/SettingsScreen)

// ============================================================================
// TASK MARKETPLACE SCREEN
// ============================================================================

// TaskMarketplaceScreen removed (imported from screens/TaskMarketplaceScreen)

// ============================================================================
// VOICE TASK SCREEN
// ============================================================================

// Inline task screens removed as they are now imported from ./screens/tasks/


// ============================================================================
// SIMPLE PLACEHOLDER SCREENS
// ============================================================================

// ============================================================================
// LEADERBOARD SCREEN
// ============================================================================

// LeaderboardScreen, XumJudgeScreen, and RecordsScreen moved to external files

// PlaceholderScreen removed (unused/duplicate)

// ============================================================================
// ERROR BOUNDARY - Catches render crashes and shows a visible error screen
// ============================================================================



// ============================================================================
// MAIN APP
// ============================================================================

function App() {
  // Load custom fonts
  const fontsLoaded = useAppFonts();

  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.SPLASH);
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [isNeuralInputVisible, setIsNeuralInputVisible] = useState(false);
  const [isContributorHubVisible, setIsContributorHubVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [currentTheme, setCurrentTheme] = useState<ThemeId>('midnight');

  // Load theme from storage
  useEffect(() => {
    AsyncStorage.getItem('themeId').then(themeId => {
      if (themeId && themePresets[themeId as ThemeId]) {
        setCurrentTheme(themeId as ThemeId);
        colors = themePresets[themeId as ThemeId]; // Update legacy colors
      }
    });
  }, []);

  // Handle Deep Linking (Magic Links / Password Reset)
  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      console.log('[Linking] Deep link received:', url);
      if (!url) return;
      const parsed = Linking.parse(url);
      console.log('[Linking] Parsed deep link:', parsed);

      if (parsed.path === 'auth-callback' || parsed.path === 'oauth-native-callback' || url.includes('access_token=')) {
        console.log('[Linking] Recognized auth callback path');
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));

    return () => subscription.remove();
  }, []);

  const navigate = (screen: ScreenName, params?: any) => {
    const resolvedScreen = normalizeScreen(screen, params?.taskType || params?.task_type);

    // Prevent pushing duplicate screens or pushing HOME
    if (resolvedScreen === ScreenName.HOME || resolvedScreen === ScreenName.COMPANY_DASHBOARD) {
      setHistory([]);
    } else if (currentScreen !== resolvedScreen && currentScreen !== ScreenName.SPLASH && currentScreen !== ScreenName.ONBOARDING) {
      setHistory(prev => [...prev, currentScreen]);
    }

    setCurrentScreen(resolvedScreen);
    setNavigationParams(params || null);
    setIsNeuralInputVisible(false);
    setIsContributorHubVisible(false);
    if (params?.email) setUserEmail(params.email);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentScreen(prev);
    } else {
      // Default fallback
      setCurrentScreen(ScreenName.HOME);
    }
  };

  const handleThemeChange = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    colors = themePresets[themeId]; // Update legacy colors
    AsyncStorage.setItem('themeId', themeId);
  };

  // Get current theme colors for dynamic styling
  const theme = themePresets[currentTheme];

  // Theme context value
  const themeContextValue: ThemeContextType = {
    theme,
    themeId: currentTheme,
    setTheme: handleThemeChange,
    tokens: {
      spacing: SPACING,
      typography: TYPOGRAPHY,
      layout: LAYOUT,
      shadows: SHADOWS,
    }
  };

  // Render the component
  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <ClerkProvider>
        <ThemeContext.Provider value={themeContextValue}>
          <AppContent
            currentScreen={currentScreen}
            navigate={navigate}
            history={history}
            isNeuralInputVisible={isNeuralInputVisible}
            setIsNeuralInputVisible={setIsNeuralInputVisible}
            isContributorHubVisible={isContributorHubVisible}
            setIsContributorHubVisible={setIsContributorHubVisible}
            userEmail={userEmail}
            currentTheme={currentTheme}
            handleThemeChange={handleThemeChange}
            goBack={goBack}
            navigationParams={navigationParams}
          />
        </ThemeContext.Provider>
      </ClerkProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(App);

/**
 * Sub-component to use Clerk hooks inside ClerkProvider
 */
const AppContent = ({
  currentScreen,
  navigate,
  history,
  isNeuralInputVisible,
  setIsNeuralInputVisible,
  isContributorHubVisible,
  setIsContributorHubVisible,
  userEmail,
  currentTheme,
  handleThemeChange,
  goBack,
  navigationParams
}: any) => {
  const { theme } = useTheme();

  // Clerk auth state
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Global App Store sync
  const setUserId = useAppStore(state => state.setUserId);
  const setGlobalEmail = useAppStore(state => state.setUserEmail);
  const setWalletBalance = useAppStore(state => state.setWalletBalance);

  useEffect(() => {
    if (clerkUser) {
      setUserId(clerkUser.id);
      setGlobalEmail(clerkUser.primaryEmailAddress?.emailAddress || null);
    } else {
      setUserId(null);
      setGlobalEmail(null);
    }

    // Also load account type on mount if logged in
    getAccountType().then(type => {
      if (type) setAccountType(type);
    });
  }, [clerkUser]);

  // Balance & transaction state (loaded using Clerk user ID)
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [accountType, setAccountType] = useState<'user' | 'company' | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  // Map Clerk user to a session-compatible format for screens
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    full_name: clerkUser.fullName || clerkUser.firstName || '',
    avatar_url: clerkUser.imageUrl || null,
    created_at: clerkUser.createdAt?.toISOString() || null,
  } : null;

  // Navigate to ACCOUNT_TYPE_SELECT (or stored preference) when Clerk auth state becomes signed in
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && (
      currentScreen === ScreenName.AUTH ||
      currentScreen === ScreenName.OTP_VERIFICATION ||
      currentScreen === ScreenName.SPLASH
    )) {
      // Check if user previously chose an account type
      getAccountType().then((savedType) => {
        setAccountType(savedType);
        if (savedType === 'company') {
          navigate(ScreenName.COMPANY_DASHBOARD);
        } else if (savedType === 'user') {
          navigate(ScreenName.HOME);
        } else {
          navigate(ScreenName.ACCOUNT_TYPE_SELECT);
        }
      });
    }
  }, [isSignedIn, isLoaded, currentScreen]);

  // Load Balance & Transactions using Clerk user ID
  useEffect(() => {
    if (!clerkUser?.id) return;

    const loadWalletData = async () => {
      const [userBalance, history] = await Promise.all([
        getUserBalance(clerkUser.id),
        getTransactionHistory(clerkUser.id)
      ]);
      setBalance(userBalance);
      setWalletBalance(userBalance);
      setTransactions(history);
    };

    loadWalletData();

    // Set up real-time listener for balance
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${clerkUser.id}` },
        () => loadWalletData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clerkUser?.id]);

  // ---- Push Notification Setup ----
  useEffect(() => {
    if (!clerkUser?.id || !isSignedIn) return;

    let receivedSub: any;
    let responseSub: any;

    const setupNotifications = async () => {
      // Register for push notifications and get token
      const token = await NotificationService.registerForPushNotifications();
      if (token) {
        pushTokenRef.current = token;
        await NotificationService.savePushToken(clerkUser.id, token);
      }

      // Load initial unread count
      const count = await NotificationService.getUnreadCount(clerkUser.id);
      setUnreadNotifications(count);
      await NotificationService.setBadgeCount(count);

      // Listen for notifications received while app is open
      receivedSub = NotificationService.addNotificationReceivedListener(async () => {
        const newCount = await NotificationService.getUnreadCount(clerkUser.id);
        setUnreadNotifications(newCount);
        await NotificationService.setBadgeCount(newCount);
      });

      // Listen for notification taps and action button presses
      responseSub = NotificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        const actionId = response.actionIdentifier;

        // Handle interactive action buttons
        switch (actionId) {
          case 'accept':
            navigate(ScreenName.TASK_MARKETPLACE);
            return;
          case 'view_wallet':
            navigate(ScreenName.WALLET);
            return;
          case 'view':
            if (data?.screen && ScreenName[data.screen as keyof typeof ScreenName]) {
              navigate(ScreenName[data.screen as keyof typeof ScreenName]);
            } else {
              navigate(ScreenName.NOTIFICATIONS);
            }
            return;
        }

        // Default tap on notification body
        if (data?.screen && ScreenName[data.screen as keyof typeof ScreenName]) {
          navigate(ScreenName[data.screen as keyof typeof ScreenName]);
        } else {
          navigate(ScreenName.NOTIFICATIONS);
        }
      });

      // Check if app was opened via notification
      const lastResponse = await NotificationService.getLastNotificationResponse();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data;
        if (data?.screen && ScreenName[data.screen as keyof typeof ScreenName]) {
          navigate(ScreenName[data.screen as keyof typeof ScreenName]);
        }
      }
    };

    setupNotifications();

    // Subscribe to real-time notifications from Supabase (admin-sent)
    const notifChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${clerkUser.id}`,
        },
        async (payload: any) => {
          const n = payload.new;
          if (n && n.title) {
            // Trigger a local push notification so the user sees it immediately
            const category = n.category || 'general';
            let categoryIdentifier: string | undefined;
            let sound: string | undefined;

            if (category === 'task') { categoryIdentifier = 'task_invitation'; sound = 'task_alert.wav'; }
            if (category === 'payment') { categoryIdentifier = 'payment_received'; sound = 'payment_chime.wav'; }

            await NotificationService.sendLocalNotification(
              n.title,
              n.body,
              n.data || {},
              { categoryIdentifier, sound }
            );

            // Update unread badge
            const newCount = await NotificationService.getUnreadCount(clerkUser.id);
            setUnreadNotifications(newCount);
            await NotificationService.setBadgeCount(newCount);
          }
        }
      )
      .subscribe();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
      supabase.removeChannel(notifChannel);
    };
  }, [clerkUser?.id, isSignedIn]);

  // Handle logout with Clerk
  const handleLogout = async () => {
    try {
      // Deactivate push token before signing out
      if (clerkUser?.id && pushTokenRef.current) {
        await NotificationService.deactivatePushToken(clerkUser.id, pushTokenRef.current);
        pushTokenRef.current = null;
      }
      await NotificationService.clearBadge();

      // Full Reset: Clear all local storage
      await Promise.all([
        clearAccountType(),
        AsyncStorage.removeItem('onboarding_completed'),
        AsyncStorage.removeItem('themeId'),
      ]);

      await signOut();
      setUnreadNotifications(0);

      // Force return to splash for a completely fresh start
      navigate(ScreenName.SPLASH);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const renderScreen = () => {
    // If not loaded yet, show minimal splash/loading
    if (!isLoaded) {
      return (
        <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    switch (currentScreen) {
      case ScreenName.SPLASH:
        return <AuthSplashScreen onNavigate={navigate} />;
      case ScreenName.ONBOARDING:
        return <AuthOnboardingScreen onNavigate={navigate} />;
      case ScreenName.AUTH:
        // Use the COLOURFULL Auth Screen (retaining design)
        return <AuthScreen onNavigate={navigate} />;
      case ScreenName.FORGOT_PASSWORD:
        return <ForgotPasswordScreen onNavigate={navigate} />;
      case ScreenName.OTP_VERIFICATION:
        return <OTPScreen onNavigate={navigate} userEmail={userEmail} />;
      case ScreenName.ACCOUNT_TYPE_SELECT:
        return <AccountTypeScreen onNavigate={navigate} />;
      case ScreenName.SKILL_SETUP:
        return <SkillSetupScreen onNavigate={navigate} />;
      case ScreenName.LANGUAGE_SELECTION: {
        const prevScreen = history.length > 0 ? history[history.length - 1] : null;
        const isFromSettings = prevScreen === ScreenName.SETTINGS;
        return (
          <LanguageSelectionScreen
            onNavigate={navigate}
            isOnboarding={!isFromSettings}
          />
        );
      }
      case ScreenName.TASK_INTERESTS:
        return <InterestedTasksScreen onNavigate={navigate} />;
      case ScreenName.COMPANY_DASHBOARD:
        return <CompanyDashboardScreen onNavigate={navigate} onLogout={handleLogout} />;
      case ScreenName.HOME:
        return <HomeScreen onNavigate={navigate} balance={balance} onOpenNeuralInput={() => setIsNeuralInputVisible(true)} onOpenContributorHub={() => setIsContributorHubVisible(true)} session={{ user }} />;
      case ScreenName.WALLET:
        return <WalletScreen onNavigate={navigate} onBack={goBack} balance={balance} transactions={transactions} onOpenContributorHub={() => setIsContributorHubVisible(true)} onOpenNeuralInput={() => setIsNeuralInputVisible(true)} session={{ user }} accountType={accountType} />;
      case ScreenName.SETTINGS:
        return <SettingsScreen onNavigate={navigate} onLogout={handleLogout} onBack={goBack} />;
      case ScreenName.PROFILE:
        return <ProfileScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      case ScreenName.PAYMENT_METHODS:
        return <PaymentMethodsScreen onNavigate={navigate} onBack={goBack} />;
      case ScreenName.EDIT_PROFILE:
        return <EditProfileScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      case ScreenName.LEADERBOARD:
        return <LeaderboardScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      case ScreenName.XUM_JUDGE:
        return <XumJudgeScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.TASK_MARKETPLACE:
        return <TaskMarketplaceScreen onNavigate={navigate} onBack={goBack} onOpenNeuralInput={() => setIsNeuralInputVisible(true)} onOpenContributorHub={() => setIsContributorHubVisible(true)} session={{ user }} />;
      case ScreenName.ENVIRONMENTAL_SENSING:
        return <EnvironmentalSensingScreen onNavigate={navigate} />;
      case ScreenName.LINGUASENSE_ENGINE:
        return <LinguaSenseEngineScreen onNavigate={navigate} />;
      case ScreenName.LINGUASENSE:
        return <LinguasenseScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.LANGUAGE_RUNNER:
        return <LanguageTaskRunnerScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.VOICE_TASK:
        return <VoiceTaskScreen onNavigate={navigate} session={{ user }} campaignId={navigationParams?.campaignId} />;
      case ScreenName.IMAGE_TASK:
        return <ImageTaskScreen onNavigate={navigate} session={{ user }} campaignId={navigationParams?.campaignId} />;
      case ScreenName.VIDEO_TASK:
        return <VideoTaskScreen onNavigate={navigate} session={{ user }} campaignId={navigationParams?.campaignId} />;
      case ScreenName.NOTIFICATIONS:
        return <NotificationsScreen onNavigate={navigate} onBack={goBack} session={{ user }} onUnreadCountChange={setUnreadNotifications} />;
      case ScreenName.RECORDS:
        return <RecordsScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.SUPPORT:
        return <SupportScreen onNavigate={navigate} onBack={goBack} />;
      case ScreenName.APPEARANCE_LABS:
        return <AppearanceLabsScreen onNavigate={navigate} currentTheme={currentTheme} onThemeChange={handleThemeChange} />;
      case ScreenName.ADMIN_LOGIN:
        return <AdminLoginScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_DASHBOARD:
        return <AdminDashboardScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_USER_MANAGEMENT:
        return <UserManagementScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_TASK_MODERATION:
        return <TaskModerationScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_PAYOUTS:
        return <AdminPayoutsScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_CAMPAIGNS:
        return <AdminCampaignScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_AUDIT_LOGS:
        return <AdminAuditLogsScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_FRAUD_DETECTION:
        return <AdminFraudDetectionScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_SESSIONS:
        return <AdminSessionsScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_LEXICON:
        return <AdminLexiconOrchestratorScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.ADMIN_MARKETPLACE_MANAGEMENT:
        return <AdminMarketplaceManagementScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.VALIDATION_TASK_EXECUTION:
        return <ValidationTaskScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.RLHF_CORRECTION:
        return <RLHFCorrectionScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.SAFETY_SCORING:
        return <SafetyScoringScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.CULTURAL_APPROPRIATENESS:
        return <CulturalAppropriatenessScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.LEXICON_TASK:
        return <LexiconTaskScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.REFERRALS:
        return <ReferralsScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      case ScreenName.SUBMISSION_TRACKER:
        return <SubmissionTrackerScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      case ScreenName.SUBMISSION_VALIDATION:
        return <SubmissionValidationScreen onNavigate={navigate} session={{ user }} />;
      case ScreenName.PROMPT_GENIUS:
        return <PromptGeniusScreen onNavigate={navigate} />;
      case ScreenName.GAP_DASHBOARD:
        return <GapDashboardScreen onNavigate={navigate} />;
      case ScreenName.DATA_SALES:
        return <DatasetSalesScreen onNavigate={navigate} onBack={goBack} session={{ user }} />;
      default:
        return <HomeScreen onNavigate={navigate} balance={balance} onOpenNeuralInput={() => setIsNeuralInputVisible(true)} onOpenContributorHub={() => setIsContributorHubVisible(true)} session={{ user }} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {renderScreen()}
      <NeuralInputModal
        visible={isNeuralInputVisible}
        onClose={() => setIsNeuralInputVisible(false)}
        onNavigate={navigate}
      />
      <ContributorHubModal
        visible={isContributorHubVisible}
        onClose={() => setIsContributorHubVisible(false)}
        onNavigate={navigate}
        currentTheme={currentTheme}
        onLogout={handleLogout}
        unreadCount={unreadNotifications}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Splash
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  splashLogoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  splashLogoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.15,
    shadowColor: colors.primary,
    shadowRadius: 50,
    shadowOpacity: 1,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
    textAlign: 'center',
    marginLeft: 8,
  },
  splashLine: {
    width: 40,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginVertical: 24,
  },
  splashSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    fontWeight: '700',
  },
  splashFooter: {
    position: 'absolute',
    bottom: 50,
  },
  splashFooterText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },

  // Onboarding
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  onboardingLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onboardingContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  stepDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 40,
  },
  slideCard: {
    gap: 24,
  },
  slideIconBg: {
    width: 80,
    height: 80,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowRadius: 20,
    shadowOpacity: 0.3,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff', // Stays white because it's on a dark splash/gradient background
    lineHeight: 42,
  },
  slideDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 26,
    maxWidth: '90%',
  },
  onboardingFooter: {
    padding: 32,
    paddingBottom: 48,
  },
  onboardingButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 64,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  onboardingButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2.5,
  },

  // Header - Larger touch area, bolder title
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 3,
  },

  // Home Header - Larger, bolder welcome text
  homeHeader: {
    marginBottom: 28,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  agentText: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },

  // Stats - Larger cards with better hierarchy
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // Leaderboard Card - Redesigned
  networkCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
    minHeight: 180,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  avatarTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  leaderboardContent: {
    flex: 1,
  },
  networkBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  networkBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.5,
  },
  networkTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  leaderboardDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  networkNodeContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    alignItems: 'flex-end',
  },
  networkNodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  networkNodeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  rankChange: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Section - Better hierarchy
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

});
