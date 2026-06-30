import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface Props {
    onNavigate: (screen: ScreenName) => void;
}

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'yo', label: 'Yoruba' },
    { id: 'ha', label: 'Hausa' },
    { id: 'ig', label: 'Igbo' },
    { id: 'fr', label: 'French' },
    { id: 'pcm', label: 'Pidgin (Naija)' },
];

const SKILLS = [
    { id: 'voice', label: 'Voice Recording', icon: 'mic' },
    { id: 'text', label: 'Text Input', icon: 'keyboard' },
    { id: 'image', label: 'Image Capture', icon: 'camera-alt' },
    { id: 'video', label: 'Video Recording', icon: 'videocam' },
    { id: 'validation', label: 'Validation / QA', icon: 'verified' },
];

export const SkillSetupScreen: React.FC<Props> = ({ onNavigate }) => {
    const { theme } = useTheme();
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']); // Default English
    const [selectedSkills, setSelectedSkills] = useState<string[]>(['voice', 'validation']); // Default suggestions

    const toggleLang = (id: string) => {
        setSelectedLanguages(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const toggleSkill = (id: string) => {
        setSelectedSkills(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        // TODO: Save preferences to user profile or secure storage
        onNavigate(ScreenName.HOME);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Personalize Experience</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Select your languages and skills to customize your task feed.
                    </Text>
                </View>

                {/* Languages */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Languages Spoken</Text>
                <View style={styles.grid}>
                    {LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguages.includes(lang.id);
                        return (
                            <TouchableOpacity
                                key={lang.id}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : theme.surface,
                                        borderColor: isSelected ? '#10b981' : theme.border
                                    }
                                ]}
                                onPress={() => toggleLang(lang.id)}
                            >
                                <Text style={[
                                    styles.chipLabel,
                                    { color: isSelected ? '#10b981' : theme.textSecondary }
                                ]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Skills */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>Interested Tasks</Text>
                <View style={styles.grid}>
                    {SKILLS.map((skill) => {
                        const isSelected = selectedSkills.includes(skill.id);
                        return (
                            <TouchableOpacity
                                key={skill.id}
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : theme.surface,
                                        borderColor: isSelected ? '#3b82f6' : theme.border
                                    }
                                ]}
                                onPress={() => toggleSkill(skill.id)}
                            >
                                <MaterialIcons
                                    name={skill.icon as any}
                                    size={24}
                                    color={isSelected ? '#3b82f6' : theme.textSecondary}
                                />
                                <Text style={[
                                    styles.cardLabel,
                                    { color: isSelected ? '#3b82f6' : theme.text }
                                ]}>
                                    {skill.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: theme.primary },
                        (selectedLanguages.length === 0 || selectedSkills.length === 0) && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={selectedLanguages.length === 0 || selectedSkills.length === 0}
                >
                    <Text style={styles.buttonText}>Start Earning</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 100 },
    header: { marginTop: Platform.OS === 'android' ? 24 : 12, marginBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    subtitle: { fontSize: 14, lineHeight: 22 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    chipLabel: { fontSize: 13, fontWeight: '600' },
    card: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }
});
