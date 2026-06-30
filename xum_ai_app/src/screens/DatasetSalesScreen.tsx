import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import {
    getMarketplaceDatasets,
    getUserPurchases,
    purchaseDataset,
    MarketplaceDataset,
    DatasetPurchase,
} from '../services/datasetService';

interface DatasetSalesScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
    session: any;
}

const TASK_TYPE_ICONS: Record<string, string> = {
    audio: 'mic',
    image: 'image',
    video: 'videocam',
    text: 'description',
    validation: 'verified',
    linguasense: 'translate',
};

const SORT_OPTIONS = [
    { key: 'price_asc' as const, label: 'Price ↑' },
    { key: 'price_desc' as const, label: 'Price ↓' },
    { key: 'quality' as const, label: 'Quality' },
    { key: 'size' as const, label: 'Size' },
];

export const DatasetSalesScreen: React.FC<DatasetSalesScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'browse' | 'purchases'>('browse');
    const [datasets, setDatasets] = useState<MarketplaceDataset[]>([]);
    const [purchases, setPurchases] = useState<DatasetPurchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'quality' | 'size'>('quality');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        if (activeTab === 'browse') loadDatasets();
        else loadPurchases();
    }, [activeTab, sortBy, typeFilter]);

    const loadDatasets = async () => {
        setLoading(true);
        const data = await getMarketplaceDatasets({
            sort: sortBy,
            task_type: typeFilter !== 'all' ? typeFilter : undefined,
        });
        setDatasets(data);
        setLoading(false);
    };

    const loadPurchases = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        const data = await getUserPurchases(session.user.id);
        setPurchases(data);
        setLoading(false);
    };

    const handlePurchase = (dataset: MarketplaceDataset) => {
        if (!session?.user?.id) {
            Alert.alert('Error', 'You must be signed in to purchase.');
            return;
        }
        Alert.alert(
            'Purchase Dataset',
            `Buy "${dataset.name}" for $${dataset.price_usd.toFixed(2)}?\n\nThis will be deducted from your wallet balance.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Buy — $${dataset.price_usd.toFixed(2)}`,
                    onPress: async () => {
                        setPurchasing(dataset.id);
                        const result = await purchaseDataset(session.user.id, dataset.id);
                        setPurchasing(null);
                        if (result.success) {
                            Alert.alert('Purchase Complete', `"${dataset.name}" is now in your library. You can access it from My Purchases.`);
                            setDatasets(prev => prev.filter(d => d.id !== dataset.id));
                        } else {
                            Alert.alert('Purchase Failed', result.error || 'An error occurred. Check your wallet balance.');
                        }
                    },
                },
            ]
        );
    };

    const getQualityColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.TASK_MARKETPLACE)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>
                    DATASET STORE
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                {(['browse', 'purchases'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            paddingVertical: 14,
                            alignItems: 'center',
                            borderBottomWidth: 2,
                            borderBottomColor: activeTab === tab ? theme.primary : 'transparent',
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === tab ? theme.primary : theme.textSecondary, textTransform: 'capitalize' }}>
                            {tab === 'browse' ? 'Browse Datasets' : 'My Purchases'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'browse' ? (
                <>
                    {/* Sort & Filter Row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
                        {SORT_OPTIONS.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setSortBy(key)}
                                style={{
                                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                                    backgroundColor: sortBy === key ? theme.primary : `${theme.primary}10`,
                                    borderWidth: 1,
                                    borderColor: sortBy === key ? theme.primary : theme.border,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy === key ? '#fff' : theme.textSecondary }}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={{ width: 1, backgroundColor: theme.border, marginHorizontal: 4 }} />
                        {['all', 'audio', 'image', 'text', 'video'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setTypeFilter(type)}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                                    backgroundColor: typeFilter === type ? '#7c3aed20' : 'rgba(0,0,0,0.04)',
                                    borderWidth: 1,
                                    borderColor: typeFilter === type ? '#7c3aed' : theme.border,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: typeFilter === type ? '#7c3aed' : theme.textSecondary, textTransform: 'capitalize' }}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                        {loading ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
                        ) : datasets.length === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 80 }}>
                                <MaterialIcons name="inventory-2" size={56} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: 'center' }}>
                                    No datasets available yet.{'\n'}Check back soon!
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 16 }}>
                                {datasets.map((ds) => {
                                    const icon = TASK_TYPE_ICONS[ds.task_type] || 'dataset';
                                    const qualityColor = getQualityColor(ds.quality_score);
                                    const isPurchasing = purchasing === ds.id;

                                    return (
                                        <View
                                            key={ds.id}
                                            style={{
                                                backgroundColor: theme.surface,
                                                borderRadius: 20,
                                                padding: 16,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                            }}
                                        >
                                            {/* Header row */}
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                                    <MaterialIcons name={icon as any} size={22} color={theme.primary} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>
                                                        {ds.name}
                                                    </Text>
                                                    {ds.description && (
                                                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }} numberOfLines={2}>
                                                            {ds.description}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text style={{ fontSize: 18, fontWeight: '900', color: theme.primary, marginLeft: 8 }}>
                                                    ${ds.price_usd.toFixed(0)}
                                                </Text>
                                            </View>

                                            {/* Stats */}
                                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                                <View style={{ flex: 1, backgroundColor: `${theme.primary}08`, borderRadius: 10, padding: 8, alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{ds.samples_count?.toLocaleString() ?? '—'}</Text>
                                                    <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase' }}>Samples</Text>
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: `${theme.primary}08`, borderRadius: 10, padding: 8, alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{ds.size_mb?.toFixed(1) ?? '—'} MB</Text>
                                                    <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase' }}>Size</Text>
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: `${qualityColor}15`, borderRadius: 10, padding: 8, alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '800', color: qualityColor }}>{ds.quality_score ?? '—'}</Text>
                                                    <Text style={{ fontSize: 9, color: qualityColor, fontWeight: '600', textTransform: 'uppercase' }}>Quality</Text>
                                                </View>
                                            </View>

                                            {/* Tags */}
                                            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                                                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${theme.primary}15` }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary, textTransform: 'uppercase' }}>{ds.task_type}</Text>
                                                </View>
                                                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(100,116,139,0.1)' }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>{ds.language || 'multilingual'}</Text>
                                                </View>
                                            </View>

                                            {/* Purchase button */}
                                            <TouchableOpacity
                                                onPress={() => handlePurchase(ds)}
                                                disabled={isPurchasing}
                                                style={{
                                                    backgroundColor: theme.primary,
                                                    borderRadius: 12,
                                                    paddingVertical: 12,
                                                    alignItems: 'center',
                                                    opacity: isPurchasing ? 0.7 : 1,
                                                }}
                                            >
                                                {isPurchasing ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                                                        Purchase — ${ds.price_usd.toFixed(2)}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                </>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
                    ) : purchases.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 80 }}>
                            <MaterialIcons name="shopping-bag" size={56} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: 'center' }}>
                                No purchases yet.{'\n'}Browse the store to find datasets.
                            </Text>
                            <TouchableOpacity
                                onPress={() => setActiveTab('browse')}
                                style={{ marginTop: 20, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Browse Datasets</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ gap: 14 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                {purchases.length} dataset{purchases.length !== 1 ? 's' : ''} purchased
                            </Text>
                            {purchases.map((p) => {
                                const ds = p.datasets;
                                return (
                                    <View
                                        key={p.id}
                                        style={{
                                            backgroundColor: theme.surface,
                                            borderRadius: 16,
                                            padding: 16,
                                            borderWidth: 1,
                                            borderColor: theme.border,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#10b98115', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <MaterialIcons name={(TASK_TYPE_ICONS[ds?.task_type || ''] || 'dataset') as any} size={22} color="#10b981" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{ds?.name || 'Dataset'}</Text>
                                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                                                Purchased {new Date(p.purchased_at).toLocaleDateString()} · ${p.price_paid?.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#10b98120' }}>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>Owned</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};
