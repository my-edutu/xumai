import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenName, Transaction, Theme, UserProfile, DashboardScreenProps } from '../types';
import { Header, BottomNav } from '../components/Shared';
import { supabase } from '../supabaseClient';

// ============================================================================
// SERVICES
// ============================================================================

interface WithdrawalResult {
  status: 'success' | 'error';
  id?: string;
  message?: string;
}

const WalletService = {
  requestWithdrawal: async (
    amount: number,
    method: string,
    details: Record<string, unknown>
  ): Promise<WithdrawalResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('request_withdrawal', {
        p_user_id: user.id,
        p_amount: amount,
        p_method: method,
        p_account_details: details
      });

      if (error) throw error;
      return { status: 'success', id: data };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Handshake rejected';
      console.error("Protocol error during liquidity transfer", e);
      return { status: 'error', message: errorMessage };
    }
  }
};

// ============================================================================
// TYPES
// ============================================================================

interface ScreenProps extends DashboardScreenProps {
  onConfirm?: (amount: number, method: string) => void;
}

const iconMap: Record<string, string> = {
  'account_balance_wallet': 'account-balance-wallet',
  'hourglass_top': 'hourglass-top',
  'public': 'public',
  'check_circle': 'check-circle',
  'gavel': 'gavel',
  'auto_fix_high': 'auto-fix-high',
  'image': 'image',
  'mic': 'mic',
  'description': 'description',
  'schedule': 'schedule',
  'bolt': 'bolt',
  'image_search': 'image-search',
  'arrow_outward': 'arrow-outward',
  'award_star': 'star',
  'translate': 'translate',
  'verified': 'verified',
  'payments': 'payments',
  'security': 'security',
  'add': 'add',
};

