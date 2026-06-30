import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    StatusBar,
    SafeAreaView,
    Platform
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

import { UserService } from '../services/userService';
import { useUser } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

interface TaskInterestsProps {
    onNavigate: (screen: ScreenName) => void;
}

interface TaskInterest {
    id: string;
    title: string;
    description: string;
    icon: any; // Icon component name
    iconType: 'Material' | 'Ionicons' | 'FontAwesome';
    color: string;
}

const TASK_INTERESTS: TaskInterest[] = [
    {
        id: 'voice',
        title: 'Voice Recording',
        description: 'Read sentences or describe images in your native language.',
        icon: 'microphone',
        iconType: 'FontAwesome',
        color: '#8b5cf6', // Violet
    },
    {
        id: 'image',
        title: 'Image Capture',
        description: 'Take photos of objects, places, or documents.',
        icon: 'camera',
        iconType: 'FontAwesome',
        color: '#ec4899', // Pink
    },
    {
        id: 'video',
        title: 'Video Recording',
        description: 'Record short videos of actions or environments.',
        icon: 'videocam',
        iconType: 'Ionicons',
        color: '#f43f5e', // Rose
    },
    {
        id: 'text',
        title: 'Translation & Text',
        description: 'Translate text or write descriptions.',
        icon: 'language',
        iconType: 'Material',
        color: '#3b82f6', // Blue
    },
    {
        id: 'validation',
        title: 'Validation & Review',
        description: 'Verify the accuracy of other users\' submissions.',
        icon: 'check-circle',
        iconType: 'Material',
        color: '#10b981', // Emerald
    },
    {
        id: 'surveys',
        title: 'Surveys & Feedback',
        description: 'Answer questions about your preferences and experiences.',
        icon: 'poll',
        iconType: 'Material',
        color: '#f59e0b', // Amber
    },
];

export const InterestedTasksScreen: React.FC<TaskInterestsProps> = ({ onNavigate }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const toggleTask = (taskId: string) => {
        if (selectedTasks.includes(taskId)) {
            setSelectedTasks(prev => prev.filter(id => id !== taskId));
        } else {
            setSelectedTasks(prev => [...prev, taskId]);
        }
    };

    const handleContinue = async () => {
        if (!user) {
            console.warn('[InterestedTasks] No user found, navigating directly.');
            onNavigate(ScreenName.HOME);
            return;
        }

        setIsSaving(true);
        try {
            const success = await UserService.updateInterests(user.id, selectedTasks);
            if (success) {
                console.log('[InterestedTasks] Interests saved successfully.');
                onNavigate(ScreenName.HOME);
            } else {
                console.error('[InterestedTasks] Failed to save interests.');
                onNavigate(ScreenName.HOME);
            }
        } catch (error) {
            console.error('[InterestedTasks] Exception:', error);
            onNavigate(ScreenName.HOME);
        } finally {
            setIsSaving(false);
        }
    };

    const renderIcon = (interest: TaskInterest, isSelected: boolean) => {
        const color = isSelected ? '#fff' : interest.color;
        const size = 32;

        switch (interest.iconType) {
            case 'FontAwesome':
                return <FontAwesome5 name={interest.icon} size={size} color={color} />;
            case 'Ionicons':
                return <Ionicons name={interest.icon} size={size} color={color} />;
            case 'Material':
            default:
                return <MaterialIcons name={interest.icon} size={size} color={color} />;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            {/* Background Decoration */}
            <View style={[styles.bgCircle, { backgroundColor: theme.primary, top: -100, left: -100 }]} />
            <View style={[styles.bgCircle, { backgroundColor: theme.accent, bottom: -100, right: -100 }]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => onNavigate(ScreenName.LANGUAGE_SELECTION)}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>What interests you?</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Pick tasks you enjoy to get personalized recommendations
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {TASK_INTERESTS.map((interest, index) => {
                        const isSelected = selectedTasks.includes(interest.id);

                        return (
                            <TouchableOpacity
                                key={interest.id}
                                activeOpacity={0.9}
                                onPress={() => toggleTask(interest.id)}
                                style={[styles.cardWrapper]}
                            >
                                <View
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: isSelected ? interest.color : theme.surface,
                                            borderColor: isSelected ? interest.color : theme.border,
                                            // Shadow for selected
                                            shadowColor: isSelected ? interest.color : '#000',
                                            shadowOpacity: isSelected ? 0.4 : 0.1,
                                            elevation: isSelected ? 8 : 2,
                                        }
                                    ]}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[
                                            styles.iconContainer,
                                            !isSelected && { backgroundColor: `${interest.color}15` }
                                        ]}>
                                            {renderIcon(interest, isSelected)}
                                        </View>
                                        {isSelected && (
                                            <View style={styles.checkIcon}>
                                                <MaterialIcons name="check-circle" size={24} color="#fff" />
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={[
                                            styles.cardTitle,
                                            { color: isSelected ? '#fff' : theme.text }
                                        ]}>
                                            {interest.title}
                                        </Text>
                                        <Text style={[
                                            styles.cardDesc,
                                            { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
                                        ]}>
                                            {interest.description}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <View>
                        <Text style={{ color: theme.textSecondary }}>Selected:</Text>
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 18 }}>
                            {selectedTasks.length} types
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            { backgroundColor: selectedTasks.length > 0 ? theme.primary : theme.textTertiary }
                        ]}
                        disabled={selectedTasks.length === 0 || isSaving}
                        onPress={handleContinue}
                    >
                        <Text style={styles.continueText}>{isSaving ? 'Saving...' : 'Start Earning'}</Text>
                        {!isSaving && <MaterialIcons name="arrow-forward" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgCircle: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.05,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    scrollView: {
        flex: 1,
    },
    gridContainer: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardWrapper: {
        width: '48%', // 2 columns
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        minHeight: 180,
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIcon: {
        marginTop: 4,
    },
    cardContent: {
        marginTop: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12,
        lineHeight: 16,
    },
    bottomBar: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
});
