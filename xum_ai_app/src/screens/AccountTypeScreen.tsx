/**
 * Account Type Selection Screen
 *
 * Presented BEFORE auth so users choose between:
 *   - "User" → Auth screen (user mode) → HOME
 *   - "Company" → Auth screen (company mode) → COMPANY_DASHBOARD
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ImageBackground,
    StatusBar,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenName } from '../types';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCOUNT_TYPE_KEY = 'xum_account_type';
const ONBOARDING_KEY = 'onboarding_completed';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AccountType = 'user' | 'company';

// ============================================================================
// HELPERS
// ============================================================================

/** Persist chosen account type so subsequent logins skip the chooser. */
export const saveAccountType = async (type: AccountType): Promise<void> => {
    await AsyncStorage.setItem(ACCOUNT_TYPE_KEY, type);
};

/** Read previously saved account type (returns null on first login). */
export const getAccountType = async (): Promise<AccountType | null> => {
    const val = await AsyncStorage.getItem(ACCOUNT_TYPE_KEY);
    if (val === 'user' || val === 'company') return val;
    return null;
};

/** Clear account type on logout. */
export const clearAccountType = async (): Promise<void> => {
    await AsyncStorage.removeItem(ACCOUNT_TYPE_KEY);
};

// ============================================================================
// SCREEN COMPONENT
// ============================================================================

interface AccountTypeScreenProps {
    onNavigate: (screen: ScreenName, params?: any) => void;
}

export const AccountTypeScreen: React.FC<AccountTypeScreenProps> = ({ onNavigate }) => {
    const { theme } = useTheme();

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const handleSelect = async (type: AccountType) => {
        // Save the chosen type BEFORE going to auth
        await saveAccountType(type);
        // Navigate to auth — the auth screen and post-auth effect will
        // read the stored account type to know where to send the user.
        onNavigate(ScreenName.AUTH);
    };

    const handleResetOnboarding = async () => {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        Alert.alert("Dev", "Onboarding reset. Relaunch or go back to see it.");
        onNavigate(ScreenName.ONBOARDING);
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop' }}
            style={[styles.container, { backgroundColor: '#0f172a' }]} // Fallback color
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" />

            {/* Dark overlay for readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFillObject}
            />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                <Text style={[styles.prompt, { color: '#fff' }]}>Select a user</Text>

                {/* Cards */}
                <View style={styles.cardsContainer}>
                    {/* User Card */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderColor: 'rgba(255,255,255,0.1)' }]}
                        activeOpacity={0.85}
                        onPress={() => handleSelect('user')}
                    >
                        <LinearGradient
                            colors={[theme.primary, theme.primaryDark || theme.primary]}
                            style={styles.iconCircle}
                        >
                            <MaterialIcons name="person" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1, paddingRight: 12, alignItems: 'flex-start' }}>
                            <Text style={[styles.cardTitle, { color: '#fff' }]}>User</Text>
                            <Text style={[styles.cardDesc, { color: 'rgba(255,255,255,0.7)' }]}>
                                Earn by completing tasks
                            </Text>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={14} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>

                    {/* Company Card */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderColor: 'rgba(255,255,255,0.1)' }]}
                        activeOpacity={0.85}
                        onPress={() => handleSelect('company')}
                    >
                        <LinearGradient
                            colors={['#f97316', '#ea580c']}
                            style={styles.iconCircle}
                        >
                            <MaterialIcons name="business" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1, paddingRight: 12, alignItems: 'flex-start' }}>
                            <Text style={[styles.cardTitle, { color: '#fff' }]}>Company</Text>
                            <Text style={[styles.cardDesc, { color: 'rgba(255,255,255,0.7)' }]}>
                                Hire workers & manage data
                            </Text>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={14} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                {/* Reset Onboarding Link (Dev) */}
                <TouchableOpacity onPress={handleResetOnboarding} style={{ marginTop: 40, alignSelf: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                        Reset Onboarding
                    </Text>
                </TouchableOpacity>

            </Animated.View>
        </ImageBackground>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    content: {
        alignItems: 'flex-start', // Left align the container's children
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    prompt: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 32,
        letterSpacing: -0.5,
        textAlign: 'left', // Explicit left align
    },
    cardsContainer: {
        width: '100%',
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        height: 100,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardDesc: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
});