export const HomeScreen: React.FC<ScreenProps> = (props) => {
  const { onNavigate, balance, profile } = props;

  const judgeTasks = [
    { title: 'General Knowledge RLHF', reward: '250 XP', pay: '$1.20', icon: 'gavel', color: 'primary', screen: ScreenName.XUM_JUDGE },
    { title: 'Cultural Correction', reward: '400 XP', pay: '$2.50', icon: 'auto-fix-high', color: 'purple', screen: ScreenName.RLHF_CORRECTION }
  ];

  const quickTasks = [
    { id: '1', title: 'Street Sign Labeling', type: 'image', reward: '$0.50', xp: '25', time: '2m', icon: 'image' },
    { id: '2', title: 'Local Dialect Voice', type: 'audio', reward: '$1.25', xp: '50', time: '5m', icon: 'mic' },
    { id: '3', title: 'Sentiment Check', type: 'text', reward: '$0.15', xp: '10', time: '1m', icon: 'description' }
  ];

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="p-6 pt-14 bg-white/90 dark:bg-background-dark/90">
          <Text style={{ fontSize: Dimensions.get('window').width < 375 ? 18 : 22, fontWeight: '600', lineHeight: Dimensions.get('window').width < 375 ? 24 : 28, letterSpacing: -0.5 }} className="text-slate-900 dark:text-white">
            Welcome back,{' '}<Text className="text-primary font-bold">{profile?.full_name?.split(' ')[0] || 'Agent'}</Text>
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="px-4 gap-4">
          <View className="flex-row gap-4">
            <TouchableOpacity onPress={() => onNavigate(ScreenName.WALLET)} className="flex-1 p-6 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <MaterialIcons name="account-balance-wallet" size={20} color="#3b82f6" />
                </View>
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Earned</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">${balance?.toFixed(2)}</Text>
            </TouchableOpacity>

            <View className="flex-1 p-6 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                  <MaterialIcons name="hourglass-top" size={20} color="#f97316" />
                </View>
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Pending</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">$24.00</Text>
            </View>
          </View>

          {/* Network Status Card */}
          <TouchableOpacity onPress={() => onNavigate(ScreenName.LEADERBOARD)}>
            <LinearGradient colors={['#1349ec', '#4338ca']} style={{ borderRadius: 24, padding: 24, overflow: 'hidden' }}>
              <View className="absolute top-0 right-0 p-4 opacity-10">
                <MaterialIcons name="public" size={100} color="white" />
              </View>
              <View className="relative z-10">
                <View className="px-3 py-1 bg-white/20 rounded-full self-start mb-2">
                  <Text className="text-white text-[10px] font-semibold uppercase tracking-widest">Network Status</Text>
                </View>
                <Text className="text-xl text-white font-bold tracking-tight">Global Connectivity</Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <MaterialIcons name="check-circle" size={16} color="#34d399" />
                  <Text className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Operational</Text>
                </View>
              </View>
              <View className="absolute top-6 right-6">
                <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Current Node</Text>
                <Text className="text-white text-4xl font-bold">#142</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* XUM Judge Section */}
        <View className="mt-8 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">XUM Judge</Text>
            <TouchableOpacity onPress={() => onNavigate(ScreenName.TASK_MARKETPLACE)}>
              <Text className="text-xs font-bold text-primary uppercase tracking-widest">View more</Text>
            </TouchableOpacity>
          </View>
          <View className="gap-4">
            {judgeTasks.map((task, i) => (
              <TouchableOpacity key={i} onPress={() => onNavigate(task.screen)} className="flex-row items-center p-5 rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                  <MaterialIcons name={task.icon as any} size={24} color="#1349ec" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">{task.title}</Text>
                  <Text className="text-sm text-slate-500 mt-1">Linguistic Feedback Node</Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary font-bold text-lg">{task.pay}</Text>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{task.reward}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily Missions Section */}
        <View className="mt-8 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Daily Missions</Text>
            <TouchableOpacity onPress={() => onNavigate(ScreenName.TASK_MARKETPLACE)}>
              <Text className="text-xs font-bold text-primary uppercase tracking-widest">Browse all</Text>
            </TouchableOpacity>
          </View>
          <View className="gap-4">
            {quickTasks.map((task) => (
              <TouchableOpacity key={task.id} onPress={() => onNavigate(ScreenName.TASK_DETAILS)} className="flex-row items-center p-5 rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                <View className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
                  <MaterialIcons name={task.icon as any} size={24} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">{task.title}</Text>
                  <View className="flex-row items-center gap-3 mt-2">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="schedule" size={12} color="#94a3b8" />
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.time}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="bolt" size={12} color="#10b981" />
                      <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{task.xp} XP</Text>
                    </View>
                  </View>
                </View>
                <Text className="text-lg font-bold text-primary">{task.reward}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav currentScreen={ScreenName.HOME} {...props} />
    </View>
  );
};

// WalletScreen moved to src/screens/WalletScreen.tsx

// LeaderboardScreen moved to src/screens/LeaderboardScreen.tsx

// ProfileScreen moved to src/screens/ProfileScreen.tsx with premium redesign

export const WithdrawScreen: React.FC<ScreenProps> = ({ onNavigate, balance, onConfirm }) => {
  const [amount, setAmount] = useState(String(balance || 0));
  const [status, setStatus] = useState<'idle' | 'processing' | 'verifying' | 'success'>('idle');

  const startWithdraw = async () => {
    const numAmount = Number(amount);
    if (numAmount < 5.00) {
      alert("Minimum withdrawal threshold is $5.00");
      return;
    }
    if (numAmount > (balance || 0)) {
      alert("Insufficient liquidity in node balance.");
      return;
    }

    setStatus('processing');
    const result = await WalletService.requestWithdrawal(numAmount, 'paypal', { destination: 'User terminal' });

    if (result.status === 'success') {
      setStatus('verifying');
      setTimeout(() => {
        setStatus('success');
        onConfirm?.(numAmount, 'paypal');
      }, 2000);
    } else {
      setStatus('idle');
      alert(`Handshake Error: ${result.message}`);
    }
  };

  if (status !== 'idle') {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center p-8">
        {status === 'processing' && (
          <>
            <View className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary mb-6" />
            <Text className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-2">Processing</Text>
            <Text className="text-slate-500 font-bold text-sm uppercase tracking-widest">Initializing handshake protocol...</Text>
          </>
        )}
        {status === 'verifying' && (
          <>
            <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
              <MaterialIcons name="security" size={40} color="#1349ec" />
            </View>
            <Text className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-2">Verifying</Text>
            <Text className="text-slate-500 font-bold text-sm uppercase tracking-widest">Securing ledger entry...</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <View className="w-32 h-32 rounded-full bg-emerald-500 items-center justify-center mb-8 shadow-lg">
              <MaterialIcons name="check-circle" size={64} color="white" />
            </View>
            <Text className="text-3xl font-bold uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Complete</Text>
            <Text className="text-slate-500 mb-8 font-bold text-sm text-center">Funds have been dispatched to your linked paypal account.</Text>
            <TouchableOpacity onPress={() => onNavigate(ScreenName.WALLET)} className="w-full h-14 bg-primary rounded-2xl items-center justify-center">
              <Text className="text-white font-bold uppercase tracking-widest">Return to Terminal</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="Withdrawal Portal" onBack={() => onNavigate(ScreenName.WALLET)} />
      <View className="flex-1 p-6">
        {/* Balance Display */}
        <View className="bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 items-center mb-8">
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Liquidity Available</Text>
          <Text className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter">${balance?.toFixed(2)}</Text>
        </View>

        {/* Amount Input */}
        <View>
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Specify Amount</Text>
          <View className="relative">
            <Text className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-primary z-10">$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              className="w-full h-20 pl-14 pr-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl text-3xl font-bold text-slate-900 dark:text-white"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity onPress={startWithdraw} className="w-full h-16 bg-primary rounded-2xl items-center justify-center mt-8 shadow-lg">
          <Text className="text-white font-bold uppercase tracking-widest">Execute Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SubmissionTrackerScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Submission Log" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center p-8">
      <MaterialIcons name="fact-check" size={64} color="#94a3b8" />
      <Text className="text-slate-500 text-center mt-4 font-bold uppercase tracking-widest">System initializing...</Text>
    </View>
  </View>
);

export const SettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);

  const SettingToggle = ({ label, subtitle, icon, value, onToggle }: any) => (
    <View className="flex-row items-center justify-between p-6 bg-slate-50 dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 mb-3">
      <View className="flex-row items-center gap-4">
        <MaterialIcons name={icon} size={24} color="#1349ec" />
        <View>
          <Text className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">{label}</Text>
          <Text className="text-[10px] text-slate-500 uppercase font-bold mt-1">{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onToggle} className={`w-14 h-8 rounded-full p-1 ${value ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <View className={`w-6 h-6 rounded-full bg-white shadow-md ${value ? 'ml-6' : ''}`} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="System Config" onBack={() => onNavigate(ScreenName.HOME)} />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Operational Controls</Text>
        <SettingToggle label="Push Protocols" subtitle="Incoming task alerts" icon="notifications" value={notifications} onToggle={() => setNotifications(!notifications)} />
        <SettingToggle label="Biometric Vault" subtitle="Fingerprint withdrawal" icon="fingerprint" value={biometrics} onToggle={() => setBiometrics(!biometrics)} />

        <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2 mt-8">Network Utility</Text>
        <SettingToggle label="Low Bandwidth Mode" subtitle="Optimize media loading" icon="settings-ethernet" value={dataSaver} onToggle={() => setDataSaver(!dataSaver)} />
      </ScrollView>
    </View>
  );
};

export const NotificationsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const notifications = [
    { id: 1, title: 'Handshake Verified', body: 'Task #8291 has been accredited. $0.50 credited.', type: 'success', icon: 'verified', time: '2m ago' },
    { id: 2, title: 'Network Update', body: 'New High-Reward RLHF mission available in your region.', type: 'info', icon: 'bolt', time: '1h ago' },
    { id: 3, title: 'Payout Processed', body: 'Your withdrawal of $100.00 is now arriving.', type: 'finance', icon: 'payments', time: 'Yesterday' },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="Comms Hub" onBack={() => onNavigate(ScreenName.HOME)} />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <View className="flex-row items-center justify-between px-2 mb-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Activity Log</Text>
          <TouchableOpacity>
            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Mark all read</Text>
          </TouchableOpacity>
        </View>
        <View className="gap-4">
          {notifications.map((notif) => (
            <TouchableOpacity key={notif.id} className="p-5 bg-slate-50 dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 flex-row gap-4">
              <View className={`w-12 h-12 rounded-xl items-center justify-center ${notif.type === 'success' ? 'bg-emerald-500/10' : notif.type === 'info' ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                <MaterialIcons name={notif.icon as any} size={24} color={notif.type === 'success' ? '#10b981' : notif.type === 'info' ? '#1349ec' : '#f97316'} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex-1">{notif.title}</Text>
                  <Text className="text-[10px] font-bold text-slate-400">{notif.time}</Text>
                </View>
                <Text className="text-sm text-slate-500 dark:text-slate-400">{notif.body}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// SupportScreen moved to src/screens/SupportScreen.tsx with premium redesign

export const ReferralScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Referrals" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center p-8">
      <MaterialIcons name="share" size={64} color="#94a3b8" />
      <Text className="text-slate-500 text-center mt-4 font-bold uppercase tracking-widest">System initializing...</Text>
    </View>
  </View>
);
