/**
 * XUM AI — Referrals Screen
 * Unique referral code, share link, history, and milestone progress.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Share,
    Clipboard,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { createGlobalStyles } from '../styles';
import { supabase } from '../supabaseClient';
import { deriveReferralCode, referralLinkFor } from '../services/referralService';

interface ReferralsScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
    session: any;
}

const MILESTONES = [
    { count: 1, reward: 2.00, label: 'First Referral' },
    { count: 5, reward: 10.00, label: '5 Referrals' },
    { count: 10, reward: 25.00, label: '10 Referrals' },
    { count: 25, reward: 75.00, label: '25 Referrals' },
    { count: 50, reward: 200.00, label: '50 Referrals' },
];

export const ReferralsScreen: React.FC<ReferralsScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);

    const [referrals, setReferrals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalEarned, setTotalEarned] = useState(0);
    const [copied, setCopied] = useState(false);

    // Shared derivation — must match apply_referral() in the SQL migration.
    const referralCode = deriveReferralCode(session?.user?.id);
    const referralLink = referralLinkFor(referralCode);

    useEffect(() => {
        loadReferrals();
    }, [session?.user?.id]);

    const loadReferrals = async () => {
        if (!session?.user?.id || !supabase) {
            setIsLoading(false);
            return;
        }
        try {
            const { data } = await supabase
                .from('referrals')
                .select('*, referred:referred_id(full_name, email, created_at)')
                .eq('referrer_id', session.user.id)
                .order('created_at', { ascending: false });

            setReferrals(data || []);
            const earned = (data || []).reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0);
            setTotalEarned(earned);
        } catch (e) {
            setReferrals([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        Clipboard.setString(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join XUM AI and start earning by contributing data for AI training!\n\nUse my referral code: ${referralCode}\n\nSign up: ${referralLink}`,
                title: 'Join XUM AI',
            });
        } catch (err) {
            Alert.alert('Error', 'Could not share. Try copying the code instead.');
        }
    };

    const completedReferrals = referrals.filter((r: any) => r.referred).length;
    const nextMilestone = MILESTONES.find(m => m.count > completedReferrals) || MILESTONES[MILESTONES.length - 1];
    const prevMilestone = MILESTONES.filter(m => m.count <= completedReferrals).pop() || { count: 0 };
    const progressPercent = Math.min(
        100,
        ((completedReferrals - prevMilestone.count) / Math.max(1, nextMilestone.count - prevMilestone.count)) * 100
    );

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>REFERRALS</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Earnings Card */}
                <View style={{
                    backgroundColor: theme.primary,
                    borderRadius: 20,
                    padding: 24,
                    marginBottom: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <View>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
                            TOTAL REFERRED
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 }}>
                            {completedReferrals}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                            Earned: ${totalEarned.toFixed(2)}
                        </Text>
                    </View>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <MaterialIcons name="group-add" size={32} color="#fff" />
                    </View>
                </View>

                {/* Next Milestone Progress */}
                <View style={{
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 12 }}>
                        Next Milestone: {nextMilestone.label}
                    </Text>
                    <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, marginBottom: 8 }}>
                        <View style={{
                            height: 8,
                            width: `${progressPercent}%`,
                            backgroundColor: theme.primary,
                            borderRadius: 4,
                        }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {completedReferrals}/{nextMilestone.count} referrals
                        </Text>
                        <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700' }}>
                            +${nextMilestone.reward.toFixed(2)} bonus
                        </Text>
                    </View>
                </View>

                {/* Referral Code */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>YOUR REFERRAL CODE</Text>
                <View style={{
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: theme.primary,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                }}>
                    <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', letterSpacing: 4, marginBottom: 8 }}>
                        {referralCode}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
                        Share this code. When friends sign up, you both earn rewards.
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={handleCopy}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: copied ? `${theme.success}15` : theme.surface,
                            borderRadius: 14,
                            paddingVertical: 16,
                            borderWidth: 1.5,
                            borderColor: copied ? theme.success : theme.border,
                            gap: 8,
                        }}
                    >
                        <MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color={copied ? theme.success : theme.text} />
                        <Text style={{ fontWeight: '700', color: copied ? theme.success : theme.text }}>
                            {copied ? 'Copied!' : 'Copy Code'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleShare}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.primary,
                            borderRadius: 14,
                            paddingVertical: 16,
                            gap: 8,
                        }}
                    >
                        <MaterialIcons name="share" size={20} color="#fff" />
                        <Text style={{ fontWeight: '700', color: '#fff' }}>Share Link</Text>
                    </TouchableOpacity>
                </View>

                {/* Milestone Rewards Table */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MILESTONE REWARDS</Text>
                {MILESTONES.map((m) => {
                    const achieved = completedReferrals >= m.count;
                    return (
                        <View
                            key={m.count}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: achieved ? `${theme.success}08` : theme.surface,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: achieved ? `${theme.success}30` : theme.border,
                            }}
                        >
                            <View style={{
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: achieved ? `${theme.success}20` : `${theme.primary}10`,
                                justifyContent: 'center', alignItems: 'center',
                                marginRight: 14,
                            }}>
                                <MaterialIcons
                                    name={achieved ? 'check-circle' : 'emoji-events'}
                                    size={22}
                                    color={achieved ? theme.success : theme.primary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{m.label}</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    Invite {m.count} friend{m.count > 1 ? 's' : ''}
                                </Text>
                            </View>
                            <Text style={{ color: achieved ? theme.success : theme.textSecondary, fontWeight: '800', fontSize: 15 }}>
                                +${m.reward.toFixed(2)}
                            </Text>
                        </View>
                    );
                })}

                {/* Referral History */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>REFERRAL HISTORY</Text>

                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 16 }} />
                ) : referrals.length === 0 ? (
                    <View style={{
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 32,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <MaterialIcons name="people-outline" size={40} color={theme.textSecondary} style={{ marginBottom: 12 }} />
                        <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                            No referrals yet. Share your code to start earning!
                        </Text>
                    </View>
                ) : (
                    referrals.map((ref: any, i: number) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.surface,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                        >
                            <View style={{
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: `${theme.primary}20`,
                                justifyContent: 'center', alignItems: 'center',
                                marginRight: 14,
                            }}>
                                <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 16 }}>
                                    {(ref.referred?.full_name || ref.referred?.email || 'U')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontWeight: '700' }}>
                                    {ref.referred?.full_name || ref.referred?.email || 'Anonymous'}
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    Joined {ref.referred?.created_at
                                        ? new Date(ref.referred.created_at).toLocaleDateString()
                                        : 'recently'}
                                </Text>
                            </View>
                            {ref.reward_amount > 0 && (
                                <Text style={{ color: theme.success, fontWeight: '700' }}>
                                    +${Number(ref.reward_amount).toFixed(2)}
                                </Text>
                            )}
                            {ref.paid_out && (
                                <MaterialIcons name="check-circle" size={18} color={theme.success} style={{ marginLeft: 8 }} />
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};
