import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SupportScreenProps {
    onNavigate: (screen: any) => void;
    onBack?: () => void;
}

const faqs = [
    {
        q: "How do I earn rewards?",
        a: "You earn rewards by completing tasks in the Task Marketplace. Each task has a specified reward amount in USD. Once your submission is approved by our verification system, the funds are added to your wallet.",
        icon: 'payments'
    },
    {
        q: "What is XUM LinguaSense?",
        a: "LinguaSense is our advanced linguistic training engine. By translating or verifying text snippets, you help train AI models to understand local dialects and cultural nuances more accurately.",
        icon: 'translate'
    },
    {
        q: "How can I withdraw my funds?",
        a: "Navigate to the Wallet screen and tap 'Withdraw'. You can transfer your verified earnings to your linked PayPal or bank account once you reach the minimum threshold of $10.00.",
        icon: 'account-balance-wallet'
    },
    {
        q: "Why was my task rejected?",
        a: "Tasks are cross-verified by multiple nodes. Rejections usually happen due to poor audio quality, blurry images, or inaccurate translations. Always follow the task hints for the best results!",
        icon: 'report-problem'
    }
];

export const SupportScreen: React.FC<SupportScreenProps> = ({ onNavigate, onBack }) => {
    const { theme } = useTheme();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const contactEmail = () => {
        Linking.openURL('mailto:info@xumai.app');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>HELP CENTRE</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Contact Banner */}
                <LinearGradient
                    colors={[theme.primary, theme.primaryDark]}
                    style={styles.banner}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Need Protocol Help?</Text>
                        <Text style={styles.bannerSubtitle}>Our support nodes are active 24/7 to assist with your contributions.</Text>
                        <TouchableOpacity style={styles.contactButton} onPress={contactEmail}>
                            <MaterialIcons name="email" size={18} color={theme.primary} />
                            <Text style={[styles.contactButtonText, { color: theme.primary }]}>CONTACT SUPPORT</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bannerIcon}>
                        <MaterialIcons name="support-agent" size={100} color="rgba(255,255,255,0.15)" />
                    </View>
                </LinearGradient>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>FREQUENTLY ASKED QUESTIONS</Text>

                <View style={styles.faqList}>
                    {faqs.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.faqItem,
                                { backgroundColor: theme.surface, borderColor: theme.border },
                                expandedIndex === index && { borderColor: theme.primary }
                            ]}
                            onPress={() => toggleExpand(index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <View style={[styles.faqIconBox, { backgroundColor: `${theme.primary}10` }]}>
                                    <MaterialIcons name={item.icon as any} size={20} color={theme.primary} />
                                </View>
                                <Text style={[styles.faqQuestion, { color: theme.text }]}>{item.q}</Text>
                                <MaterialIcons
                                    name={expandedIndex === index ? "expand-less" : "expand-more"}
                                    size={24}
                                    color={theme.textSecondary}
                                />
                            </View>
                            {expandedIndex === index && (
                                <View style={[styles.faqAnswerContainer, { borderTopColor: theme.border }]}>
                                    <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{item.a}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Links */}
                <View style={styles.quickLinks}>
                    <TouchableOpacity style={[styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialIcons name="description" size={24} color={theme.primary} />
                        <Text style={[styles.linkText, { color: theme.text }]}>Terms & Privacy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialIcons name="bug-report" size={24} color={theme.primary} />
                        <Text style={[styles.linkText, { color: theme.text }]}>Report a Bug</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>XUM AI Help Center v1.2</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? 24 : 12, // Matched with HomeScreen padding
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    banner: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    bannerContent: {
        flex: 1,
        zIndex: 1,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20,
    },
    contactButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
    },
    contactButtonText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bannerIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    faqList: {
        gap: 12,
        marginBottom: 32,
    },
    faqItem: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    faqIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
    },
    faqAnswerContainer: {
        padding: 16,
        paddingTop: 0,
        borderTopWidth: 1,
    },
    faqAnswer: {
        fontSize: 13,
        lineHeight: 20,
        paddingTop: 12,
    },
    quickLinks: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    linkCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 12,
        fontWeight: '700',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 2,
        marginBottom: 20,
    },
});
