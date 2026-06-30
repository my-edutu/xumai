import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Animated, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, ThemeId } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface ContributorHubModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (s: ScreenName) => void;
    currentTheme: ThemeId;
    onLogout?: () => void;
    unreadCount?: number;
}

export const ContributorHubModal = ({ visible, onClose, onNavigate, currentTheme, onLogout, unreadCount }: ContributorHubModalProps) => {
    const { theme } = useTheme();
    // ... existing hook calls ...
    const screenHeight = Dimensions.get('window').height;
    const [expanded, setExpanded] = useState(false);
    const expandAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setExpanded(false);
            expandAnim.setValue(0);
        }
    }, [visible]);

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 20 && !expanded) {
            setExpanded(true);
            Animated.spring(expandAnim, {
                toValue: 1,
                useNativeDriver: false,
                friction: 8,
            }).start();
        }
    };

    const modalHeight = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [screenHeight * 0.55, screenHeight * 0.92],
    });

    const menuItems = [
        { label: 'PROFILE', icon: 'person', color: '#3b82f6', screen: ScreenName.PROFILE },
        { label: 'WALLET', icon: 'account-balance-wallet', color: theme.success, screen: ScreenName.WALLET },
        { label: 'REFERRALS', icon: 'group-add', color: '#f59e0b', screen: ScreenName.REFERRALS },
        { label: 'SUBMISSIONS', icon: 'assignment', color: '#10b981', screen: ScreenName.SUBMISSION_TRACKER },
        { label: 'NOTIFICATIONS', icon: 'notifications', color: theme.warning, screen: ScreenName.NOTIFICATIONS },
        { label: 'RANKING', icon: 'military-tech', color: '#a855f7', screen: ScreenName.LEADERBOARD },
        { label: 'THEME', icon: 'palette', color: '#ec4899', subtitle: `${currentTheme.toUpperCase()} MODE`, screen: ScreenName.APPEARANCE_LABS },
        { label: 'SETTINGS', icon: 'settings', color: '#64748b', screen: ScreenName.SETTINGS },
        { label: 'SUPPORT', icon: 'help-center', color: '#06b6d4', screen: ScreenName.SUPPORT },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={hubStyles.overlay} activeOpacity={1} onPress={onClose}>
                <Animated.View style={[hubStyles.container, { height: modalHeight, backgroundColor: theme.background, maxHeight: screenHeight }]}>
                    <TouchableOpacity activeOpacity={1} onPress={() => { }} style={{ flex: 1 }}>
                        <View style={hubStyles.dragHandle} />
                        <View style={hubStyles.header}>
                            <Text style={[hubStyles.title, { color: theme.text }]}>MENU</Text>
                            <TouchableOpacity onPress={onClose} style={[hubStyles.closeButton, { backgroundColor: theme.surfaceHighlight }]}>
                                <MaterialIcons name="close" size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            <View style={hubStyles.list}>
                                {menuItems.map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[hubStyles.listItem, { backgroundColor: theme.surface }]}
                                        onPress={() => { onClose(); item.screen && onNavigate(item.screen); }}
                                    >
                                        <View style={[hubStyles.listIconBox, { backgroundColor: `${item.color}15` }]}>
                                            <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                                        </View>
                                        <View style={hubStyles.listContent}>
                                            <Text style={[hubStyles.listLabel, { color: theme.text }]}>{item.label}</Text>
                                            {item.subtitle && <Text style={[hubStyles.listSubtitle, { color: item.color }]}>{item.subtitle}</Text>}
                                        </View>

                                        {item.label === 'NOTIFICATIONS' && unreadCount ? (
                                            <View style={{
                                                backgroundColor: theme.error,
                                                borderRadius: 12,
                                                minWidth: 24,
                                                height: 24,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 8,
                                                paddingHorizontal: 6
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </Text>
                                            </View>
                                        ) : null}

                                        <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={hubStyles.logoutButton} onPress={() => { onClose(); onLogout && onLogout(); }}>
                                <MaterialIcons name="logout" size={20} color={theme.error} />
                                <Text style={[hubStyles.logoutText, { color: theme.error }]}>LOG OUT</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const hubStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#0a0a0f',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dragHandle: {
        width: 48,
        height: 5,
        backgroundColor: 'rgba(128,128,128,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        marginTop: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 2,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 22,
        padding: 10,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        gap: 14,
        marginBottom: 32,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 22,
        padding: 18,
        minHeight: 72,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    listIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    listContent: {
        flex: 1,
    },
    listLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    listSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 1.5,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
        borderRadius: 22,
        paddingVertical: 22,
        minHeight: 64,
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.15)',
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#f43f5e',
        letterSpacing: 2.5,
    },
});
