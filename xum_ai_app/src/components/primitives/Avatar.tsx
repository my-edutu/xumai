/**
 * Avatar Component
 * 
 * User avatar with image or initials fallback
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LAYOUT, TEXT_STYLES } from '../../constants/designTokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
    /** Image URI */
    source?: string;
    /** Fallback initials (e.g., 'JD' for John Doe) */
    initials?: string;
    /** Avatar size */
    size?: AvatarSize;
    /** Show online status indicator */
    showStatus?: boolean;
    /** Online status (true=online, false=offline) */
    online?: boolean;
    /** Custom style */
    style?: ViewStyle;
    /** Press handler */
    onPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
    source,
    initials = '??',
    size = 'md',
    showStatus = false,
    online = false,
    style,
    onPress,
}) => {
    const { theme } = useTheme();

    // Size configurations
    const sizeConfig = {
        sm: {
            dimension: 32,
            fontSize: 12,
            statusSize: 8,
        },
        md: {
            dimension: 48,
            fontSize: 16,
            statusSize: 12,
        },
        lg: {
            dimension: 64,
            fontSize: 20,
            statusSize: 14,
        },
        xl: {
            dimension: 96,
            fontSize: 32,
            statusSize: 18,
        },
    };

    const config = sizeConfig[size];

    const containerStyle = [
        styles.container,
        {
            width: config.dimension,
            height: config.dimension,
            borderRadius: config.dimension / 2,
            backgroundColor: theme.primary,
        },
        style,
    ];

    const statusStyle = [
        styles.status,
        {
            width: config.statusSize,
            height: config.statusSize,
            borderRadius: config.statusSize / 2,
            backgroundColor: online ? theme.success : theme.textTertiary,
            borderColor: theme.surface,
        },
    ];

    const content = (
        <>
            {source ? (
                <Image
                    source={{ uri: source }}
                    style={[
                        styles.image,
                        {
                            width: config.dimension,
                            height: config.dimension,
                            borderRadius: config.dimension / 2,
                        },
                    ]}
                />
            ) : (
                <Text
                    style={[
                        TEXT_STYLES.label,
                        {
                            fontSize: config.fontSize,
                            fontWeight: '700',
                            color: theme.textInverse,
                        },
                    ]}
                >
                    {initials.substring(0, 2).toUpperCase()}
                </Text>
            )}
            {showStatus && <View style={statusStyle} />}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={containerStyle}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        resizeMode: 'cover',
    },
    status: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
    },
});
