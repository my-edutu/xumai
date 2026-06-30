import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { createSettingsStyles } from '../styles';
import { TEXT_STYLES, SPACING } from '../constants/designTokens';
import { Button } from '../components/primitives';
import { Header } from '../components/Shared';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../supabaseClient';
import * as WebBrowser from 'expo-web-browser';
import { UserService } from '../services/userService';

interface SettingsScreenProps {
    onNavigate: (s: ScreenName) => void;
    onLogout?: () => void;
    onBack?: () => void;
}

export const SettingsScreen = ({ onNavigate, onLogout, onBack }: SettingsScreenProps) => {
    const { theme, themeId } = useTheme();
    const styles = createSettingsStyles(theme);
    const { user } = useUser();
    const [preferredLanguage, setPreferredLanguage] = useState('English');

    useEffect(() => {
        if (!user?.id || !supabase) return;
        supabase
            .from('users')
            .select('languages')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data && data.languages && data.languages.length > 0) {
                    setPreferredLanguage(data.languages[0]);
                }
            });
    }, [user?.id]);

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be cleared.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user?.id) return;

                        const success = await UserService.deleteAccount(user.id);
                        if (!success) {
                            Alert.alert('Error', 'Failed to delete account. Please try again later.');
                            return;
                        }

                        try {
                            await user.delete();
                            Alert.alert('Success', 'Your account has been deleted.');
                        } catch (error) {
                            console.warn('[Settings] Clerk account deletion error:', error);
                            Alert.alert(
                                'Warning',
                                'Your app data was removed, but deleting your sign-in account failed. Please try again or contact support.'
                            );
                        }

                        if (onLogout) {
                            await onLogout();
                        }
                    }
                }
            ]
        );
    };

    const openWebLink = async (url: string) => {
        if (!url) {
            Alert.alert('Notice', 'This document will be available soon.');
            return;
        }
        await WebBrowser.openBrowserAsync(url);
    };

    const sections = [
        {
            title: 'Account',
            items: [
                { label: 'Payment Methods', icon: 'credit-card', value: '', screen: ScreenName.PAYMENT_METHODS },
            ],
        },
        {
            title: 'App Settings',
            items: [
                { label: 'Appearance', icon: 'palette', value: themeId === 'midnight' ? 'Dark' : 'Light', screen: ScreenName.APPEARANCE_LABS },
                { label: 'Language', icon: 'language', value: preferredLanguage, screen: ScreenName.LANGUAGE_SELECTION },
            ],
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', icon: 'help', value: '', screen: ScreenName.SUPPORT },
                { label: 'Report a Problem', icon: 'flag', value: '' },
                { label: 'Privacy Policy', icon: 'policy', value: '', url: 'https://xumai.io/privacy' },
                { label: 'Terms of Service', icon: 'description', value: '', url: 'https://xumai.io/terms' },
            ],
        },
        {
            title: 'About',
            items: [
                { label: 'App Version', icon: 'info', value: '1.0.0' },
                { label: 'Rate the App', icon: 'star', value: '' },
            ],
        },
    ];

    return (
        <View style={[localStyles.screenContainer, { backgroundColor: theme.background }]}>
            <Header
                title="Settings"
                onBack={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}
            />
            <ScrollView style={localStyles.flex1} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
                {sections.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.item}
                                onPress={() => {
                                    if (item.screen) onNavigate(item.screen);
                                    else if (item.url) openWebLink(item.url);
                                }}
                            >
                                <View style={styles.itemLeft}>
                                    <View style={styles.iconBox}>
                                        <MaterialIcons name={item.icon as any} size={20} color={theme.primary} />
                                    </View>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                </View>
                                <View style={styles.itemRight}>
                                    {item.value ? <Text style={styles.itemValue}>{item.value}</Text> : null}
                                    <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Button
                    variant="danger"
                    fullWidth
                    onPress={handleDeleteAccount}
                    leftIcon="delete-forever"
                    style={{ marginTop: SPACING.lg }}
                >
                    Delete Account
                </Button>

                <Text style={styles.footerText}>XUM AI v1.0.0 • Made with ❤️</Text>
            </ScrollView>
        </View>
    );
};

const localStyles = {
    screenContainer: { flex: 1 },
    flex1: { flex: 1 },
    header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        padding: SPACING.lg,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
};

