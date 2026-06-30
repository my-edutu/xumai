/**
 * MetadataCollectionModal
 *
 * A non-intrusive bottom-sheet modal that asks contributors for
 * lightweight metadata tags after a capture — before final submission.
 *
 * UX principle: everything is optional. Two taps max per section.
 * Auto-captured fields (platform, timestamp) are added silently.
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ============================================================================
// TYPES
// ============================================================================

export interface CollectedMetadata {
    // User-provided (optional)
    language?: string;
    country_code?: string;
    environment?: 'indoor' | 'outdoor';
    scene_category?: string;
    noise_level?: 'low' | 'medium' | 'high';
    // Auto-captured
    platform: string;
    consent_given: boolean;
}

interface MetadataCollectionModalProps {
    visible: boolean;
    taskType: 'voice' | 'image' | 'video' | 'text' | 'validation';
    onDone: (metadata: CollectedMetadata) => void;
    onSkip: () => void;
    theme: {
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
    };
}

// ============================================================================
// DATA
// ============================================================================

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'yo', label: 'Yoruba' },
    { code: 'ha', label: 'Hausa' },
    { code: 'ig', label: 'Igbo' },
    { code: 'fr', label: 'French' },
    { code: 'sw', label: 'Swahili' },
    { code: 'pcm', label: 'Pidgin' },
    { code: 'ar', label: 'Arabic' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'zu', label: 'Zulu' },
    { code: 'am', label: 'Amharic' },
    { code: 'other', label: 'Other' },
];

const COUNTRIES = [
    { code: 'NG', label: 'Nigeria', flag: '🇳🇬' },
    { code: 'KE', label: 'Kenya', flag: '🇰🇪' },
    { code: 'GH', label: 'Ghana', flag: '🇬🇭' },
    { code: 'ZA', label: 'S. Africa', flag: '🇿🇦' },
    { code: 'ET', label: 'Ethiopia', flag: '🇪🇹' },
    { code: 'TZ', label: 'Tanzania', flag: '🇹🇿' },
    { code: 'UG', label: 'Uganda', flag: '🇺🇬' },
    { code: 'SN', label: 'Senegal', flag: '🇸🇳' },
    { code: 'OTHER', label: 'Other', flag: '🌍' },
];

const SCENE_CATEGORIES = [
    { value: 'market', label: 'Market', icon: 'store' as const },
    { value: 'home', label: 'Home', icon: 'home' as const },
    { value: 'road', label: 'Road', icon: 'directions' as const },
    { value: 'office', label: 'Office', icon: 'business' as const },
    { value: 'farm', label: 'Farm', icon: 'grass' as const },
    { value: 'school', label: 'School', icon: 'school' as const },
    { value: 'other', label: 'Other', icon: 'more-horiz' as const },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const MetadataCollectionModal: React.FC<MetadataCollectionModalProps> = ({
    visible,
    taskType,
    onDone,
    onSkip,
    theme,
}) => {
    const [language, setLanguage] = useState<string | undefined>();
    const [countryCode, setCountryCode] = useState<string | undefined>();
    const [environment, setEnvironment] = useState<'indoor' | 'outdoor' | undefined>();
    const [sceneCategory, setSceneCategory] = useState<string | undefined>();
    const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high' | undefined>();

    const isVisual = taskType === 'image' || taskType === 'video';
    const isAudio = taskType === 'voice';

    const handleDone = () => {
        const metadata: CollectedMetadata = {
            platform: Platform.OS,
            consent_given: true,
        };
        if (language) metadata.language = language;
        if (countryCode) metadata.country_code = countryCode;
        if (isVisual && environment) metadata.environment = environment;
        if (isVisual && sceneCategory) metadata.scene_category = sceneCategory;
        if (isAudio && noiseLevel) metadata.noise_level = noiseLevel;
        onDone(metadata);
    };

    const resetState = () => {
        setLanguage(undefined);
        setCountryCode(undefined);
        setEnvironment(undefined);
        setSceneCategory(undefined);
        setNoiseLevel(undefined);
    };

    const handleSkip = () => {
        resetState();
        onSkip();
    };

    const handleDoneAndReset = () => {
        handleDone();
        resetState();
    };

    // -----------------------------------------------------------------------
    // Sub-components
    // -----------------------------------------------------------------------

    const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
        <Text style={{
            fontSize: 10,
            fontWeight: '700',
            color: theme.textSecondary,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 10,
        }}>
            {text}
        </Text>
    );

    const Chip: React.FC<{
        label: string;
        selected: boolean;
        onPress: () => void;
        icon?: React.ReactNode;
    }> = ({ label, selected, onPress, icon }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? `${theme.primary}18` : theme.surface,
                marginRight: 8,
                marginBottom: 8,
            }}
        >
            {icon}
            <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: selected ? theme.primary : theme.textSecondary,
            }}>
                {label}
            </Text>
            {selected && (
                <MaterialIcons
                    name="check"
                    size={12}
                    color={theme.primary}
                    style={{ marginLeft: 4 }}
                />
            )}
        </TouchableOpacity>
    );

    const Divider = () => (
        <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 16 }} />
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleSkip}
        >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{
                    backgroundColor: theme.background,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    maxHeight: '88%',
                }}>
                    {/* Drag handle */}
                    <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
                            <View style={{
                                width: 38, height: 38, borderRadius: 19,
                                backgroundColor: `${theme.primary}18`,
                                alignItems: 'center', justifyContent: 'center',
                                marginRight: 12,
                            }}>
                                <MaterialIcons name="label" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                                    Quick Data Tags
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                                    All optional — helps your data earn more
                                </Text>
                            </View>
                        </View>

                        <Divider />

                        {/* Language */}
                        <SectionLabel text="Language" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {LANGUAGES.map(lang => (
                                <Chip
                                    key={lang.code}
                                    label={lang.label}
                                    selected={language === lang.code}
                                    onPress={() => setLanguage(language === lang.code ? undefined : lang.code)}
                                />
                            ))}
                        </View>

                        {/* Country */}
                        <View style={{ marginTop: 16 }}>
                            <SectionLabel text="Country" />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {COUNTRIES.map(c => (
                                    <Chip
                                        key={c.code}
                                        label={`${c.flag} ${c.label}`}
                                        selected={countryCode === c.code}
                                        onPress={() => setCountryCode(countryCode === c.code ? undefined : c.code)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Voice-only: Noise Level */}
                        {isAudio && (
                            <View style={{ marginTop: 16 }}>
                                <SectionLabel text="Background Noise" />
                                <View style={{ flexDirection: 'row' }}>
                                    {(['low', 'medium', 'high'] as const).map(level => (
                                        <Chip
                                            key={level}
                                            label={level.charAt(0).toUpperCase() + level.slice(1)}
                                            selected={noiseLevel === level}
                                            onPress={() => setNoiseLevel(noiseLevel === level ? undefined : level)}
                                            icon={
                                                <MaterialIcons
                                                    name={level === 'low' ? 'volume-mute' : level === 'medium' ? 'volume-down' : 'volume-up'}
                                                    size={13}
                                                    color={noiseLevel === level ? theme.primary : theme.textSecondary}
                                                    style={{ marginRight: 4 }}
                                                />
                                            }
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Image/Video-only: Environment + Scene */}
                        {isVisual && (
                            <>
                                <View style={{ marginTop: 16 }}>
                                    <SectionLabel text="Environment" />
                                    <View style={{ flexDirection: 'row' }}>
                                        {(['indoor', 'outdoor'] as const).map(env => (
                                            <Chip
                                                key={env}
                                                label={env.charAt(0).toUpperCase() + env.slice(1)}
                                                selected={environment === env}
                                                onPress={() => setEnvironment(environment === env ? undefined : env)}
                                                icon={
                                                    <MaterialIcons
                                                        name={env === 'indoor' ? 'home' : 'wb-sunny'}
                                                        size={13}
                                                        color={environment === env ? theme.primary : theme.textSecondary}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                }
                                            />
                                        ))}
                                    </View>
                                </View>

                                <View style={{ marginTop: 16 }}>
                                    <SectionLabel text="Scene Category" />
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {SCENE_CATEGORIES.map(cat => (
                                            <Chip
                                                key={cat.value}
                                                label={cat.label}
                                                selected={sceneCategory === cat.value}
                                                onPress={() => setSceneCategory(sceneCategory === cat.value ? undefined : cat.value)}
                                                icon={
                                                    <MaterialIcons
                                                        name={cat.icon}
                                                        size={13}
                                                        color={sceneCategory === cat.value ? theme.primary : theme.textSecondary}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                }
                                            />
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Privacy notice */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            backgroundColor: `${theme.primary}0d`,
                            borderRadius: 12,
                            padding: 12,
                            marginTop: 24,
                        }}>
                            <MaterialIcons name="shield" size={14} color={theme.primary} style={{ marginRight: 8, marginTop: 1 }} />
                            <Text style={{ fontSize: 11, color: theme.textSecondary, flex: 1, lineHeight: 17 }}>
                                No precise GPS is collected. Tags help filter datasets for buyers and unlock higher payouts for quality submissions.
                            </Text>
                        </View>

                        {/* Action buttons */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity
                                onPress={handleSkip}
                                activeOpacity={0.7}
                                style={{
                                    flex: 1,
                                    height: 52,
                                    borderRadius: 16,
                                    borderWidth: 1.5,
                                    borderColor: theme.border,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 14 }}>
                                    Skip
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDoneAndReset}
                                activeOpacity={0.8}
                                style={{
                                    flex: 2,
                                    height: 52,
                                    borderRadius: 16,
                                    backgroundColor: theme.primary,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 }}>
                                    Submit with Tags
                                </Text>
                                <MaterialIcons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default MetadataCollectionModal;
