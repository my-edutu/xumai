import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface BottomNavigationProps {
    activeScreen: ScreenName;
    onNavigate: (s: ScreenName) => void;
    onOpenNeuralInput: () => void;
    onOpenContributorHub: () => void;
}

export const BottomNavigation = ({
    activeScreen,
    onNavigate,
    onOpenNeuralInput,
    onOpenContributorHub,
}: BottomNavigationProps) => {
    const { theme } = useTheme();

    const navItems: { label: string; icon: string; screen?: ScreenName; action?: () => void }[] = [
        { label: 'HOME', icon: 'home', screen: ScreenName.HOME },
        { label: 'TASK', icon: 'explore', screen: ScreenName.TASK_MARKETPLACE },
        { label: 'ADD', icon: 'add', action: onOpenNeuralInput },
        { label: 'WALLET', icon: 'account-balance-wallet', screen: ScreenName.WALLET },
        { label: 'MENU', icon: 'menu', action: onOpenContributorHub },
    ];

    return (
        <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            {navItems.map((item, i) => {
                if (item.label === 'ADD') {
                    return (
                        <TouchableOpacity key={i} onPress={item.action} style={[styles.centerButton, { backgroundColor: theme.primary }]}>
                            <MaterialIcons name="add" size={32} color="#fff" />
                        </TouchableOpacity>
                    );
                }
                const isActive = activeScreen === item.screen;
                return (
                    <TouchableOpacity
                        key={i}
                        // If it has an action, call it. Otherwise if it has a screen, navigate to it.
                        onPress={() => item.action ? item.action() : item.screen && onNavigate(item.screen)}
                        style={styles.navItem}
                    >
                        <MaterialIcons
                            name={item.icon as any}
                            size={24}
                            color={isActive ? theme.primary : theme.textSecondary}
                        />
                        <Text style={[styles.navLabel, isActive && { color: theme.primary }, !isActive && { color: theme.textSecondary }]}>{item.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 20,
        borderTopWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 8,
        minHeight: 52,
        justifyContent: 'center',
        zIndex: 1,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 1,
    },
    centerButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -32,
        shadowColor: '#000', // Default shadow color, theme specific might override if needed but this is generic
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
});
