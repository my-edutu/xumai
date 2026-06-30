import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { PromptService, AiPrompt } from '../services/promptService';

interface PromptGeniusScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
}

const MODALITIES = [
    { id: 'voice', label: 'Voice', icon: 'mic' },
    { id: 'image', label: 'Image', icon: 'camera-alt' },
    { id: 'video', label: 'Video', icon: 'videocam' },
    { id: 'text', label: 'Text', icon: 'text-fields' },
] as const;

export const PromptGeniusScreen = ({ onNavigate, onBack, route }: any) => {
    const { theme } = useTheme();

    // State
    const [context, setContext] = useState('');
    const [modality, setModality] = useState<any>('voice');
    const [count, setCount] = useState('10');

    // Effect to handle navigation params from GapDashboard
    React.useEffect(() => {
        if (route?.params?.initialContext) {
            setContext(route.params.initialContext);
        }
        if (route?.params?.initialType) {
            setModality(route.params.initialType);
        }
    }, [route?.params]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPrompts, setGeneratedPrompts] = useState<AiPrompt[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);

    const handleGenerate = async () => {
        if (!context.trim()) return Alert.alert('Missing Context', 'Please describe what you want the AI to teach.');

        setIsGenerating(true);
        try {
            const prompts = await PromptService.generateAiPrompts({
                goal: 'Improve Data Coverage', // Default for now
                context: context.trim(),
                modality,
                count: parseInt(count) || 10
            });
            setGeneratedPrompts(prompts);
        } catch (err) {
            Alert.alert('Error', 'Failed to generate prompts. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeploy = async () => {
        const selectedPrompts = generatedPrompts.filter(p => p.isSelected);
        if (selectedPrompts.length === 0) return Alert.alert('No Selection', 'Please select at least one prompt to deploy.');

        setIsDeploying(true);
        try {
            const result = await PromptService.deployPrompts(selectedPrompts);
            Alert.alert(
                'Deployment Successful',
                `Successfully deployed ${result.count} new tasks to the marketplace!`,
                [{ text: 'OK', onPress: () => onNavigate(ScreenName.COMPANY_DASHBOARD) }]
            );
        } catch (err) {
            Alert.alert('Deployment Failed', 'Could not save prompts to database.');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleSeed = async () => {
        Alert.alert(
            'Seed Database?',
            'This will insert 1000+ initial prompts into the database. Existing prompts will remain.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Seed Now',
                    onPress: async () => {
                        setIsGenerating(true); // Reuse loading state
                        try {
                            const result = await PromptService.seedDatabase();
                            Alert.alert('Success', `Seeded ${result.count} prompts!`);
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setIsGenerating(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.COMPANY_DASHBOARD)}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>PROMPT GENIUS</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.primary }]}>AI DATA ENGINE</Text>
                    </View>
                    <TouchableOpacity onPress={handleSeed} style={{ padding: 4 }}>
                        <MaterialIcons name="cloud-upload" size={24} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Intro */}
                    <View style={styles.introSection}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>WHAT DO YOU WANT TO TEACH?</Text>
                        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                            Describe the data gap, and the AI will generate optimal collection tasks.
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View style={[styles.formCard, { backgroundColor: theme.surface }]}>

                        {/* Trending Chips */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {['Medical Terms', 'Street Signs', 'Market Noise', 'Pidgin Slang'].map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    onPress={() => setContext(topic)}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                                        backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border
                                    }}
                                >
                                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>{topic}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Context Input */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>CONTEXT / TOPIC</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderColor: theme.border
                            }]}
                            placeholder="e.g. Rural Healthcare, Street Slang, Potholes"
                            placeholderTextColor={theme.textSecondary}
                            value={context}
                            onChangeText={setContext}
                        />

                        {/* Modality Selector */}
                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>DATA TYPE</Text>
                        <View style={styles.modalityGrid}>
                            {MODALITIES.map((m) => {
                                const isSelected = modality === m.id;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[
                                            styles.modalityBtn,
                                            {
                                                borderColor: isSelected ? theme.primary : theme.border,
                                                backgroundColor: isSelected ? `${theme.primary}15` : theme.background
                                            }
                                        ]}
                                        onPress={() => setModality(m.id)}
                                    >
                                        <MaterialIcons
                                            name={m.icon as any}
                                            size={20}
                                            color={isSelected ? theme.primary : theme.textSecondary}
                                        />
                                        <Text style={[
                                            styles.modalityLabel,
                                            { color: isSelected ? theme.primary : theme.textSecondary }
                                        ]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Count */}
                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>QUANTITY</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TextInput
                                style={[styles.input, {
                                    flex: 1,
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: theme.border
                                }]}
                                keyboardType="number-pad"
                                value={count}
                                onChangeText={setCount}
                            />
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Variations</Text>
                        </View>

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[styles.generateBtn, { backgroundColor: theme.primary, opacity: isGenerating ? 0.7 : 1 }]}
                            onPress={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                                    <Text style={styles.generateBtnText}>GENERATE PROMPTS</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Results Section */}
                    {generatedPrompts.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <View style={styles.resultsHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>GENERATED TASKS</Text>
                                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>
                                    {generatedPrompts.filter(p => p.isSelected).length} SELECTED
                                </Text>
                            </View>

                            {/* Prompt List */}
                            {generatedPrompts.map((prompt, index) => (
                                <TouchableOpacity
                                    key={prompt.id}
                                    style={[
                                        styles.promptCard,
                                        {
                                            backgroundColor: theme.surface,
                                            borderColor: prompt.isSelected ? theme.primary : theme.border,
                                            borderWidth: prompt.isSelected ? 2 : 1
                                        }
                                    ]}
                                    onPress={() => {
                                        const newPrompts = [...generatedPrompts];
                                        newPrompts[index].isSelected = !newPrompts[index].isSelected;
                                        setGeneratedPrompts(newPrompts);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <View style={[
                                            styles.checkCircle,
                                            {
                                                borderColor: prompt.isSelected ? theme.primary : theme.textSecondary,
                                                backgroundColor: prompt.isSelected ? theme.primary : 'transparent'
                                            }
                                        ]}>
                                            {prompt.isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.promptText, { color: theme.text }]}>{prompt.text}</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                                <Text style={[styles.tag, { color: theme.textSecondary, backgroundColor: theme.background }]}>
                                                    {prompt.difficulty === 1 ? 'Easy' : prompt.difficulty === 2 ? 'Medium' : 'Hard'}
                                                </Text>
                                                <Text style={[styles.tag, { color: theme.textSecondary, backgroundColor: theme.background }]}>
                                                    {prompt.category}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {/* Deploy Footer */}
                            <View style={[styles.deployFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                                <View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Total Cost Estimate</Text>
                                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>
                                        ${(generatedPrompts.filter(p => p.isSelected).length * 0.10).toFixed(2)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.deployBtn, { backgroundColor: theme.success, opacity: isDeploying ? 0.7 : 1 }]}
                                    onPress={handleDeploy}
                                    disabled={isDeploying}
                                >
                                    {isDeploying ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.deployBtnText}>DEPLOY TO CROWD</Text>
                                            <MaterialIcons name="rocket-launch" size={18} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View >
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1
    },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
    content: { padding: 20 },
    introSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    sectionDesc: { fontSize: 14, lineHeight: 20 },

    formCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
    input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 15 },

    modalityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modalityBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1
    },
    modalityLabel: { fontSize: 12, fontWeight: '700' },

    generateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 16, borderRadius: 16, marginTop: 24
    },
    generateBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 13 },

    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    promptCard: { padding: 16, borderRadius: 16, marginBottom: 10 },
    checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    promptText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
    tag: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

    deployFooter: {
        marginTop: 20, paddingTop: 20, borderTopWidth: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    deployBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14
    },
    deployBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5, fontSize: 13 }
});
