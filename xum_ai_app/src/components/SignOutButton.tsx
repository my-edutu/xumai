/**
 * Sign Out Button Component
 * 
 * Uses Clerk's useClerk() hook to access the signOut() function
 * as recommended in the official documentation.
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useClerk } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { MaterialIcons } from '@expo/vector-icons';

interface SignOutButtonProps {
    style?: any;
    textStyle?: any;
    showIcon?: boolean;
    label?: string;
    onSignOutComplete?: () => void;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
    style,
    textStyle,
    showIcon = true,
    label = 'Sign out',
    onSignOutComplete,
}) => {
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Call optional callback
            onSignOutComplete?.();
            // Redirect to root
            Linking.openURL(Linking.createURL('/'));
        } catch (err) {
            console.error('[SignOut] Error:', JSON.stringify(err, null, 2));
        }
    };

    return (
        <TouchableOpacity style={[styles.button, style]} onPress={handleSignOut}>
            {showIcon && <MaterialIcons name="logout" size={18} color="#dc2626" />}
            <Text style={[styles.text, textStyle]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    text: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SignOutButton;
