import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { supabase } from '../supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/clerk-expo';
import { Input, Avatar, Button } from '../components/primitives';
import { TEXT_STYLES, SPACING, LAYOUT } from '../constants/designTokens';

interface EditProfileScreenProps {
    onNavigate: (screen: any) => void;
    onBack: () => void;
    session: any;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [fullName, setFullName] = useState(user?.fullName || session?.user?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0].uri && user) {
                setUploading(true);
                const uri = result.assets[0].uri;

                try {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    await user.setProfileImage({ file: blob });
                    Alert.alert("Success", "Profile picture updated!");
                } catch (err: any) {
                    console.error("Avatar upload error:", err);
                    Alert.alert("Error", "Failed to upload image. " + (err.message || ""));
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error("Image picker error:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const names = fullName.trim().split(' ');
            const firstName = names[0];
            const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

            await user.update({
                firstName,
                lastName,
            });

            Alert.alert("Success", "Profile updated successfully!");
            onBack();
        } catch (error: any) {
            console.error("Profile update error:", error);
            Alert.alert("Error", "Failed to update profile. " + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[TEXT_STYLES.h5, { color: theme.text, letterSpacing: 2, textTransform: 'uppercase' }]}>
                    Edit Profile
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={loading || uploading}>
                    <Text style={[TEXT_STYLES.label, {
                        color: theme.primary,
                        fontWeight: '700',
                        opacity: (loading || uploading) ? 0.5 : 1
                    }]}>
                        {loading ? 'SAVING...' : 'SAVE'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
                        <View style={styles.avatarContainer}>
                            <Avatar
                                source={user?.imageUrl || session?.user?.avatar_url}
                                initials={(user?.fullName || 'User').substring(0, 2)}
                                size="xl"
                                style={{ opacity: uploading ? 0.5 : 1 }}
                            />
                            {uploading && (
                                <View style={StyleSheet.absoluteFill}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={[TEXT_STYLES.label, { color: theme.textInverse }]}>...</Text>
                                    </View>
                                </View>
                            )}
                            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                                <MaterialIcons name="camera-alt" size={16} color={theme.textInverse} />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text style={[TEXT_STYLES.bodySmall, { color: theme.textSecondary, marginTop: SPACING.md }]}>
                        {uploading ? 'Uploading...' : 'Tap for new profile picture'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="FULL NAME"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your name"
                    />

                    <View>
                        <Input
                            label="EMAIL"
                            value={user?.primaryEmailAddress?.emailAddress || session?.user?.email}
                            editable={false}
                        />
                        <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, marginTop: SPACING.xs }]}>
                            Email cannot be changed directly.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    form: {
        gap: SPACING.lg,
    },
});

