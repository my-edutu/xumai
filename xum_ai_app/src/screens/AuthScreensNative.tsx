/**
 * XUM AI - Auth Screens (Pure React Native)
 * 
 * Converted from NativeWind to React Native StyleSheet for APK compatibility.
 * Maintains exact same design, animations, and functionality.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Dimensions,
    Animated,
    SafeAreaView,
    FlatList,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSignIn, useSignUp, useUser, useAuth, useOAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { getAccountType, AccountType } from './AccountTypeScreen';
import { countries } from '../utils/countries';

// NOTE: WebBrowser.maybeCompleteAuthSession() is called in index.tsx at module level
// to handle OAuth redirect callbacks when the app resumes.

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Warm up the browser on Android for faster OAuth popup.
 * Recommended by Clerk for expo-web-browser OAuth flows.
 */
const useWarmUpBrowser = () => {
    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TypeWriterText = ({ text, style }: { text: string, style: any }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        setIsTyping(true);
        const timer = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                setIsTyping(false);
            }
        }, 50);
        return () => clearInterval(timer);
    }, [text]);

    return (
        <Text style={style}>
            {displayedText}
            {isTyping && <Text style={{ color: 'rgba(255,255,255,0.4)' }}>|</Text>}
        </Text>
    );
};

// ============================================================================
// TYPES
// ============================================================================

interface ScreenProps {
    onNavigate: (screen: ScreenName, params?: any) => void;
    userEmail?: string;
}

// ============================================================================
// THEME COLORS (Determined by context)
// ============================================================================

// ============================================================================
// SPLASH SCREEN
// ============================================================================

/**
 * Letter-based animation for splash screen.
 * Characters scatter across the screen, then assemble to form "XUM AI".
 */
const LOGO_LETTERS = ['X', 'U', 'M', ' ', 'A', 'I'];

export const SplashScreen = ({ onNavigate }: ScreenProps) => {
    const { theme } = useTheme();
    const { isLoaded, isSignedIn } = useUser();
    const { userId } = useAuth();
    const [phase, setPhase] = useState<'scattered' | 'forming' | 'stable'>('scattered');

    // Animation values for each letter
    const letterAnimations = useMemo(() => {
        return LOGO_LETTERS.map(() => ({
            translateX: new Animated.Value((Math.random() - 0.5) * SCREEN_WIDTH * 1.5),
            translateY: new Animated.Value((Math.random() - 0.5) * SCREEN_HEIGHT * 1.2),
            rotate: new Animated.Value((Math.random() - 0.5) * 720),
            scale: new Animated.Value(0.3 + Math.random() * 0.5),
            opacity: new Animated.Value(0.15 + Math.random() * 0.3),
        }));
    }, []);

    useEffect(() => {
        // Phase 1: Show scattered letters
        const timer1 = setTimeout(() => {
            setPhase('forming');
            // Animate letters to their final positions
            const animations = letterAnimations.map((anim, index) => {
                const delay = index * 120;
                return Animated.parallel([
                    Animated.timing(anim.translateX, {
                        toValue: 0,
                        duration: 1800,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.translateY, {
                        toValue: 0,
                        duration: 1800,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.rotate, {
                        toValue: 0,
                        duration: 1800,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.scale, {
                        toValue: 1,
                        duration: 1800,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 1200,
                        delay,
                        useNativeDriver: true,
                    }),
                ]);
            });
            Animated.parallel(animations).start();
        }, 800);

        // Phase 2: Stable - letters are now in place
        const timer2 = setTimeout(() => {
            setPhase('stable');
        }, 3500);

        // Determine destination based on auth state and onboarding history
        const timer3 = setTimeout(async () => {
            if (isLoaded && isSignedIn) {
                onNavigate(ScreenName.ACCOUNT_TYPE_SELECT);
                return;
            }

            try {
                const onboardingDone = await AsyncStorage.getItem('onboarding_completed');
                if (onboardingDone === 'true') {
                    onNavigate(ScreenName.ACCOUNT_TYPE_SELECT);
                } else {
                    onNavigate(ScreenName.ONBOARDING);
                }
            } catch (e) {
                onNavigate(ScreenName.ONBOARDING);
            }
        }, 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onNavigate, letterAnimations, isLoaded, isSignedIn]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[splashStyles.container, { backgroundColor: theme.background }]}
            onPress={async () => {
                if (isLoaded && isSignedIn) {
                    onNavigate(ScreenName.ACCOUNT_TYPE_SELECT);
                    return;
                }
                const onboardingDone = await AsyncStorage.getItem('onboarding_completed');
                onNavigate(onboardingDone === 'true' ? ScreenName.ACCOUNT_TYPE_SELECT : ScreenName.ONBOARDING);
            }}
        >
            <View style={[splashStyles.background, { backgroundColor: theme.background }]} />

            {/* Glow Effect */}
            <View style={[splashStyles.glowContainer, { pointerEvents: 'none' }]}>
                <View style={[splashStyles.glowCircle, { backgroundColor: `${theme.primary}10` }]} />
            </View>

            {/* Animated Letters */}
            <View style={splashStyles.letterContainer}>
                {LOGO_LETTERS.map((letter, index) => {
                    const anim = letterAnimations[index];
                    const rotateInterpolate = anim.rotate.interpolate({
                        inputRange: [-360, 360],
                        outputRange: ['-360deg', '360deg'],
                    });

                    return (
                        <Animated.Text
                            key={index}
                            style={[
                                splashStyles.logoLetter,
                                {
                                    color: theme.text,
                                    opacity: anim.opacity,
                                    transform: [
                                        { translateX: anim.translateX },
                                        { translateY: anim.translateY },
                                        { rotate: rotateInterpolate },
                                        { scale: anim.scale },
                                    ],
                                },
                            ]}
                        >
                            {letter}
                        </Animated.Text>
                    );
                })}
            </View>

            <View style={[splashStyles.overlay, { pointerEvents: 'none' }]} />
        </TouchableOpacity>
    );
};

const splashStyles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    glowContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
    },
    glowCircle: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: '-80%',
        marginTop: '-80%',
        width: '160%',
        height: '160%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 9999,
    },
    letterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    logoLetter: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -2,
        textTransform: 'uppercase',
        textAlign: 'center',
        ...Platform.select({
            ios: {
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 10,
            },
            android: {
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 10,
            },
            web: {
                textShadow: '0px 2px 10px rgba(0, 0, 0, 0.3)',
            }
        }),
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundColor: '#000000',
    },
});

// ============================================================================
// ONBOARDING SCREEN
// ============================================================================

