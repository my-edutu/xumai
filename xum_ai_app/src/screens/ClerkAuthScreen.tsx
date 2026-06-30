/**
 * Clerk Authentication Screens
 * 
 * Uses Clerk's useSignIn and useSignUp hooks with custom styling.
 * Following the official Clerk Expo documentation.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
    onNavigate: (screen: any) => void;
    onAuthSuccess: () => void;
}

/**
 * Main Authentication Screen
 * Handles both Sign In and Sign Up with Clerk
 */
export const ClerkAuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const { theme } = useTheme();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Clerk hooks
    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

    // OAuth hooks
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
    const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const { createdSessionId, setActive } = await startGoogleOAuth({
                redirectUrl: Linking.createURL('/oauth-callback', { scheme: 'xum' })
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                onAuthSuccess();
            }
        } catch (err: any) {
            console.error('Google OAuth error:', JSON.stringify(err, null, 2));
            setError('Google sign-in failed: ' + (err.errors?.[0]?.message || 'Handshake failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            setIsLoading(true);
            const { createdSessionId, setActive } = await startAppleOAuth({
                redirectUrl: Linking.createURL('/oauth-callback', { scheme: 'xum' })
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                onAuthSuccess();
            }
        } catch (err: any) {
            console.error('Apple OAuth error:', JSON.stringify(err, null, 2));
            setError('Apple sign-in failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Sign In
    const handleSignIn = async () => {
        if (!signInLoaded || !signIn) return;
        setIsLoading(true);
        setError('');

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await setSignInActive({ session: signInAttempt.createdSessionId });
                onAuthSuccess();
            } else {
                console.log('Sign in requires additional steps:', JSON.stringify(signInAttempt, null, 2));
                setError('Additional verification required');
            }
        } catch (err: any) {
            console.error('Sign in error:', JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || 'Sign in failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Sign Up
    const handleSignUp = async () => {
        if (!signUpLoaded || !signUp) return;
        setIsLoading(true);
        setError('');

        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: firstName || undefined,
            });

            // Send email verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            console.error('Sign up error:', JSON.stringify(err, null, 2));

            // Handle user already exists
            const isExistingUser = err.errors?.some((e: any) => e.code === 'form_identifier_exists');
            if (isExistingUser) {
                setError('Account already exists. Switching to sign in...');
                setTimeout(() => {
                    setMode('signin');
                    handleSignIn();
                }, 1500);
            } else {
                setError(err.errors?.[0]?.message || 'Sign up failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Email Verification
    const handleVerifyEmail = async () => {
        if (!signUpLoaded || !signUp) return;
        setIsLoading(true);
        setError('');

        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code: verificationCode,
            });

            if (signUpAttempt.status === 'complete') {
                await setSignUpActive({ session: signUpAttempt.createdSessionId });
                onAuthSuccess();
            } else {
                console.error('Verification incomplete:', JSON.stringify(signUpAttempt, null, 2));
                setError('Verification incomplete. Please try again.');
            }
        } catch (err: any) {
            console.error('Verification error:', JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Verification Screen
    if (pendingVerification) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <LinearGradient
                    colors={[theme.primary, theme.primaryDark]}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setPendingVerification(false)}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <MaterialIcons name="mark-email-read" size={48} color="#fff" />
                        <Text style={styles.headerTitle}>CHECK YOUR EMAIL</Text>
                        <Text style={styles.headerSubtitle}>
                            We sent a verification code to {email}
                        </Text>
                    </View>
                </LinearGradient>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.formContainer}
                >
                    <View style={styles.form}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>VERIFICATION CODE</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor={theme.textSecondary}
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        {error ? (
                            <View style={styles.errorContainer}>
                                <MaterialIcons name="error-outline" size={16} color={theme.error} />
                                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: theme.primary }, (isLoading || verificationCode.length < 6) && styles.buttonDisabled]}
                            onPress={handleVerifyEmail}
                            disabled={isLoading || verificationCode.length < 6}
                        >
                            {isLoading ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <ActivityIndicator color="#fff" />
                                    <TouchableOpacity onPress={() => setIsLoading(false)} style={{ marginLeft: 6, paddingVertical: 4, paddingHorizontal: 8 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>CANCEL</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.primaryButtonText}>VERIFY & CONTINUE</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    }

    // Main Auth Screen
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.logoText}>XUM AI</Text>
                    <Text style={styles.headerTitle}>
                        {mode === 'signin' ? 'WELCOME BACK' : 'JOIN THE NETWORK'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {mode === 'signin'
                            ? 'Sign in to continue earning'
                            : 'Create an account to start contributing'}
                    </Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.form}>
                        {/* Name field (signup only) */}
                        {mode === 'signup' && (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>NAME</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="Your name"
                                    placeholderTextColor={theme.textSecondary}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                />
                            </>
                        )}

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>EMAIL</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            placeholder="you@example.com"
                            placeholderTextColor={theme.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>PASSWORD</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            placeholder="••••••••"
                            placeholderTextColor={theme.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        />

                        {error ? (
                            <View style={styles.errorContainer}>
                                <MaterialIcons name="error-outline" size={16} color={theme.error} />
                                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: theme.primary }, (isLoading || !email || !password) && styles.buttonDisabled]}
                            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                            disabled={isLoading || !email || !password}
                        >
                            {isLoading ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <ActivityIndicator color="#fff" />
                                    <TouchableOpacity onPress={() => setIsLoading(false)} style={{ marginLeft: 6, paddingVertical: 4, paddingHorizontal: 8 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>CANCEL</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR CONTINUE WITH</Text>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={[styles.socialButton, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <FontAwesome name="google" size={20} color={theme.text} />
                                <Text style={[styles.socialButtonText, { color: theme.text }]}>GOOGLE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.socialButton, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={handleAppleSignIn}
                                disabled={isLoading}
                            >
                                <FontAwesome name="apple" size={20} color={theme.text} />
                                <Text style={[styles.socialButtonText, { color: theme.text }]}>APPLE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Toggle mode */}
                        <TouchableOpacity
                            style={styles.toggleContainer}
                            onPress={() => {
                                setMode(mode === 'signin' ? 'signup' : 'signin');
                                setError('');
                            }}
                        >
                            <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
                                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    headerContent: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 4,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 2,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        maxWidth: 280,
    },
    formContainer: {
        flex: 1,
    },
    form: {
        padding: 24,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        fontSize: 16,
        marginBottom: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 13,
        flex: 1,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
    toggleContainer: {
        alignItems: 'center',
        marginTop: 24,
        paddingVertical: 12,
    },
    toggleText: {
        fontSize: 14,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 10,
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
});

export default ClerkAuthScreen;
