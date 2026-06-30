import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface NeuralInputModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (s: ScreenName) => void;
}

export const NeuralInputModal = ({
    visible,
    onClose,
    onNavigate,
}: NeuralInputModalProps) => {
    const { theme } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[modalStyles.container, { paddingBottom: 80 }]}>
                    <View style={modalStyles.dragHandle} />

                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>CREATE TASK</Text>
                        <Text style={modalStyles.subtitle}>Choose your input method</Text>
                    </View>

                    <View style={modalStyles.content}>
                        <TouchableOpacity
                            style={modalStyles.cardWrapper}
                            onPress={() => { onClose(); onNavigate(ScreenName.ENVIRONMENTAL_SENSING); }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#10b981', '#059669']} style={modalStyles.inputCard}>
                                <View style={modalStyles.cardContent}>
                                    <View style={modalStyles.iconCircle}>
                                        <MaterialIcons name="photo-camera" size={28} color="#fff" />
                                    </View>
                                    <View style={modalStyles.cardTextContainer}>
                                        <Text style={modalStyles.cardTitle}>Capture Data</Text>
                                        <Text style={modalStyles.cardSubtitle}>Photos, videos, and voice recordings</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="arrow-forward" size={24} color="rgba(255,255,255,0.6)" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={modalStyles.cardWrapper}
                            onPress={() => { onClose(); onNavigate(ScreenName.LEXICON_TASK); }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#8b5cf6', '#6366f1']} style={modalStyles.inputCard}>
                                <View style={modalStyles.cardContent}>
                                    <View style={modalStyles.iconCircle}>
                                        <MaterialIcons name="translate" size={28} color="#fff" />
                                    </View>
                                    <View style={modalStyles.cardTextContainer}>
                                        <Text style={modalStyles.cardTitle}>XUM Lexicon</Text>
                                        <Text style={modalStyles.cardSubtitle}>Name the world in your language</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="arrow-forward" size={24} color="rgba(255,255,255,0.6)" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={modalStyles.cardWrapper}
                            onPress={() => { onClose(); onNavigate(ScreenName.XUM_JUDGE); }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#ec4899', '#f43f5e']} style={modalStyles.inputCard}>
                                <View style={modalStyles.cardContent}>
                                    <View style={modalStyles.iconCircle}>
                                        <MaterialIcons name="balance" size={28} color="#fff" />
                                    </View>
                                    <View style={modalStyles.cardTextContainer}>
                                        <Text style={modalStyles.cardTitle}>XUM Judge</Text>
                                        <Text style={modalStyles.cardSubtitle}>Judge AI responses — highest pay</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="arrow-forward" size={24} color="rgba(255,255,255,0.6)" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
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
        paddingBottom: 48,
    },
    dragHandle: {
        width: 48,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 3,
        alignSelf: 'center',
        marginVertical: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.5)',
    },
    content: {
        gap: 16,
    },
    cardWrapper: {
        width: '100%',
    },
    inputCard: {
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 88,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
    },
});
