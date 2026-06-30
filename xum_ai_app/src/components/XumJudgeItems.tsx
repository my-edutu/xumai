import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import * as TaskService from '../services/taskService';
import { getXumJudgeTasks } from '../services/marketplaceService';
import { EmptyStateCard } from './EmptyStateCard';

interface XumJudgeItemsProps {
    onNavigate: (s: ScreenName) => void;
    userId: string;
}

export const XumJudgeItems = ({ onNavigate, userId }: XumJudgeItemsProps) => {
    const { theme } = useTheme();
    const [judgeTasks, setJudgeTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        const loadTasks = async () => {
            setIsLoading(true);
            try {
                const data = await getXumJudgeTasks(userId);
                setJudgeTasks(data.slice(0, 2)); // Show only 2 on home
            } catch (error) {
                console.error('Error loading judge tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTasks();
    }, [userId]);

    if (isLoading) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>Loading judge tasks...</Text>
            </View>
        );
    }

    if (judgeTasks.length === 0) {
        return (
            <EmptyStateCard
                title="NO JUDGE TASKS"
                description="Everything is verified for now. Check back soon!"
                icon="gavel"
            />
        );
    }

    return (
        <>
            {judgeTasks.map((task) => (
                <TouchableOpacity key={task.id} onPress={() => onNavigate(ScreenName.XUM_JUDGE)} style={[styles.judgeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.judgeIconBox, { backgroundColor: `${task.icon_color}15` }]}>
                        <MaterialIcons name={task.icon_name} size={22} color={task.icon_color} />
                    </View>
                    <View style={styles.judgeInfo}>
                        <Text style={[styles.judgeTitle, { color: theme.text }]}>{task.title}</Text>
                        <Text style={[styles.judgeSubtitle, { color: theme.textSecondary }]}>{task.subtitle}</Text>
                    </View>
                    <View style={styles.judgeReward}>
                        <Text style={[styles.judgeRewardValue, { color: theme.success }]}>${(task.reward || 0).toFixed(2)}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </>
    );
};

const styles = StyleSheet.create({
    judgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    judgeIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
    },
    judgeInfo: {
        flex: 1,
    },
    judgeTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    judgeSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    judgeReward: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    judgeRewardValue: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
});
