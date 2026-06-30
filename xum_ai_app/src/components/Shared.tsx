import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenName, Theme } from '../types';
import { useTheme } from '../context/ThemeContext';
import { TEXT_STYLES, SPACING } from '../constants/designTokens';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  activeThemeId?: string;
  setActiveThemeId?: (id: string) => void;
  themes?: Theme[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  isDarkMode,
  setIsDarkMode,
  activeThemeId,
  setActiveThemeId,
  themes = []
}) => {
  const { theme } = useTheme();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isExtrasMenuOpen, setIsExtrasMenuOpen] = useState(false);
  const [extrasView, setExtrasView] = useState<'main' | 'themes'>('main');

  const toggleMode = () => {
    if (setIsDarkMode) setIsDarkMode(!isDarkMode);
  };

  const isActive = (screen: ScreenName) => currentScreen === screen;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <View style={[navStyles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View style={navStyles.row}>
          <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)} style={navStyles.navItem}>
            <MaterialIcons name="home" size={24} color={isActive(ScreenName.HOME) ? theme.primary : theme.textTertiary} />
            <Text style={[TEXT_STYLES.label, { color: isActive(ScreenName.HOME) ? theme.primary : theme.textTertiary, marginTop: SPACING.xs }]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onNavigate(ScreenName.TASK_MARKETPLACE)} style={navStyles.navItem}>
            <MaterialIcons name="explore" size={24} color={isActive(ScreenName.TASK_MARKETPLACE) ? theme.primary : theme.textTertiary} />
            <Text style={[TEXT_STYLES.label, { color: isActive(ScreenName.TASK_MARKETPLACE) ? theme.primary : theme.textTertiary, marginTop: SPACING.xs }]}>
              Task
            </Text>
          </TouchableOpacity>

          <View style={navStyles.centerItemContainer}>
            <TouchableOpacity
              onPress={() => setIsCreateMenuOpen(true)}
              style={[navStyles.centerButton, { backgroundColor: theme.primary, borderColor: theme.surface }]}
            >
              <MaterialIcons name="add" size={28} color={theme.textInverse} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => onNavigate(ScreenName.WALLET)} style={navStyles.navItem}>
            <MaterialIcons name="account-balance-wallet" size={24} color={isActive(ScreenName.WALLET) ? theme.primary : theme.textTertiary} />
            <Text style={[TEXT_STYLES.label, { color: isActive(ScreenName.WALLET) ? theme.primary : theme.textTertiary, marginTop: SPACING.xs }]}>
              Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsExtrasMenuOpen(true); setExtrasView('main'); }} style={navStyles.navItem}>
            <MaterialIcons name="menu" size={24} color={isExtrasMenuOpen ? theme.primary : theme.textTertiary} />
            <Text style={[TEXT_STYLES.label, { color: isExtrasMenuOpen ? theme.primary : theme.textTertiary, marginTop: SPACING.xs }]}>
              Menu
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Extras Menu Modal */}
      <Modal visible={isExtrasMenuOpen} animationType="slide" transparent>
        <View style={modalStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsExtrasMenuOpen(false)}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
          </Pressable>
          <View style={[modalStyles.content, { backgroundColor: theme.background }]}>
            <View style={[modalStyles.handle, { backgroundColor: theme.border }]} />

            {extrasView === 'main' ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={modalStyles.headerRow}>
                  <Text style={[TEXT_STYLES.h4, { color: theme.text, textTransform: 'uppercase' }]}>Contributor Hub</Text>
                  <TouchableOpacity onPress={() => setIsExtrasMenuOpen(false)} style={[modalStyles.closeButton, { backgroundColor: theme.surface }]}>
                    <MaterialIcons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={modalStyles.grid}>
                  {[
                    { label: 'Profile', icon: 'person', screen: ScreenName.PROFILE, color: '#3b82f6' },
                    { label: 'Wallet', icon: 'account-balance-wallet', screen: ScreenName.WALLET, color: '#10b981' },
                    { label: 'Comms', icon: 'notifications', screen: ScreenName.NOTIFICATIONS, color: '#f97316' },
                    { label: 'Ranking', icon: 'military-tech', screen: ScreenName.LEADERBOARD, color: '#a855f7' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => { setIsExtrasMenuOpen(false); onNavigate(item.screen); }}
                      style={[modalStyles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <View style={[modalStyles.gridIcon, { backgroundColor: item.color }]}>
                        <MaterialIcons name={item.icon as any} size={28} color="white" />
                      </View>
                      <Text style={[TEXT_STYLES.label, { color: theme.text }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ gap: SPACING.md }}>
                  <TouchableOpacity
                    onPress={() => setExtrasView('themes')}
                    style={[modalStyles.listButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={[modalStyles.listIcon, { backgroundColor: `${theme.primary}20` }]}>
                      <MaterialIcons name="palette" size={20} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[TEXT_STYLES.bodySmall, { color: theme.text, fontWeight: '700', textTransform: 'uppercase' }]}>Theme</Text>
                      <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, textTransform: 'uppercase' }]}>
                        {themes.find(t => t.id === activeThemeId)?.name} Mode
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.SETTINGS); }}
                    style={[modalStyles.listButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={[modalStyles.listIcon, { backgroundColor: theme.border }]}>
                      <MaterialIcons name="settings" size={20} color={theme.textSecondary} />
                    </View>
                    <Text style={[TEXT_STYLES.bodySmall, { color: theme.text, fontWeight: '700', textTransform: 'uppercase' }]}>Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.SUPPORT); }}
                    style={[modalStyles.listButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={[modalStyles.listIcon, { backgroundColor: theme.border }]}>
                      <MaterialIcons name="help-center" size={20} color={theme.textSecondary} />
                    </View>
                    <Text style={[TEXT_STYLES.bodySmall, { color: theme.text, fontWeight: '700', textTransform: 'uppercase' }]}>Support</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.AUTH); }}
                  style={[modalStyles.terminateButton, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}30` }]}
                >
                  <MaterialIcons name="logout" size={20} color={theme.error} />
                  <Text style={[TEXT_STYLES.bodySmall, { color: theme.error, fontWeight: '700', textTransform: 'uppercase', marginLeft: SPACING.sm }]}>
                    Terminate Session
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={modalStyles.headerRow}>
                  <TouchableOpacity onPress={() => setExtrasView('main')} style={[modalStyles.closeButton, { backgroundColor: theme.surface }]}>
                    <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <Text style={[TEXT_STYLES.h5, { color: theme.text, textTransform: 'uppercase' }]}>Appearance Labs</Text>
                </View>

                <View style={[modalStyles.listButton, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: SPACING.lg, justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[modalStyles.listIcon, { backgroundColor: theme.border }]}>
                      <MaterialIcons name={isDarkMode ? 'dark-mode' : 'light-mode'} size={24} color={theme.textSecondary} />
                    </View>
                    <View>
                      <Text style={[TEXT_STYLES.bodySmall, { color: theme.text, fontWeight: '700', textTransform: 'uppercase' }]}>Dark Mode</Text>
                      <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, textTransform: 'uppercase' }]}>{isDarkMode ? 'Active' : 'Off'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={toggleMode} style={[modalStyles.toggle, { backgroundColor: isDarkMode ? theme.primary : theme.border }]}>
                    <View style={[modalStyles.toggleCircle, { marginLeft: isDarkMode ? 24 : 0 }]} />
                  </TouchableOpacity>
                </View>

                <View style={modalStyles.grid}>
                  {themes.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setActiveThemeId && setActiveThemeId(t.id)}
                      style={[
                        modalStyles.gridItem,
                        {
                          backgroundColor: theme.surface,
                          borderColor: activeThemeId === t.id ? theme.primary : theme.border,
                          borderWidth: 2
                        }
                      ]}
                    >
                      <View style={[modalStyles.themeIcon, { backgroundColor: t.primary }]}>
                        {activeThemeId === t.id && <MaterialIcons name="verified" size={32} color="white" />}
                      </View>
                      <Text style={[TEXT_STYLES.bodySmall, { color: theme.text, fontWeight: '700', marginBottom: SPACING.xs }]}>{t.name}</Text>
                      <View style={[modalStyles.themeBadge, { backgroundColor: activeThemeId === t.id ? theme.primary : theme.border }]}>
                        <Text style={[TEXT_STYLES.caption, { color: activeThemeId === t.id ? 'white' : theme.textSecondary }]}>
                          {activeThemeId === t.id ? 'Active' : 'Use'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Menu Modal */}
      <Modal visible={isCreateMenuOpen} animationType="slide" transparent>
        <View style={modalStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCreateMenuOpen(false)}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          </Pressable>
          <View style={[modalStyles.content, { backgroundColor: theme.background, paddingBottom: 64 }]}>
            <TouchableOpacity onPress={() => setIsCreateMenuOpen(false)} style={[modalStyles.modalCloseFixed, { backgroundColor: theme.surface }]}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={{ marginTop: SPACING.lg, gap: SPACING.lg }}>
              <Text style={[TEXT_STYLES.h4, { color: theme.text, textAlign: 'center', textTransform: 'uppercase' }]}>Neural Input</Text>

              <View style={{ flexDirection: 'row', gap: SPACING.md, height: 200 }}>
                <TouchableOpacity onPress={() => { setIsCreateMenuOpen(false); onNavigate(ScreenName.CAPTURE_CHOICE); }} style={modalStyles.neuralCard}>
                  <LinearGradient colors={['#34d399', '#0d9488']} style={modalStyles.neuralGradient}>
                    <View style={modalStyles.neuralIconCircle}>
                      <MaterialIcons name="sensors" size={32} color="white" />
                    </View>
                    <Text style={[TEXT_STYLES.h6, { color: 'white', textTransform: 'uppercase' }]}>Visual Lab</Text>
                    <Text style={[TEXT_STYLES.caption, { color: 'rgba(255,255,255,0.7)', fontWeight: '600' }]}>Environmental Input</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setIsCreateMenuOpen(false); onNavigate(ScreenName.LINGUASENSE_ENGINE); }} style={modalStyles.neuralCard}>
                  <LinearGradient colors={['#f43f5e', '#ea580c']} style={modalStyles.neuralGradient}>
                    <View style={modalStyles.neuralIconCircle}>
                      <MaterialIcons name="psychology" size={32} color="white" />
                    </View>
                    <Text style={[TEXT_STYLES.h6, { color: 'white', textTransform: 'uppercase' }]}>Lingua Hub</Text>
                    <Text style={[TEXT_STYLES.caption, { color: 'rgba(255,255,255,0.7)', fontWeight: '600' }]}>Semantic Grounding</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    maxHeight: '85%',
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  gridItem: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 24,
    borderWidth: 1,
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  terminateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: SPACING.lg,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 4,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  themeIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  themeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalCloseFixed: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  neuralCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  neuralGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  neuralIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
});

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    zIndex: 50,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: SPACING.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
});

export const Header: React.FC<{ title: string; onBack?: () => void; rightAction?: React.ReactNode; }> = ({ title, onBack, rightAction }) => {
  const { theme } = useTheme();

  return (
    <View style={[headerStyles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={headerStyles.side}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={headerStyles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={[TEXT_STYLES.h6, { color: theme.text, flex: 1, textAlign: 'center', textTransform: 'uppercase' }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ width: 48 }} />
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: Platform.OS === 'android' ? 24 : 12, // Matched with HomeScreen padding
    borderBottomWidth: 1,
  },
  side: {
    width: 48,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