interface OnboardingSlide {
    title: string;
    titleHighlight?: string;
    body: string;
    cta: string;
    colors: [string, string, string];
    icons: Array<{
        icon: string;
        bgColor: string;
        label: string;
        value: string;
        position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
        rotation: number;
    }>;
}

export const OnboardingScreen = ({ onNavigate }: ScreenProps) => {
    const { theme } = useTheme();
    const [step, setStep] = useState(0);
    const [agreed, setAgreed] = useState(false);

    const slides: OnboardingSlide[] = [
        {
            title: 'Welcome to',
            titleHighlight: 'XUM AI',
            body: "Earn by helping train the next generation of AI — using your voice, language, and judgment.",
            cta: "Get Started",
            colors: [theme.primary, theme.success, theme.background],
            icons: [
                { icon: 'mic', bgColor: theme.success, label: 'Voice Labeler', value: '+$0.45/min', position: 'topRight', rotation: 6 },
                { icon: 'verified', bgColor: theme.primary, label: 'RLHF Auditor', value: '+$1.20/task', position: 'bottomLeft', rotation: -3 },
            ],
        },
        {
            title: "Simple Tasks. Real Money.",
            body: "Contribute by recording voice, labeling text or images, validating answers, or judging AI responses.",
            cta: "Next",
            colors: [theme.primaryDark, theme.accent, theme.background],
            icons: [
                { icon: 'edit-note', bgColor: theme.accent, label: 'Text Editor', value: '+$0.15/msg', position: 'topLeft', rotation: -6 },
                { icon: 'image-search', bgColor: theme.primary, label: 'Image Tagger', value: '+$0.80/task', position: 'bottomRight', rotation: 12 },
            ],
        },
        {
            title: "Your Data Trains Smarter AI",
            body: "Your language, culture, and decisions help AI understand the world better — more accurately and fairly.",
            cta: "Next",
            colors: [theme.success, theme.primary, theme.background],
            icons: [
                { icon: 'psychology', bgColor: theme.primaryLight, label: 'Logic Trainer', value: 'Level Up', position: 'topRight', rotation: 12 },
                { icon: 'public', bgColor: theme.success, label: 'Global Impact', value: 'Active', position: 'bottomLeft', rotation: -12 },
            ],
        },
        {
            title: "Fair Pay. Full Control.",
            body: "Track your earnings in real time, withdraw anytime, and work only on tasks you qualify for.",
            cta: "Finish",
            colors: [theme.primary, theme.primaryDark, theme.background],
            icons: [
                { icon: 'payments', bgColor: theme.success, label: 'Instant Pay', value: 'Withdraw', position: 'topLeft', rotation: -12 },
                { icon: 'shield', bgColor: theme.primary, label: 'Privacy Core', value: 'Secured', position: 'bottomRight', rotation: 6 },
            ],
        },
    ];

    const nextStep = async () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else if (agreed) {
            await AsyncStorage.setItem('onboarding_completed', 'true');
            onNavigate(ScreenName.ACCOUNT_TYPE_SELECT);
        }
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const current = slides[step];

    const getIconPosition = (position: string) => {
        switch (position) {
            case 'topLeft': return { top: 8, left: 16 };
            case 'topRight': return { top: 0, right: 0 };
            case 'bottomLeft': return { bottom: 16, left: 0 };
            case 'bottomRight': return { bottom: 32, right: 0 };
            default: return { top: 0, left: 0 };
        }
    };

    return (
        <LinearGradient
            colors={current.colors as any}
            style={[onboardingStyles.container, { backgroundColor: theme.background }]}
        >
            <View style={onboardingStyles.content}>
                {/* Header Navigation */}
                <View style={onboardingStyles.headerContainer}>
                    <View style={onboardingStyles.headerRow}>
                        <TouchableOpacity
                            onPress={prevStep}
                            style={[onboardingStyles.backButton, step === 0 && { opacity: 0 }]}
                        >
                            <MaterialIcons name="arrow-back" size={28} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onNavigate(ScreenName.AUTH)}>
                            <Text style={[onboardingStyles.skipText, { color: theme.textSecondary }]}>Skip</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Progress Indicators */}
                    <View style={onboardingStyles.progressRow}>
                        {slides.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    onboardingStyles.progressDot,
                                    i <= step
                                        ? { backgroundColor: theme.text }
                                        : { backgroundColor: `${theme.text}20` },
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Content Area */}
                <View style={onboardingStyles.mainContent}>
                    {/* Floating Icons */}
                    <View style={onboardingStyles.iconsContainer}>
                        {current.icons.map((item, idx) => (
                            <View
                                key={idx}
                                style={[
                                    onboardingStyles.floatingCard,
                                    getIconPosition(item.position),
                                    {
                                        transform: [{ rotate: `${item.rotation}deg` }],
                                        backgroundColor: `${theme.surface}dd`,
                                        borderColor: theme.border,
                                    },
                                ]}
                            >
                                <View style={onboardingStyles.floatingCardInner}>
                                    <View style={[onboardingStyles.iconBox, { backgroundColor: `${item.bgColor}20` }]}>
                                        <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={item.bgColor} />
                                    </View>
                                    <View>
                                        <Text style={[onboardingStyles.iconLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                                        <Text style={[onboardingStyles.iconValue, { color: theme.text }]}>{item.value}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Main Text */}
                    <View style={onboardingStyles.textContainer}>
                        <Text style={[onboardingStyles.title, { color: theme.text }]}>
                            {current.title}
                            {current.titleHighlight && (
                                <Text style={[onboardingStyles.titleHighlight, { color: theme.primary }]}> {current.titleHighlight}</Text>
                            )}
                        </Text>
                        <Text style={[onboardingStyles.body, { color: `${theme.text}cc` }]}>{current.body}</Text>
                    </View>

                    {/* Terms Agreement (Last Step Only) */}
                    {step === 3 && (
                        <TouchableOpacity
                            onPress={() => setAgreed(!agreed)}
                            style={[onboardingStyles.termsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            <View style={[
                                onboardingStyles.checkbox,
                                { borderColor: theme.border },
                                agreed && { backgroundColor: theme.primary, borderColor: theme.primary },
                            ]}>
                                {agreed && <MaterialIcons name="check" size={16} color="white" />}
                            </View>
                            <Text style={[onboardingStyles.termsText, { color: theme.textSecondary }]}>
                                I agree to the Terms and Privacy Policy.
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* CTA Button */}
                    <TouchableOpacity
                        onPress={nextStep}
                        disabled={step === 3 && !agreed}
                        style={[
                            onboardingStyles.ctaButton,
                            { backgroundColor: theme.text },
                            step === 3 && !agreed && { opacity: 0.2 },
                        ]}
                    >
                        <Text style={[onboardingStyles.ctaText, { color: theme.background }]}>{current.cta}</Text>
                        <MaterialIcons name="arrow-forward-ios" size={16} color={theme.background} />
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

const onboardingStyles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        width: '100%',
    },
    content: {
        flex: 1,
        paddingTop: 48,
    },
    headerContainer: {
        paddingHorizontal: 32,
        zIndex: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 32,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    skipText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        height: 4,
        flex: 1,
        borderRadius: 9999,
    },
    progressDotActive: {
    },
    progressDotInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 32,
        paddingBottom: 16,
    },
    iconsContainer: {
        height: 176,
        width: '100%',
        marginBottom: 32,
        position: 'relative',
    },
    floatingCard: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    floatingCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodText: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pendingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    pendingIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    pendingTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    pendingSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    pendingCard: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 40,
    },
    pendingInstruction: {
        color: 'white',
        fontSize: 13,
        lineHeight: 24,
        fontWeight: '500',
    },
    pendingBtn: {
        width: '100%',
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    pendingBtnText: {
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    resendLink: {
        padding: 10,
    },
    resendLinkText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    textContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 48,
        fontWeight: '700',
        lineHeight: 52,
        letterSpacing: -1,
    },
    titleHighlight: {
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    body: {
        fontSize: 24,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 16,
        lineHeight: 32,
    },
    termsContainer: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
    },
    termsText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    ctaButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
});

// ============================================================================
// AUTH SCREEN (Login / Sign Up)
// ============================================================================

export const AuthScreen = ({ onNavigate }: ScreenProps) => {
    const { theme } = useTheme();
    useWarmUpBrowser();

    const [mode, setMode] = useState<'Login' | 'SignUp'>('Login');
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [hasBeenManuallyEdited, setHasBeenManuallyEdited] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [accountType, setAccountType] = useState<AccountType | null>(null);

    // Auto-fill username from email prefix if not manually edited
    useEffect(() => {
        if (!hasBeenManuallyEdited && email.includes('@')) {
            const prefix = email.split('@')[0];
            // Sanitize: allow only letters, numbers, -, _
            const sanitized = prefix.replace(/[^a-zA-Z0-9-_]/g, '');
            setUsername(sanitized);
        }
    }, [email, hasBeenManuallyEdited]);

    // Read stored account type on mount for branding & post-auth destination
    useEffect(() => {
        getAccountType().then(setAccountType);
    }, []);

    /** Navigate to the correct destination after successful auth */
    const navigatePostAuth = () => {
        if (accountType === 'company') {
            onNavigate(ScreenName.COMPANY_DASHBOARD);
        } else {
            onNavigate(ScreenName.LANGUAGE_SELECTION);
        }
    };

    const isCompanyMode = accountType === 'company';

    // Clerk hooks
    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

    // OAuth hooks for social sign-in
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
    const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

    const filteredCountries = useMemo(() => {
        return countries.filter((c: any) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase())
        );
    }, [countrySearch]);

    /**
     * Shared handler that completes an OAuth flow for any provider.
     * Handles all Clerk scenarios: direct session, transfer flows, and edge cases.
     */
    const completeOAuthFlow = async (
        result: { createdSessionId: any; setActive: any; signIn: any; signUp: any },
        provider: string,
    ) => {
        const { createdSessionId, setActive, signIn: oauthSignIn, signUp: oauthSignUp } = result;
        const activate = setActive || setSignInActive;

        console.log(`[Auth] ${provider} OAuth result:`, {
            createdSessionId,
            hasSetActive: !!setActive,
            signInStatus: oauthSignIn?.status,
            signUpStatus: oauthSignUp?.status,
            signInFirstFactor: oauthSignIn?.firstFactorVerification?.status,
            signUpExtAccount: oauthSignUp?.verifications?.externalAccount?.status,
            missingFields: oauthSignUp?.missingFields,
        });

        // Case 1: Direct session created (most common for existing users)
        if (createdSessionId) {
            await activate({ session: createdSessionId });
            console.log(`[Auth] ${provider} session activated directly`);
            navigatePostAuth();
            return;
        }

        // Case 2: signUp completed during OAuth (new user auto-created)
        if (oauthSignUp?.status === 'complete' && oauthSignUp.createdSessionId) {
            await activate({ session: oauthSignUp.createdSessionId });
            console.log(`[Auth] ${provider} signUp complete`);
            navigatePostAuth();
            return;
        }

        // Case 3: signIn completed during OAuth (existing user)
        if (oauthSignIn?.status === 'complete' && oauthSignIn.createdSessionId) {
            await activate({ session: oauthSignIn.createdSessionId });
            console.log(`[Auth] ${provider} signIn complete`);
            navigatePostAuth();
            return;
        }

        // Case 4: signUp needs additional fields (Clerk dashboard requires extra info).
        // Handle this BEFORE transfers — the oauthSignUp from the result IS the active
        // sign-up attempt and has the correct state. Using it directly avoids stale
        // hook references and broken transfer calls.
        if (oauthSignUp?.status === 'missing_requirements') {
            const missing: string[] = oauthSignUp.missingFields || [];
            console.log(`[Auth] ${provider} missing fields:`, missing);

            // Auto-fillable fields: name and username can be derived from OAuth profile
            const autoFillable = ['first_name', 'last_name', 'username', 'public_metadata'];
            const needsAutoFill = missing.length > 0 && missing.every((f: string) => autoFillable.includes(f));

            if (needsAutoFill) {
                try {
                    const updates: Record<string, any> = {};
                    if (missing.includes('first_name')) {
                        updates.firstName = oauthSignUp.firstName || 'User';
                    }
                    if (missing.includes('last_name')) {
                        updates.lastName = oauthSignUp.lastName || '';
                    }
                    if (missing.includes('username')) {
                        const base = (oauthSignUp.emailAddress || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                        updates.username = `${base}${Math.floor(Math.random() * 100000)}`;
                    }

                    // Use the OAuth sign-up object directly (not the hook's signUp)
                    const updated = await oauthSignUp.update(updates);
                    if (updated.status === 'complete' && updated.createdSessionId) {
                        await activate({ session: updated.createdSessionId });
                        console.log(`[Auth] ${provider} signup completed after auto-fill`);
                        navigatePostAuth();
                        return;
                    }
                } catch (e: any) {
                    const rawError = e.errors?.[0]?.longMessage || e.errors?.[0]?.message || e.message;
                    console.error(`[Auth] ${provider} auto-fill update failed:`, rawError);
                    setError(`Sign-up update failed: ${rawError}`);
                    return;
                }
            }

            // Could not auto-fill — show actionable guidance
            if (missing.includes('password')) {
                setError(
                    'Clerk requires a password for sign-up. Go to Clerk Dashboard → ' +
                    'Configure → Email, Phone, Username → Password and set it to NOT required.'
                );
            } else if (missing.includes('phone_number')) {
                setError(
                    'Clerk requires a phone number for sign-up. Go to Clerk Dashboard → ' +
                    'Configure → Email, Phone, Username → Phone number and toggle it off or set to optional.'
                );
            } else {
                // If username is the only one missing, it's likely a Clerk propagation delay.
                // We've already tried to auto-fill it above. If we are here, it means the update failed.
                // We show a more generic message or focus on other fields.
                const remaining = missing.filter(f => f !== 'username');
                if (remaining.length > 0) {
                    setError(
                        `Social sign-up needs additional info: ${remaining.join(', ')}. ` +
                        'Make these fields optional in your Clerk Dashboard.'
                    );
                } else {
                    console.warn('[Auth] Only missing username after auto-fill attempt. Manual intervention might be needed.');
                    setError('Social sign-up is stuck on requirements. Please try again or use email.');
                }
            }
            return;
        }

        // Case 5: New user - signIn says "external_account_not_found", transfer to signUp
        if (
            oauthSignIn?.firstFactorVerification?.status === 'transferable' &&
            oauthSignIn?.firstFactorVerification?.error?.code === 'external_account_not_found'
        ) {
            // Use the oauthSignUp from the result first; fall back to hook's signUp
            const signUpRef = oauthSignUp || signUp;
            if (signUpRef) {
                try {
                    console.log(`[Auth] ${provider} user not found, transferring to signUp`);
                    const transferResult = await signUpRef.create({ transfer: true });
                    if (transferResult.status === 'complete' && transferResult.createdSessionId) {
                        await activate({ session: transferResult.createdSessionId });
                        console.log(`[Auth] ${provider} transfer signUp complete`);
                        navigatePostAuth();
                        return;
                    }
                    // Transfer created but not complete — may have missing_requirements
                    if (transferResult.status === 'missing_requirements') {
                        const missing: string[] = transferResult.missingFields || [];
                        setError(
                            `Social sign-up needs: ${missing.join(', ')}. ` +
                            'Make these optional in Clerk Dashboard → Configure → Email, Phone, Username.'
                        );
                        return;
                    }
                } catch (transferErr: any) {
                    const code = transferErr.errors?.[0]?.code || '';
                    console.warn(`[Auth] ${provider} signUp transfer failed:`, code);
                    if (code === 'sign_up_forbidden') {
                        setError(
                            'Sign-up is restricted in your Clerk Dashboard. Go to Clerk Dashboard → ' +
                            'Configure → Restrictions and set sign-up mode to "Public", or add this user\'s email to the allowlist.'
                        );
                        return;
                    }
                }
            }
        }

        // Case 6: Existing user - signUp says "external_account_exists", transfer to signIn
        if (
            oauthSignUp?.verifications?.externalAccount?.status === 'transferable' &&
            oauthSignUp?.verifications?.externalAccount?.error?.code === 'external_account_exists'
        ) {
            if (signIn) {
                try {
                    console.log(`[Auth] ${provider} account exists, transferring to signIn`);
                    const transferResult = await signIn.create({ transfer: true });
                    if (transferResult.status === 'complete' && transferResult.createdSessionId) {
                        await activate({ session: transferResult.createdSessionId });
                        console.log(`[Auth] ${provider} transfer signIn complete`);
                        navigatePostAuth();
                        return;
                    }
                } catch (transferErr: any) {
                    console.warn(`[Auth] ${provider} signIn transfer failed:`, transferErr.errors?.[0]?.code);
                }
            }
        }

        // Case 7: Last resort — check for session IDs on either object
        if (oauthSignUp?.createdSessionId) {
            await activate({ session: oauthSignUp.createdSessionId });
            navigatePostAuth();
            return;
        }
        if (oauthSignIn?.createdSessionId) {
            await activate({ session: oauthSignIn.createdSessionId });
            navigatePostAuth();
            return;
        }

        // Case 8: User dismissed the browser or flow was cancelled — no error shown
        console.log(`[Auth] ${provider} OAuth flow ended without completing. signIn:`, oauthSignIn?.status, 'signUp:', oauthSignUp?.status);
    };

    /**
     * Map Clerk error codes to actionable user messages.
     * This prevents raw Clerk error text from confusing users.
     */
    const getOAuthErrorMessage = (err: any, provider: string): string => {
        const code = err.errors?.[0]?.code || err.code || '';
        const rawMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || '';

        console.error(`[Auth] ${provider} error code=${code} msg=${rawMsg}`);

        switch (code) {
            case 'sign_up_forbidden':
                return (
                    'New sign-ups are restricted. Go to Clerk Dashboard → Configure → ' +
                    'Restrictions and set sign-up mode to "Public".'
                );
            case 'form_identifier_exists':
                return 'An account with this email already exists. Try signing in instead.';
            case 'account_transfer_invalid':
                return `Could not complete ${provider} sign-up. Please try again.`;
            case 'oauth_access_denied':
                return `${provider} access was denied. Please try again and grant permission.`;
            case 'external_account_not_found':
                return `No account found for this ${provider} email. Please sign up first.`;
            default:
                return rawMsg || `${provider} sign-in failed. Please try again.`;
        }
    };

    const handleGoogleLogin = async () => {
        if (!signInLoaded || !signUpLoaded) return;
        setLoading(true);
        setError(null);
        try {
            console.log('[Auth] Starting Google OAuth flow...');
            const redirectUrl = Linking.createURL('oauth-native-callback');
            const result = await startGoogleOAuth({ redirectUrl });
            await completeOAuthFlow(result, 'Google');
        } catch (err: any) {
            console.error('Google OAuth error:', JSON.stringify(err, null, 2));
            setError(getOAuthErrorMessage(err, 'Google'));
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        if (!signInLoaded || !signUpLoaded) return;
        setLoading(true);
        setError(null);
        try {
            console.log('[Auth] Starting Apple OAuth flow...');
            const redirectUrl = Linking.createURL('oauth-native-callback');
            const result = await startAppleOAuth({ redirectUrl });
            await completeOAuthFlow(result, 'Apple');
        } catch (err: any) {
            console.error('Apple OAuth error:', JSON.stringify(err, null, 2));
            setError(getOAuthErrorMessage(err, 'Apple'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!email.trim() || (mode === 'SignUp' && (!firstName.trim() || !lastName.trim() || !username.trim()))) {
            setError('Please fill in all required fields');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        if (mode === 'SignUp' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (mode === 'SignUp') {
                if (!signUpLoaded || !signUp) {
                    setLoading(false);
                    return;
                }

                const normalizedEmail = email.trim().toLowerCase();
                const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-_]/g, '');
                
                if (!sanitizedUsername) {
                    setError('Username is required');
                    setLoading(false);
                    return;
                }

                await signUp.create({
                    emailAddress: normalizedEmail,
                    username: sanitizedUsername,
                    password,
                    firstName: firstName,
                    lastName: lastName,
                    unsafeMetadata: {
                        phoneNumber: phoneNumber,
                        country: country
                    }
                });

                // Send verification code then navigate to OTP screen
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setLoading(false);
                onNavigate(ScreenName.OTP_VERIFICATION, { email: normalizedEmail });
            } else {
                if (!signInLoaded || !signIn) {
                    setLoading(false);
                    return;
                }

                const normalizedEmail = email.trim().toLowerCase();
                const result = await signIn.create({
                    identifier: normalizedEmail,
                    password,
                });

                if (result.status === 'complete') {
                    await setSignInActive({ session: result.createdSessionId });
                    navigatePostAuth();
                } else if (result.status === 'needs_first_factor' || result.status === 'needs_second_factor') {
                    const emailFactor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
                    if (emailFactor) {
                        try {
                            await signIn.prepareFirstFactor({
                                strategy: 'email_code',
                                emailAddressId: (emailFactor as any).emailAddressId
                            });
                            onNavigate(ScreenName.OTP_VERIFICATION, { email });
                        } catch (err) {
                            setError('Unable to send verification code. Please try again.');
                        }
                    } else {
                        setError('Additional verification required.');
                    }
                } else {
                    setError('Additional verification required.');
                }
            }
        } catch (err: any) {
            console.error('[ClerkAuth] Error:', JSON.stringify(err, null, 2));
            const clerkError = err.errors?.[0];

            // Handle "account already exists" - auto-switch to login mode
            if (mode === 'SignUp' && clerkError?.code === 'form_identifier_exists') {
                setError('Account already exists. Please sign in instead.');
                setMode('Login');
            } else if (clerkError?.code === 'strategy_for_user_invalid' || clerkError?.message?.toLowerCase().includes('invalid verification strategy')) {
                setError('This sign-in method is unavailable. Try logging in with a different method.');
            } else if (clerkError?.code === 'form_password_incorrect') {
                setError('Incorrect password. Please try again or use Forgot Password.');
            } else if (clerkError?.message?.toLowerCase().includes('too many requests')) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(clerkError?.longMessage || clerkError?.message || 'Authentication failed. Please verify your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[authStyles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
                {/* Visual Header Background (Textured Design) */}
                <View style={[authStyles.visualHeader, { backgroundColor: theme.primaryDark, height: SCREEN_HEIGHT * 0.35 }]}>
                    <View style={[authStyles.blob, { backgroundColor: theme.accent, top: -40, right: -40, opacity: 0.6, transform: [{ rotate: '15deg' }] }]} />
                    <View style={[authStyles.blob, { backgroundColor: theme.primary, bottom: -60, left: -60, opacity: 0.4, transform: [{ rotate: '-10deg' }] }]} />
                    <View style={[authStyles.blob, { backgroundColor: theme.success, top: 40, left: -80, opacity: 0.3, width: 220, height: 220 }]} />

                    <SafeAreaView style={authStyles.headerSafeArea}>
                        <TouchableOpacity style={authStyles.miniBackButton} onPress={() => onNavigate(ScreenName.ACCOUNT_TYPE_SELECT)}>
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ marginTop: 'auto', marginBottom: 60, paddingHorizontal: 20 }}>
                            <TypeWriterText
                                text={mode === 'Login'
                                    ? (isCompanyMode ? 'Company Sign In' : 'Welcome back')
                                    : (isCompanyMode ? 'Create Company Account' : 'Create an account')}
                                style={authStyles.mainTitle}
                            />
                        </View>
                    </SafeAreaView>
                </View>

                {/* Main Auth Card */}
                <View style={[authStyles.card, {
                    backgroundColor: theme.surface,
                    marginTop: -50,
                    borderTopLeftRadius: 40,
                    borderTopRightRadius: 40,
                    paddingHorizontal: SCREEN_WIDTH * 0.08,
                    paddingTop: 40,
                    paddingBottom: 60,
                    flex: 1
                }]}>
                    {/* Two-Step Auth Flow */}
                    {!showEmailForm ? (
                        <>
                            {/* Initial Options: Google + Apple + Email buttons */}
                            <TouchableOpacity
                                style={[authStyles.socialButton, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                                activeOpacity={0.7}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                            >
                                <View style={{ width: 24, height: 24, marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
                                </View>
                                <Text style={[authStyles.socialButtonText, { color: '#1F2937' }]}>
                                    {loading ? 'WAITING...' : mode === 'Login' ? 'Sign in with Google' : 'Sign up with Google'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[authStyles.socialButton, { backgroundColor: '#000000', borderColor: '#000000', marginTop: 16 }]}
                                activeOpacity={0.7}
                                onPress={handleAppleLogin}
                                disabled={loading}
                            >
                                <MaterialIcons name="apple" size={24} color="#fff" style={{ marginRight: 12 }} />
                                <Text style={[authStyles.socialButtonText, { color: '#fff' }]}>
                                    {loading ? 'WAITING...' : mode === 'Login' ? 'Sign in with Apple' : 'Sign up with Apple'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[authStyles.socialButton, { backgroundColor: theme.primary, borderColor: theme.primary, marginTop: 16 }]}
                                activeOpacity={0.7}
                                onPress={() => { setError(null); setShowEmailForm(true); }}
                            >
                                <MaterialIcons name="email" size={24} color="#fff" style={{ marginRight: 12 }} />
                                <Text style={[authStyles.socialButtonText, { color: '#fff' }]}>
                                    {mode === 'Login' ? 'Sign in with Email' : 'Sign up with Email'}
                                </Text>
                            </TouchableOpacity>

                            {error && (
                                <Text style={[authStyles.errorTextSmall, { marginTop: 16 }]}>{error}</Text>
                            )}

                            <View style={authStyles.dividerContainer}>
                                <View style={[authStyles.dividerLine, { backgroundColor: theme.border }]} />
                                <Text style={[authStyles.dividerText, { color: theme.textSecondary }]}>or</Text>
                                <View style={[authStyles.dividerLine, { backgroundColor: theme.border }]} />
                            </View>

                            {/* Switch Mode Link */}
                            <TouchableOpacity onPress={() => { setError(null); setMode(mode === 'Login' ? 'SignUp' : 'Login'); }}>
                                <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14 }}>
                                    {mode === 'Login' ? "Don't have an account? " : "Already have an account? "}
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>
                                        {mode === 'Login' ? 'Sign Up' : 'Sign In'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Email Form (Step 2) */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                                onPress={() => { setError(null); setShowEmailForm(false); }}
                            >
                                <MaterialIcons name="arrow-back" size={20} color={theme.primary} />
                                <Text style={{ color: theme.primary, marginLeft: 8, fontWeight: '600' }}>Back to options</Text>
                            </TouchableOpacity>

                            {/* Email/Password Form */}
                            <View style={authStyles.formFields}>
                                {mode === 'SignUp' && (
                                    <>
                                        <TextInput
                                            style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                                            placeholder="First Name"
                                            placeholderTextColor={theme.textSecondary}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                        />
                                        <TextInput
                                            style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                                            placeholder="Last Name"
                                            placeholderTextColor={theme.textSecondary}
                                            value={lastName}
                                            onChangeText={setLastName}
                                        />
                                        <TextInput
                                            style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                                            placeholder="Username"
                                            placeholderTextColor={theme.textSecondary}
                                            autoCapitalize="none"
                                            value={username}
                                            onChangeText={(val: string) => {
                                                const sanitized = val.replace(/[^a-zA-Z0-9-_]/g, '');
                                                setUsername(sanitized);
                                                setHasBeenManuallyEdited(true);
                                            }}
                                        />
                                    </>
                                )}

                                <TextInput
                                    style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                                    placeholder="Email"
                                    placeholderTextColor={theme.textSecondary}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />

                                {mode === 'SignUp' && (
                                    <>
                                        <TouchableOpacity
                                            style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, justifyContent: 'center', marginBottom: 16 }]}
                                            onPress={() => setIsCountryModalVisible(true)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
                                                <Text style={{ color: country ? theme.text : theme.textSecondary, fontSize: 13, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>
                                                    {country ? countries.find((c: any) => c.name === country)?.flag + ' ' + country : 'Country'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 16 }}>
                                            {country && (
                                                <View style={{ height: 52, backgroundColor: '#1A1A24', borderColor: theme.border, borderWidth: 1, borderRightWidth: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
                                                    <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>
                                                        {countries.find((c: any) => c.name === country)?.dial_code}
                                                    </Text>
                                                </View>
                                            )}
                                            <TextInput
                                                style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: 0, flex: 1, borderTopLeftRadius: country ? 0 : 12, borderBottomLeftRadius: country ? 0 : 12 }]}
                                                placeholder="Phone Number"
                                                placeholderTextColor={theme.textSecondary}
                                                keyboardType="phone-pad"
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                            />
                                        </View>
                                    </>
                                )}

                                <View style={authStyles.passwordWrapper}>
                                    <TextInput
                                        style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border, marginBottom: mode === 'SignUp' ? 16 : 0 }]}
                                        placeholder="Password"
                                        placeholderTextColor={theme.textSecondary}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={[authStyles.eyeIcon, { top: mode === 'SignUp' ? 18 : 18 }]}
                                    >
                                        <MaterialIcons
                                            name={showPassword ? 'visibility-off' : 'visibility'}
                                            size={20}
                                            color={theme.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {mode === 'SignUp' && (
                                    <View style={authStyles.passwordWrapper}>
                                        <TextInput
                                            style={[authStyles.inputFull, { backgroundColor: '#1A1A24', color: theme.text, borderColor: theme.border }]}
                                            placeholder="Confirm Password"
                                            placeholderTextColor={theme.textSecondary}
                                            secureTextEntry={!showPassword}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                )}

                                {error && <Text style={authStyles.errorTextSmall}>{error}</Text>}

                                <TouchableOpacity
                                    style={[authStyles.primaryButton, { backgroundColor: theme.primary, marginTop: 24 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    <View style={authStyles.primaryButtonInner}>
                                        <Text style={authStyles.primaryButtonText}>
                                            {loading ? 'PLEASE WAIT...' : mode === 'Login' ? 'Login' : 'Create account'}
                                        </Text>
                                        {!loading && <MaterialIcons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />}
                                    </View>
                                </TouchableOpacity>

                                <Text style={[authStyles.termsText, { color: theme.textSecondary, marginTop: 24 }]}>
                                    By continuing, you agree to our{' '}
                                    <Text style={[authStyles.linkText, { color: theme.primary }]}>Privacy Policy</Text> and{' '}
                                    <Text style={[authStyles.linkText, { color: theme.primary }]}>Terms of Service</Text>.
                                </Text>

                                <View style={[authStyles.footer, { marginTop: 32 }]}>
                                    <Text style={[authStyles.footerText, { color: theme.textSecondary }]}>
                                        {mode === 'Login' ? "Don't have an account? " : "Have an account? "}
                                    </Text>
                                    <TouchableOpacity onPress={() => setMode(mode === 'Login' ? 'SignUp' : 'Login')}>
                                        <Text style={[authStyles.footerLink, { color: theme.primary }]}>
                                            {mode === 'Login' ? 'Sign up here' : 'Log in here'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Country Picker Modal */}
                <Modal
                    visible={isCountryModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsCountryModalVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                        <View style={{ height: '80%', backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Select Country</Text>
                                <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={{
                                    height: 50,
                                    backgroundColor: theme.background,
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    color: theme.text,
                                    marginBottom: 16
                                }}
                                placeholder="Search countries..."
                                placeholderTextColor={theme.textSecondary}
                                value={countrySearch}
                                onChangeText={setCountrySearch}
                            />

                            <FlatList
                                data={filteredCountries}
                                keyExtractor={(item: any) => item.code}
                                renderItem={({ item }: { item: any }) => (
                                    <TouchableOpacity
                                        style={{
                                            paddingVertical: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border,
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => {
                                            setCountry(item.name);
                                            setIsCountryModalVisible(false);
                                            setCountrySearch('');
                                        }}
                                    >
                                        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.flag}</Text>
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView >
        </KeyboardAvoidingView >
    );
};

const authStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    visualHeader: {
        height: 280,
        position: 'relative',
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    mainTitle: {
        fontSize: SCREEN_WIDTH < 375 ? 28 : 42,
        fontWeight: '900',
        color: 'white',
        lineHeight: SCREEN_WIDTH < 375 ? 34 : 46,
        letterSpacing: -1,
    },
    headerSafeArea: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20,
    },
    miniBackButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    card: {
        flex: 1,
        marginTop: -40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: 60,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
        borderRadius: 29,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 15,
        fontWeight: '600',
    },
    formFields: {
        gap: 12,
    },
    rowFields: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    inputHalf: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '500',
        borderWidth: 1,
    },
    inputFull: {
        width: '100%',
        height: 56,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '500',
        borderWidth: 1,
    },
    passwordWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
    },
    errorTextSmall: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: -8,
    },
    primaryButton: {
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
            }
        }),
    },
    primaryButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 16,
        paddingHorizontal: 8,
    },
    linkText: {
        fontWeight: '700',
        textDecorationLine: 'none',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '700',
        textDecorationLine: 'none',
    },
});

// ============================================================================
// FORGOT PASSWORD SCREEN
// ============================================================================

export const ForgotPasswordScreen = ({ onNavigate }: ScreenProps) => {
    const { theme } = useTheme();
    const { signIn, setActive, isLoaded } = useSignIn();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'email' | 'code' | 'password'>('email');

    const handleRequestCode = async () => {
        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }
        if (!isLoaded) return;

        setLoading(true);
        setError(null);
        const normalizedEmail = email.trim().toLowerCase();
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: normalizedEmail,
            });
            setStep('code');
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim() || code.length < 6) {
            setError('Please enter the 6-digit code');
            return;
        }
        if (!isLoaded) return;

        setLoading(true);
        setError(null);
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
            });
            if (result.status === 'needs_new_password') {
                setStep('password');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim()) {
            setError('Please enter a new password');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!isLoaded) return;

        setLoading(true);
        setError(null);
        try {
            const result = await signIn.resetPassword({ password: newPassword });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                const storedType = await getAccountType();
                onNavigate(storedType === 'company' ? ScreenName.COMPANY_DASHBOARD : ScreenName.HOME);
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'code') {
            setStep('email');
            setError(null);
        } else if (step === 'password') {
            setStep('code');
            setError(null);
        } else {
            onNavigate(ScreenName.AUTH);
        }
    };

    const getHeaderText = () => {
        switch (step) {
            case 'email': return 'Access Recovery';
            case 'code': return 'Verify Code';
            case 'password': return 'New Password';
        }
    };

    const getSubtitleText = () => {
        switch (step) {
            case 'email': return "Let's get you back to earning";
            case 'code': return 'Check your email for the code';
            case 'password': return 'Choose a strong password';
        }
    };

    return (
        <View style={[forgotStyles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[`${theme.primary}33`, 'transparent']}
                style={forgotStyles.headerGradient}
            >
                <View style={forgotStyles.headerContent}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={[forgotStyles.backButton, { backgroundColor: theme.surface }]}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[forgotStyles.title, { color: theme.text }]}>{getHeaderText()}</Text>
                    <Text style={[forgotStyles.subtitle, { color: theme.textSecondary }]}>{getSubtitleText()}</Text>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={forgotStyles.content}>
                {error && (
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
                        {error}
                    </Text>
                )}

                {step === 'email' && (
                    <>
                        <Text style={[forgotStyles.description, { color: `${theme.text}99` }]}>
                            Forgot your password? Enter your email below and we'll send a 6-digit reset code to your inbox.
                        </Text>

                        <View style={forgotStyles.fieldContainer}>
                            <Text style={[forgotStyles.fieldLabel, { color: theme.textSecondary }]}>Terminal ID (Email)</Text>
                            <View style={forgotStyles.inputContainer}>
                                <MaterialIcons
                                    name="alternate-email"
                                    size={20}
                                    color={theme.textSecondary}
                                    style={forgotStyles.inputIcon}
                                />
                                <TextInput
                                    style={[forgotStyles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="name@domain.com"
                                    placeholderTextColor={`${theme.text}44`}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleRequestCode}
                            disabled={loading}
                            style={[forgotStyles.submitButton, { backgroundColor: theme.text }]}
                        >
                            <Text style={[forgotStyles.submitButtonText, { color: theme.background }]}>
                                {loading ? 'Sending...' : 'Request Reset Code'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 'code' && (
                    <>
                        <Text style={[forgotStyles.description, { color: `${theme.text}99` }]}>
                            We sent a 6-digit code to <Text style={{ color: theme.primary, fontWeight: '700' }}>{email}</Text>. Enter it below.
                        </Text>

                        <View style={forgotStyles.fieldContainer}>
                            <Text style={[forgotStyles.fieldLabel, { color: theme.textSecondary }]}>Verification Code</Text>
                            <View style={forgotStyles.inputContainer}>
                                <MaterialIcons
                                    name="lock-outline"
                                    size={20}
                                    color={theme.textSecondary}
                                    style={forgotStyles.inputIcon}
                                />
                                <TextInput
                                    style={[forgotStyles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={`${theme.text}44`}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={code}
                                    onChangeText={setCode}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleVerifyCode}
                            disabled={loading || code.length < 6}
                            style={[forgotStyles.submitButton, { backgroundColor: theme.text }, code.length < 6 && { opacity: 0.4 }]}
                        >
                            <Text style={[forgotStyles.submitButtonText, { color: theme.background }]}>
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 'password' && (
                    <>
                        <Text style={[forgotStyles.description, { color: `${theme.text}99` }]}>
                            Choose a new password for your account.
                        </Text>

                        <View style={forgotStyles.fieldContainer}>
                            <Text style={[forgotStyles.fieldLabel, { color: theme.textSecondary }]}>New Password</Text>
                            <View style={forgotStyles.inputContainer}>
                                <MaterialIcons
                                    name="lock-outline"
                                    size={20}
                                    color={theme.textSecondary}
                                    style={forgotStyles.inputIcon}
                                />
                                <TextInput
                                    style={[forgotStyles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="New password"
                                    placeholderTextColor={`${theme.text}44`}
                                    secureTextEntry={!showPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 16, zIndex: 10 }}
                                >
                                    <MaterialIcons
                                        name={showPassword ? 'visibility-off' : 'visibility'}
                                        size={20}
                                        color={theme.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[forgotStyles.fieldContainer, { marginTop: 0 }]}>
                            <Text style={[forgotStyles.fieldLabel, { color: theme.textSecondary }]}>Confirm Password</Text>
                            <View style={forgotStyles.inputContainer}>
                                <MaterialIcons
                                    name="lock-outline"
                                    size={20}
                                    color={theme.textSecondary}
                                    style={forgotStyles.inputIcon}
                                />
                                <TextInput
                                    style={[forgotStyles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="Confirm password"
                                    placeholderTextColor={`${theme.text}44`}
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleResetPassword}
                            disabled={loading || !newPassword}
                            style={[forgotStyles.submitButton, { backgroundColor: theme.text }, !newPassword && { opacity: 0.4 }]}
                        >
                            <Text style={[forgotStyles.submitButtonText, { color: theme.background }]}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const forgotStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        height: 192,
        position: 'relative',
    },
    headerContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 32,
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        padding: 32,
        justifyContent: 'center',
    },
    description: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
        marginBottom: 24,
    },
    fieldContainer: {
        marginBottom: 24,
    },
    fieldLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginLeft: 4,
        marginBottom: 8,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        height: 52,
        paddingLeft: 48,
        paddingRight: 16,
        fontWeight: '500',
        fontSize: 15,
    },
    submitButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    submitButtonText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

// ============================================================================
// OTP VERIFICATION SCREEN
// ============================================================================



export const OTPScreen = ({ onNavigate, userEmail }: ScreenProps) => {
    const { theme } = useTheme();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(59);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<Array<any | null>>([]);

    const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp();
    const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn();

    const isSignInVerification = signIn?.status === 'needs_first_factor' || signIn?.status === 'needs_second_factor';

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (val: string, index: number) => {
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val.slice(-1);
        setOtp(newOtp);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            alert('Please enter the complete 6-digit code');
            return;
        }

        if (!signUpLoaded || !signInLoaded) return;

        setLoading(true);
        setError(null);

        try {
            if (isSignInVerification) {
                const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
                if (result.status === 'complete') {
                    await setSignInActive({ session: result.createdSessionId });
                    const storedType = await getAccountType();
                    onNavigate(storedType === 'company' ? ScreenName.COMPANY_DASHBOARD : ScreenName.HOME);
                } else {
                    // This handles 'missing_requirements' specifically without navigating
                    setError(`Verification Status: ${result.status}. Please complete the required steps.`);
                }
            } else {
                const result = await signUp.attemptEmailAddressVerification({ code });
                if (result.status === 'complete') {
                    await setSignUpActive({ session: result.createdSessionId });
                    const storedType = await getAccountType();
                    onNavigate(storedType === 'company' ? ScreenName.COMPANY_DASHBOARD : ScreenName.HOME);
                } else if (result.status === 'missing_requirements') {
                    // Log the missing fields for developer insight
                    console.log('[SignUp] Missing Requirements:', result.missingFields);
                    setError('Almost there! Some additional details are required to complete your account.');
                } else {
                    setError(`Verification Status: ${result.status}. Please check the code and try again.`);
                }
            }
        } catch (err: any) {
            console.error('[Verify Code Error]', err);
            const clerkError = err.errors?.[0];

            // If already verified, we can safely attempt to proceed ONLY if we have a valid session context
            if (clerkError?.code === 'verification_already_verified' || clerkError?.message?.includes('already verified')) {
                const sessionReady = isSignInVerification ? signIn.createdSessionId : signUp.createdSessionId;
                if (sessionReady) {
                    if (isSignInVerification) await setSignInActive({ session: sessionReady });
                    else await setSignUpActive({ session: sessionReady });
                    const storedType = await getAccountType();
                    onNavigate(storedType === 'company' ? ScreenName.COMPANY_DASHBOARD : ScreenName.HOME);
                } else {
                    setError('Already verified. Please try to login directly.');
                }
            } else {
                setError(clerkError?.message || 'Verification failed. Please check the code.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || !signUpLoaded || !signInLoaded) return;

        try {
            if (isSignInVerification) {
                const emailFactor = signIn.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
                if (emailFactor) {
                    await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (emailFactor as any).emailAddressId });
                }
            } else {
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            }
            setCountdown(59);
            alert('New code sent!');
        } catch (err: any) {
            alert(err.errors?.[0]?.message || 'Failed to resend code');
        }
    };

    return (
        <View style={[otpStyles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[`${theme.primary}33`, 'transparent']}
                style={otpStyles.headerGradient}
            >
                <View style={otpStyles.headerContent}>
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.AUTH)}
                        style={[otpStyles.backButton, { backgroundColor: theme.surface }]}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[otpStyles.title, { color: theme.text }]}>Verify Identity</Text>
                    <Text style={[otpStyles.subtitle, { color: theme.textSecondary }]}>Enter the validation sequence</Text>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={otpStyles.content}>
                <Text style={[otpStyles.description, { color: `${theme.text}99` }]}>
                    Enter the 6-digit code we just sent to <Text style={{ color: theme.text, fontWeight: '700' }}>{userEmail || signUp?.emailAddress || signIn?.identifier || 'your inbox'}</Text>.
                </Text>

                {error && (
                    <Text style={{ color: theme.error, marginBottom: 16, fontWeight: 'bold' }}>{error}</Text>
                )}

                {/* OTP Inputs */}
                <View style={otpStyles.otpRow}>
                    {otp.map((digit, i) => (
                        <TextInput
                            key={i}
                            ref={(ref: any | null) => { inputRefs.current[i] = ref; }}
                            style={[otpStyles.otpInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.primary }]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={digit}
                            onChangeText={(val: string) => handleChange(val, i)}
                            onKeyPress={({ nativeEvent }: any) => handleKeyPress(nativeEvent.key, i)}
                        />
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={otpStyles.actionsContainer}>
                    <TouchableOpacity
                        onPress={handleVerify}
                        style={[otpStyles.verifyButton, { backgroundColor: theme.text }]}
                    >
                        <Text style={[otpStyles.verifyButtonText, { color: theme.background }]}>Verify & Access</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleResend}
                        disabled={countdown > 0}
                        style={otpStyles.resendButton}
                    >
                        <Text style={[
                            otpStyles.resendText,
                            { color: theme.text },
                            countdown > 0 && { color: theme.textSecondary },
                        ]}>
                            {countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const otpStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        height: 192,
        position: 'relative',
    },
    headerContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 32,
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        padding: 32,
        paddingTop: 48,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    description: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
        marginBottom: 32,
        textAlign: 'center',
    },
    otpRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 32,
    },
    otpInput: {
        flex: 1,
        maxWidth: 52,
        height: 56,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
    },
    actionsContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 40,
    },
    verifyButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    verifyButtonText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resendButton: {
        width: '100%',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
