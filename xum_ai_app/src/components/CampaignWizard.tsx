/**
 * CampaignWizard — 5-step modal for creating company data campaigns
 *
 * Step 1: Choose data type
 * Step 2: Task details & guidelines
 * Step 3: Scale & targeting
 * Step 4: Timeframe
 * Step 5: Pricing review & submit
 */

import React, { useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPricingQuote, createCampaign, updateCampaign, PricingConfig, PricingQuote } from '../services/campaignService';
import { CompanyCampaign } from '../services/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_TYPES = [
    { value: 'audio', label: 'Voice', icon: 'mic' as const, desc: 'Record speech, commands, or conversations' },
    { value: 'image', label: 'Image', icon: 'camera-alt' as const, desc: 'Capture, label, or annotate images' },
    { value: 'video', label: 'Video', icon: 'videocam' as const, desc: 'Record gestures, scenes, or actions' },
    { value: 'text', label: 'Text', icon: 'text-fields' as const, desc: 'Write, translate, or rate text content' },
    { value: 'validation', label: 'Validation', icon: 'verified' as const, desc: 'Review and quality-check submissions' },
    { value: 'linguasense', label: 'LinguaSense', icon: 'translate' as const, desc: 'African language data collection' },
];

const LANGUAGES = ['EN', 'FR', 'AR', 'SW', 'HA', 'YO', 'ZU', 'Other'];
const REGIONS = ['Global', 'Africa', 'North America', 'Europe', 'Asia', 'Latin America'];
const TIMEFRAMES = [
    { days: 7, label: '7 days', impact: 'RUSH +60%' },
    { days: 14, label: '14 days', impact: '+35%' },
    { days: 30, label: '30 days', impact: 'BASE' },
    { days: 60, label: '60 days', impact: '-10%' },
    { days: 90, label: '90 days', impact: '-15%' },
];
const QUALITY_TIERS = [
    { value: 'basic', label: 'Basic', rateLabel: '$0.04–0.15/item', desc: 'Standard quality, no special requirements' },
    { value: 'standard', label: 'Standard', rateLabel: '+30% premium', desc: 'Reviewed, meets quality threshold' },
    { value: 'premium', label: 'Premium', rateLabel: '+80% premium', desc: 'Expert-reviewed, highest accuracy' },
];
const QUICK_QUANTITIES = [100, 500, 1000, 5000, 10000];
const CONTRIBUTOR_LEVELS = [
    { value: 0, label: 'Any' },
    { value: 2, label: 'Level 2+' },
    { value: 3, label: 'Level 3+' },
    { value: 5, label: 'Expert' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
    userId: string;
    theme: any;
    editingCampaign?: CompanyCampaign;
}

interface WizardState {
    taskType: string;
    title: string;
    description: string;
    instructions: string;
    whatNotToDo: string;
    qualityRequirements: string;
    languages: string[];
    sampleReference: string;
    qualityTier: string;
    quantity: string;
    regions: string[];
    minLevel: number;
    maxPerUser: string;
    timeframeDays: number;
}

const DEFAULT_STATE: WizardState = {
    taskType: 'audio',
    title: '',
    description: '',
    instructions: '',
    whatNotToDo: '',
    qualityRequirements: '',
    languages: ['EN'],
    sampleReference: '',
    qualityTier: 'standard',
    quantity: '1000',
    regions: ['Global'],
    minLevel: 0,
    maxPerUser: '10',
    timeframeDays: 30,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CampaignWizard: React.FC<WizardProps> = ({ visible, onClose, onCreated, userId, theme, editingCampaign }) => {
    const [step, setStep] = useState(1);
    const [state, setState] = useState<WizardState>(DEFAULT_STATE);
    const [submitting, setSubmitting] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    React.useEffect(() => {
        if (visible && editingCampaign) {
            setState({
                taskType: editingCampaign.task_type,
                title: editingCampaign.title,
                description: editingCampaign.description,
                instructions: editingCampaign.guidelines.what_to_do,
                whatNotToDo: editingCampaign.guidelines.what_not_to_do || '',
                qualityRequirements: editingCampaign.guidelines.quality_requirements || '',
                languages: editingCampaign.language_filter || ['EN'],
                sampleReference: editingCampaign.sample_reference || '',
                qualityTier: editingCampaign.quality_tier,
                quantity: String(editingCampaign.target_count),
                regions: editingCampaign.region_filter || ['Global'],
                minLevel: editingCampaign.min_contributor_level || 0,
                maxPerUser: String(editingCampaign.max_submissions_per_user || 10),
                timeframeDays: editingCampaign.timeframe_days || 30,
            });
        } else if (visible && !editingCampaign) {
            setState(DEFAULT_STATE);
        }
    }, [visible, editingCampaign]);

    const totalSteps = 5;

    const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
        setState(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleArrayItem = (arr: string[], item: string, exclusive?: string): string[] => {
        if (exclusive && item === exclusive) return [exclusive];
        const withoutExclusive = arr.filter(i => i !== exclusive);
        if (item === exclusive) return [exclusive];
        const next = withoutExclusive.includes(item)
            ? withoutExclusive.filter(i => i !== item)
            : [...withoutExclusive, item];
        return next.length === 0 ? [item] : next;
    };

    const pricingConfig: PricingConfig = {
        taskType: state.taskType,
        quantity: parseInt(state.quantity, 10) || 1,
        qualityTier: state.qualityTier,
        timeframeDays: state.timeframeDays,
        regions: state.regions,
    };

    const quote: PricingQuote = getPricingQuote(pricingConfig);

    const handleClose = () => {
        setStep(1);
        setState(DEFAULT_STATE);
        setExpandedSection(null);
        onClose();
    };

    const handleNext = () => {
        if (step === 2 && !state.title.trim()) {
            Alert.alert('Missing', 'Please enter a campaign name.');
            return;
        }
        if (step === 2 && !state.description.trim()) {
            Alert.alert('Missing', 'Please describe what contributors should do.');
            return;
        }
        if (step < totalSteps) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleSubmit = async (asDraft: boolean) => {
        if (!state.title.trim()) {
            Alert.alert('Missing', 'Campaign name is required.');
            return;
        }

        setSubmitting(true);
        try {
            const campaignData = {
                title: state.title.trim(),
                description: state.description.trim(),
                taskType: state.taskType,
                targetCount: parseInt(state.quantity, 10) || 1,
                guidelines: {
                    what_to_do: state.instructions.trim() || state.description.trim(),
                    what_not_to_do: state.whatNotToDo.trim() || undefined,
                    quality_requirements: state.qualityRequirements.trim() || undefined,
                },
                timeframeDays: state.timeframeDays,
                qualityTier: state.qualityTier,
                regionFilter: state.regions,
                languageFilter: state.languages,
                minContributorLevel: state.minLevel,
                maxSubmissionsPerUser: parseInt(state.maxPerUser, 10) || 10,
                quote,
                sampleReference: state.sampleReference.trim() || undefined,
                status: asDraft ? 'draft' : 'pending_review' as any,
            };

            const result = editingCampaign
                ? await updateCampaign(editingCampaign.id, userId, campaignData)
                : await createCampaign(userId, campaignData);

            if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to submit campaign');
                return;
            }

            Alert.alert(
                asDraft ? 'Draft Saved' : 'Request Submitted!',
                asDraft
                    ? 'Your campaign has been saved as a draft.'
                    : 'Your campaign request has been submitted for admin review. You will be notified within 24 hours.',
            );
            handleClose();
            onCreated();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const estCompletionDate = (): string => {
        const d = new Date();
        d.setDate(d.getDate() + state.timeframeDays + 2); // +2 for admin review buffer
        return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={[S.root, { backgroundColor: theme.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={[S.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[S.headerTitle, { color: theme.text }]}>
                        {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>
                        {step}/{totalSteps}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View style={[S.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[S.progressFill, { width: `${(step / totalSteps) * 100}%`, backgroundColor: '#f97316' }]} />
                </View>

                {/* Step Content */}
                <ScrollView style={S.body} contentContainerStyle={S.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 1 && <Step1DataType state={state} update={update} theme={theme} />}
                    {step === 2 && (
                        <Step2Details
                            state={state}
                            update={update}
                            theme={theme}
                            expandedSection={expandedSection}
                            setExpandedSection={setExpandedSection}
                            toggleArrayItem={toggleArrayItem}
                        />
                    )}
                    {step === 3 && <Step3Scale state={state} update={update} theme={theme} toggleArrayItem={toggleArrayItem} quote={quote} />}
                    {step === 4 && <Step4Timeframe state={state} update={update} theme={theme} estDate={estCompletionDate()} quote={quote} />}
                    {step === 5 && (
                        <Step5Review
                            state={state}
                            quote={quote}
                            theme={theme}
                            submitting={submitting}
                            onDraft={() => handleSubmit(true)}
                            onSubmit={() => handleSubmit(false)}
                        />
                    )}
                </ScrollView>

                {/* Navigation Buttons (hidden on step 5 where review has its own buttons) */}
                {step < 5 && (
                    <View style={[S.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
                        {step > 1 ? (
                            <TouchableOpacity style={[S.backBtn, { borderColor: theme.border }]} onPress={handleBack}>
                                <MaterialIcons name="chevron-left" size={20} color={theme.text} />
                                <Text style={[S.backBtnText, { color: theme.text }]}>Back</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flex: 1 }} />
                        )}
                        <TouchableOpacity style={S.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                            <Text style={S.nextBtnText}>
                                {step === 4 ? 'Review Pricing' : 'Next'}
                            </Text>
                            <MaterialIcons name="chevron-right" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Step 1: Data Type ────────────────────────────────────────────────────────

const Step1DataType: React.FC<{ state: WizardState; update: any; theme: any }> = ({ state, update, theme }) => (
    <View>
        <Text style={[S.stepTitle, { color: theme.text }]}>Choose Data Type</Text>
        <Text style={[S.stepSubtitle, { color: theme.textSecondary }]}>
            What kind of data do you need contributors to collect?
        </Text>
        <View style={S.typeGrid}>
            {DATA_TYPES.map(t => {
                const selected = state.taskType === t.value;
                return (
                    <TouchableOpacity
                        key={t.value}
                        style={[
                            S.typeCard,
                            { backgroundColor: theme.surface, borderColor: selected ? '#f97316' : theme.border },
                            selected && { backgroundColor: 'rgba(249,115,22,0.08)' },
                        ]}
                        onPress={() => update('taskType', t.value)}
                        activeOpacity={0.8}
                    >
                        <View style={[S.typeIconCircle, { backgroundColor: selected ? 'rgba(249,115,22,0.15)' : `${theme.text}08` }]}>
                            <MaterialIcons name={t.icon} size={28} color={selected ? '#f97316' : theme.textSecondary} />
                        </View>
                        <Text style={[S.typeLabel, { color: selected ? '#f97316' : theme.text }]}>{t.label}</Text>
                        <Text style={[S.typeDesc, { color: theme.textSecondary }]} numberOfLines={2}>{t.desc}</Text>
                        {selected && (
                            <View style={S.selectedCheck}>
                                <MaterialIcons name="check-circle" size={18} color="#f97316" />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

// ─── Step 2: Details & Guidelines ────────────────────────────────────────────

interface Step2Props {
    state: WizardState;
    update: any;
    theme: any;
    expandedSection: string | null;
    setExpandedSection: (s: string | null) => void;
    toggleArrayItem: (arr: string[], item: string, exclusive?: string) => string[];
}

const Step2Details: React.FC<Step2Props> = ({ state, update, theme, expandedSection, setExpandedSection, toggleArrayItem }) => {
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <View>
            <Text style={[S.stepTitle, { color: theme.text }]}>Task Details & Guidelines</Text>
            <Text style={[S.stepSubtitle, { color: theme.textSecondary }]}>
                Help contributors understand exactly what you need.
            </Text>

            {/* Campaign Name */}
            <Text style={[S.label, { color: theme.textSecondary }]}>Campaign Name *</Text>
            <TextInput
                style={[S.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={state.title}
                onChangeText={v => update('title', v)}
                placeholder="e.g. Yoruba Voice Recording — 1,000 items"
                placeholderTextColor={theme.textSecondary}
            />

            {/* What contributors should do */}
            <Text style={[S.label, { color: theme.textSecondary }]}>What contributors should do *</Text>
            <TextInput
                style={[S.input, S.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={state.description}
                onChangeText={v => update('description', v)}
                placeholder="Briefly describe the task and the data you need..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />

            {/* Expandable Guidelines */}
            <Text style={[S.label, { color: theme.textSecondary }]}>Expanded Guidelines</Text>

            {[
                { id: 'instructions', label: 'Step-by-step instructions', key: 'instructions', placeholder: 'List each step contributors should follow...' },
                { id: 'notToDo', label: 'What NOT to do', key: 'whatNotToDo', placeholder: 'Common mistakes to avoid...' },
                { id: 'quality', label: 'Quality requirements', key: 'qualityRequirements', placeholder: 'Minimum quality standards for acceptance...' },
            ].map(section => (
                <View key={section.id} style={[S.guideSection, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        style={S.guideSectionHeader}
                        onPress={() => toggleSection(section.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={[S.guideSectionLabel, { color: theme.text }]}>{section.label}</Text>
                        <MaterialIcons
                            name={expandedSection === section.id ? 'expand-less' : 'expand-more'}
                            size={20}
                            color={theme.textSecondary}
                        />
                    </TouchableOpacity>
                    {expandedSection === section.id && (
                        <TextInput
                            style={[S.input, S.textArea, S.guideInput, { backgroundColor: theme.background, color: theme.text, borderColor: 'transparent' }]}
                            value={(state as any)[section.key]}
                            onChangeText={v => update(section.key as keyof WizardState, v)}
                            placeholder={section.placeholder}
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    )}
                </View>
            ))}

            {/* Languages */}
            <Text style={[S.label, { color: theme.textSecondary }]}>Language(s)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {LANGUAGES.map(lang => {
                    const selected = state.languages.includes(lang);
                    return (
                        <TouchableOpacity
                            key={lang}
                            style={[S.chip, { borderColor: selected ? '#f97316' : theme.border, backgroundColor: selected ? 'rgba(249,115,22,0.1)' : theme.surface }]}
                            onPress={() => update('languages', toggleArrayItem(state.languages, lang))}
                        >
                            <Text style={[S.chipText, { color: selected ? '#f97316' : theme.textSecondary }]}>{lang}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Sample Reference */}
            <Text style={[S.label, { color: theme.textSecondary }]}>Sample Reference (optional)</Text>
            <TextInput
                style={[S.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={state.sampleReference}
                onChangeText={v => update('sampleReference', v)}
                placeholder="URL or example text..."
                placeholderTextColor={theme.textSecondary}
            />

            {/* Quality Tier */}
            <Text style={[S.label, { color: theme.textSecondary }]}>Quality Tier</Text>
            {QUALITY_TIERS.map(tier => {
                const selected = state.qualityTier === tier.value;
                return (
                    <TouchableOpacity
                        key={tier.value}
                        style={[
                            S.tierCard,
                            { borderColor: selected ? '#f97316' : theme.border, backgroundColor: selected ? 'rgba(249,115,22,0.08)' : theme.surface },
                        ]}
                        onPress={() => update('qualityTier', tier.value)}
                        activeOpacity={0.8}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[S.tierLabel, { color: selected ? '#f97316' : theme.text }]}>{tier.label}</Text>
                            <Text style={[S.tierDesc, { color: theme.textSecondary }]}>{tier.desc}</Text>
                        </View>
                        <Text style={[S.tierRate, { color: selected ? '#f97316' : theme.textSecondary }]}>{tier.rateLabel}</Text>
                        {selected && <MaterialIcons name="radio-button-checked" size={20} color="#f97316" style={{ marginLeft: 8 }} />}
                        {!selected && <MaterialIcons name="radio-button-unchecked" size={20} color={theme.border} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ─── Step 3: Scale & Targeting ────────────────────────────────────────────────

interface Step3Props {
    state: WizardState;
    update: any;
    theme: any;
    toggleArrayItem: (arr: string[], item: string, exclusive?: string) => string[];
    quote: PricingQuote;
}

const Step3Scale: React.FC<Step3Props> = ({ state, update, theme, toggleArrayItem, quote }) => (
    <View>
        <Text style={[S.stepTitle, { color: theme.text }]}>Scale & Targeting</Text>
        <Text style={[S.stepSubtitle, { color: theme.textSecondary }]}>
            How many items do you need, and who should complete them?
        </Text>

        {/* Quantity */}
        <Text style={[S.label, { color: theme.textSecondary }]}>Quantity</Text>
        <TextInput
            style={[S.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={state.quantity}
            onChangeText={v => update('quantity', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="1000"
            placeholderTextColor={theme.textSecondary}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 16 }}>
            {QUICK_QUANTITIES.map(q => (
                <TouchableOpacity
                    key={q}
                    style={[S.chip, {
                        borderColor: state.quantity === String(q) ? '#f97316' : theme.border,
                        backgroundColor: state.quantity === String(q) ? 'rgba(249,115,22,0.1)' : theme.surface,
                    }]}
                    onPress={() => update('quantity', String(q))}
                >
                    <Text style={[S.chipText, { color: state.quantity === String(q) ? '#f97316' : theme.textSecondary }]}>
                        {q >= 1000 ? `${q / 1000}k` : q}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Target Regions */}
        <Text style={[S.label, { color: theme.textSecondary }]}>Target Regions</Text>
        <View style={S.chipWrap}>
            {REGIONS.map(region => {
                const selected = state.regions.includes(region);
                return (
                    <TouchableOpacity
                        key={region}
                        style={[S.chip, { borderColor: selected ? '#f97316' : theme.border, backgroundColor: selected ? 'rgba(249,115,22,0.1)' : theme.surface }]}
                        onPress={() => update('regions', toggleArrayItem(state.regions, region, 'Global'))}
                    >
                        <Text style={[S.chipText, { color: selected ? '#f97316' : theme.textSecondary }]}>{region}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* Min Contributor Level */}
        <Text style={[S.label, { color: theme.textSecondary }]}>Min Contributor Level</Text>
        <View style={S.segmentRow}>
            {CONTRIBUTOR_LEVELS.map(lvl => {
                const selected = state.minLevel === lvl.value;
                return (
                    <TouchableOpacity
                        key={lvl.value}
                        style={[
                            S.segmentBtn,
                            { borderColor: theme.border, backgroundColor: selected ? '#f97316' : theme.surface },
                        ]}
                        onPress={() => update('minLevel', lvl.value)}
                    >
                        <Text style={[S.segmentBtnText, { color: selected ? '#fff' : theme.textSecondary }]}>{lvl.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* Max per user */}
        <Text style={[S.label, { color: theme.textSecondary }]}>Max Submissions per User</Text>
        <TextInput
            style={[S.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={state.maxPerUser}
            onChangeText={v => update('maxPerUser', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={theme.textSecondary}
        />
        <Text style={[S.hint, { color: theme.textSecondary }]}>
            Distributes work among more contributors for higher diversity.
        </Text>

        {/* Live price preview */}
        <View style={[S.pricePreview, { backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.3)' }]}>
            <MaterialIcons name="info-outline" size={16} color="#f97316" />
            <Text style={{ color: '#f97316', fontWeight: '700', marginLeft: 6 }}>
                Estimated total: ${quote.total.toFixed(2)}
            </Text>
        </View>
    </View>
);

// ─── Step 4: Timeframe ────────────────────────────────────────────────────────

interface Step4Props {
    state: WizardState;
    update: any;
    theme: any;
    estDate: string;
    quote: PricingQuote;
}

const Step4Timeframe: React.FC<Step4Props> = ({ state, update, theme, estDate, quote }) => (
    <View>
        <Text style={[S.stepTitle, { color: theme.text }]}>Campaign Timeframe</Text>
        <Text style={[S.stepSubtitle, { color: theme.textSecondary }]}>
            Shorter timeframes cost more — contributors prioritise urgent work.
        </Text>

        {TIMEFRAMES.map(tf => {
            const selected = state.timeframeDays === tf.days;
            const isRush = tf.days <= 14;
            const isDiscount = tf.days >= 60;
            return (
                <TouchableOpacity
                    key={tf.days}
                    style={[
                        S.timeframeCard,
                        { borderColor: selected ? '#f97316' : theme.border, backgroundColor: selected ? 'rgba(249,115,22,0.08)' : theme.surface },
                    ]}
                    onPress={() => update('timeframeDays', tf.days)}
                    activeOpacity={0.8}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[S.timeframeLabel, { color: selected ? '#f97316' : theme.text }]}>{tf.label}</Text>
                        <Text style={[S.timeframeImpact, { color: isRush ? '#ef4444' : isDiscount ? '#10b981' : theme.textSecondary }]}>
                            {tf.impact}
                        </Text>
                    </View>
                    {selected ? (
                        <MaterialIcons name="radio-button-checked" size={22} color="#f97316" />
                    ) : (
                        <MaterialIcons name="radio-button-unchecked" size={22} color={theme.border} />
                    )}
                </TouchableOpacity>
            );
        })}

        <View style={[S.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="event" size={16} color={theme.primary} />
            <Text style={[S.infoText, { color: theme.textSecondary }]}>
                Est. completion: <Text style={{ color: theme.text, fontWeight: '700' }}>{estDate}</Text>
            </Text>
        </View>
        <View style={[S.infoBox, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }]}>
            <MaterialIcons name="schedule" size={16} color="#3b82f6" />
            <Text style={[S.infoText, { color: '#60a5fa' }]}>
                Campaign starts ~24–48 hrs after admin approval.
            </Text>
        </View>
        <View style={[S.pricePreview, { backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.3)' }]}>
            <MaterialIcons name="payments" size={16} color="#f97316" />
            <Text style={{ color: '#f97316', fontWeight: '700', marginLeft: 6 }}>
                Current estimate: ${quote.total.toFixed(2)}
            </Text>
        </View>
    </View>
);

// ─── Step 5: Review & Submit ──────────────────────────────────────────────────

interface Step5Props {
    state: WizardState;
    quote: PricingQuote;
    theme: any;
    submitting: boolean;
    onDraft: () => void;
    onSubmit: () => void;
}

const Step5Review: React.FC<Step5Props> = ({ state, quote, theme, submitting, onDraft, onSubmit }) => {
    const typeLabel = DATA_TYPES.find(t => t.value === state.taskType)?.label || state.taskType;
    const tierLabel = QUALITY_TIERS.find(t => t.value === state.qualityTier)?.label || state.qualityTier;

    return (
        <View>
            <Text style={[S.stepTitle, { color: theme.text }]}>Pricing & Review</Text>

            {/* Summary Card */}
            <View style={[S.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SummaryRow icon="category" label="Type" value={typeLabel} theme={theme} />
                <SummaryRow icon="format-list-numbered" label="Quantity" value={Number(state.quantity).toLocaleString()} theme={theme} />
                <SummaryRow icon="star" label="Quality" value={tierLabel} theme={theme} />
                <SummaryRow icon="public" label="Regions" value={state.regions.join(', ')} theme={theme} />
                <SummaryRow icon="event" label="Duration" value={`${state.timeframeDays} days`} theme={theme} />
            </View>

            {/* Price Breakdown */}
            <Text style={[S.label, { color: theme.textSecondary, marginTop: 20 }]}>Price Breakdown</Text>
            <View style={[S.breakdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <BreakdownRow label={`Base rate ($${quote.baseRate.toFixed(4)}/item × ${Number(state.quantity).toLocaleString()})`} value={`$${quote.baseTotal.toFixed(2)}`} theme={theme} />
                <BreakdownRow label={`Quality tier (×${quote.qualityMultiplier.toFixed(2)})`} value={`+$${quote.qualityExtra.toFixed(2)}`} theme={theme} isPos />
                {quote.volumeDiscount > 0 && (
                    <BreakdownRow label={`Volume discount (${(quote.volumeDiscountRate * 100).toFixed(0)}%)`} value={`-$${quote.volumeDiscount.toFixed(2)}`} theme={theme} isNeg />
                )}
                <BreakdownRow
                    label={`Timeframe factor (×${quote.timeframeMultiplier.toFixed(2)})`}
                    value={`${quote.timeframeAdjustment >= 0 ? '+' : ''}$${quote.timeframeAdjustment.toFixed(2)}`}
                    theme={theme}
                    isPos={quote.timeframeAdjustment >= 0}
                    isNeg={quote.timeframeAdjustment < 0}
                />
                {quote.regionExtra > 0 && (
                    <BreakdownRow label={`Region targeting (×${quote.regionMultiplier.toFixed(2)})`} value={`+$${quote.regionExtra.toFixed(2)}`} theme={theme} isPos />
                )}
                <View style={[S.breakdownDivider, { backgroundColor: theme.border }]} />
                <BreakdownRow label="Subtotal" value={`$${quote.subtotal.toFixed(2)}`} theme={theme} bold />
                <BreakdownRow label={`Platform fee (${(quote.platformFeeRate * 100).toFixed(0)}%)`} value={`+$${quote.platformFee.toFixed(2)}`} theme={theme} isPos />
                <View style={[S.breakdownDivider, { backgroundColor: theme.border }]} />
                <View style={S.totalRow}>
                    <Text style={[S.totalLabel, { color: theme.text }]}>TOTAL</Text>
                    <Text style={S.totalValue}>${quote.total.toFixed(2)}</Text>
                </View>
            </View>

            {/* Note */}
            <View style={[S.noteBox, { backgroundColor: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.2)' }]}>
                <MaterialIcons name="info-outline" size={15} color="#60a5fa" />
                <Text style={[S.noteText, { color: '#93c5fd' }]}>
                    Admin reviews within 24hrs. You'll be notified before payment is charged.
                </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
                style={[S.draftBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={onDraft}
                disabled={submitting}
            >
                <MaterialIcons name="save" size={18} color={theme.textSecondary} />
                <Text style={[S.draftBtnText, { color: theme.textSecondary }]}>Save as Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[S.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.85}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <MaterialIcons name="send" size={18} color="#fff" />
                        <Text style={S.submitBtnText}>Submit Request</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </View>
    );
};

// ─── Small UI helpers ─────────────────────────────────────────────────────────

const SummaryRow = ({ icon, label, value, theme }: any) => (
    <View style={S.summaryRow}>
        <MaterialIcons name={icon} size={15} color={theme.textSecondary} style={{ marginRight: 6 }} />
        <Text style={[S.summaryLabel, { color: theme.textSecondary }]}>{label}:</Text>
        <Text style={[S.summaryValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
);

const BreakdownRow = ({ label, value, theme, bold, isPos, isNeg }: any) => (
    <View style={S.breakdownRow}>
        <Text style={[S.breakdownLabel, { color: theme.textSecondary, fontWeight: bold ? '800' : '500' }]}>{label}</Text>
        <Text style={[
            S.breakdownValue,
            { color: isPos ? '#10b981' : isNeg ? '#ef4444' : bold ? theme.text : theme.textSecondary },
            bold && { fontWeight: '800' },
        ]}>{value}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    progressTrack: { height: 3 },
    progressFill: { height: 3 },
    body: { flex: 1 },
    bodyContent: { padding: 20, paddingBottom: 40 },
    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 32 : 14,
        borderTopWidth: 1, gap: 12,
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 14, borderWidth: 1,
    },
    backBtnText: { fontSize: 14, fontWeight: '700' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        backgroundColor: '#f97316', paddingVertical: 14, borderRadius: 14,
    },
    nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

    // Step header
    stepTitle: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
    stepSubtitle: { fontSize: 13, fontWeight: '500', lineHeight: 20, marginBottom: 24 },

    // Type grid
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    typeCard: {
        width: '47%', borderRadius: 16, borderWidth: 1.5,
        padding: 14, alignItems: 'center', position: 'relative',
    },
    typeIconCircle: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    typeLabel: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    typeDesc: { fontSize: 11, textAlign: 'center', lineHeight: 15 },
    selectedCheck: { position: 'absolute', top: 8, right: 8 },

    // Form fields
    label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
    inputLarge: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16, fontSize: 28, fontWeight: '900', textAlign: 'center' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    hint: { fontSize: 11, marginTop: 4, marginBottom: 8 },

    // Guidelines
    guideSection: { borderWidth: 1, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
    guideSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
    guideSectionLabel: { fontSize: 13, fontWeight: '700' },
    guideInput: { minHeight: 100, borderWidth: 0, borderRadius: 0 },

    // Chips
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
    chipText: { fontSize: 13, fontWeight: '700' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

    // Quality tiers
    tierCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
    tierLabel: { fontSize: 14, fontWeight: '800' },
    tierDesc: { fontSize: 11, marginTop: 2 },
    tierRate: { fontSize: 12, fontWeight: '700', marginLeft: 8 },

    // Segmented control
    segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    segmentBtnText: { fontSize: 12, fontWeight: '700' },

    // Timeframe cards
    timeframeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 },
    timeframeLabel: { fontSize: 16, fontWeight: '800' },
    timeframeImpact: { fontSize: 12, fontWeight: '700', marginTop: 2 },

    // Info / note boxes
    infoBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
    infoText: { fontSize: 12, marginLeft: 8, flex: 1 },
    pricePreview: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 16 },
    noteBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 16, marginBottom: 16 },
    noteText: { fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 18 },

    // Summary & Breakdown
    summaryCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    summaryLabel: { fontSize: 13, fontWeight: '600', width: 80 },
    summaryValue: { fontSize: 13, fontWeight: '700', flex: 1 },
    breakdownCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    breakdownLabel: { fontSize: 13, flex: 1 },
    breakdownValue: { fontSize: 13, fontWeight: '700' },
    breakdownDivider: { height: 1, marginVertical: 8 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
    totalLabel: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    totalValue: { fontSize: 26, fontWeight: '900', color: '#f97316' },

    // Submit buttons
    draftBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 16,
    },
    draftBtnText: { fontSize: 14, fontWeight: '700' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#f97316', borderRadius: 14, paddingVertical: 16, marginTop: 10,
    },
    submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
