import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { UserService } from '../services/userService';
import { Header } from '../components/Shared';
import { useUser } from '@clerk/clerk-expo';

interface PaymentMethodsScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
}

interface PaymentMethod {
    id: string; // Database ID
    type: 'bank' | 'paypal' | 'mobile' | 'crypto';
    title: string; // "Bank Name", "PayPal", etc.
    details: string; // "Ends in 1234", email, etc.
    currency: string;
    is_default?: boolean;
    metadata?: any; // Store full bank details here
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PaymentMethodsScreen = ({ onNavigate, onBack }: PaymentMethodsScreenProps) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentType, setPaymentType] = useState<'bank' | 'paypal' | 'mobile' | 'crypto'>('bank');
    const [currency, setCurrency] = useState('NGN');
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        swiftCode: '',
    });
    const [emailDetails, setEmailDetails] = useState(''); // For PayPal
    const [mobileDetails, setMobileDetails] = useState(''); // For Mobile Money
    const [cryptoDetails, setCryptoDetails] = useState(''); // For Crypto

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    const fetchPaymentMethods = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await UserService.getPaymentDetails(user.id);
            // Transform DB data to UI format if needed, but direct map should work if schema aligns
            // Assuming DB returns compatible structure or we map it here.
            // For now, let's assume we store 'metadata' JSON in Supabase for the details
            const mapped: PaymentMethod[] = (data || []).map((item: any) => ({
                id: item.id,
                type: item.type,
                title: item.provider_name || (item.type === 'bank' ? 'Bank Account' : item.type === 'paypal' ? 'PayPal' : item.type === 'crypto' ? 'Crypto Wallet' : 'Mobile Money'),
                details: item.account_identifier || '',
                currency: item.currency || 'USD',
                is_default: item.is_default
            }));
            setPaymentMethods(mapped);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    const handleAddPaymentMethod = async () => {
        if (!user) return;

        // Block saving for non-bank methods
        if (paymentType !== 'bank') {
            return;
        }

        let newMethodDetails: any = {
            type: paymentType,
            currency,
            user_id: user.id
        };

        if (paymentType === 'bank') {
            if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolder) {
                Alert.alert("Missing Information", "Please fill in all required bank details.");
                return;
            }
            newMethodDetails.provider_name = bankDetails.bankName;
            newMethodDetails.account_identifier = `**** ${bankDetails.accountNumber.slice(-4)}`;
            newMethodDetails.metadata = bankDetails; // Store full sensitive details securely? (In production, be careful)
        }

        // Optimistic UI update
        const tempId = Date.now().toString();
        const optimisticMethod: PaymentMethod = {
            id: tempId,
            type: paymentType,
            title: newMethodDetails.provider_name,
            details: newMethodDetails.account_identifier,
            currency,
            is_default: paymentMethods.length === 0
        };
        setPaymentMethods([...paymentMethods, optimisticMethod]);
        setShowAddModal(false);

        // Reset forms
        setBankDetails({ bankName: '', accountNumber: '', accountHolder: '', swiftCode: '' });
        setEmailDetails('');
        setMobileDetails('');
        setCryptoDetails('');

        try {
            const success = await UserService.savePaymentDetails(user.id, newMethodDetails);
            if (success) {
                Alert.alert("Success", "Payment method added successfully!");
                fetchPaymentMethods(); // Refresh to get real ID
            } else {
                Alert.alert("Error", "Failed to save payment method.");
                setPaymentMethods(prev => prev.filter(m => m.id !== tempId)); // Revert
            }
        } catch (error) {
            console.error(error);
            setPaymentMethods(prev => prev.filter(m => m.id !== tempId)); // Revert
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return 'account-balance';
            case 'paypal': return 'payment';
            case 'mobile': return 'phone-android';
            case 'crypto': return 'currency-bitcoin';
            default: return 'credit-card';
        }
    };

    const isSubmitDisabled = paymentType !== 'bank';

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Header
                title="Payment Methods"
                onBack={() => onBack ? onBack() : onNavigate(ScreenName.SETTINGS)}
            />

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 16 }}>
                        SAVED PAYMENT METHODS
                    </Text>

                    {paymentMethods.length === 0 && (
                        <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginBottom: 20 }}>
                            No payment methods saved yet.
                        </Text>
                    )}

                    {paymentMethods.map((method) => (
                        <View
                            key={method.id}
                            style={{
                                backgroundColor: theme.surface,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: method.is_default ? theme.primary : theme.border,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: `${theme.primary}15`,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                    <MaterialIcons name={getIcon(method.type) as any} size={24} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{method.title}</Text>
                                        {method.is_default && (
                                            <View style={{
                                                backgroundColor: `${theme.primary}20`,
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 4,
                                            }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary }}>DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                                        {method.details} • {method.currency}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity>
                                <MaterialIcons name="more-vert" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => setShowAddModal(true)}
                        style={{
                            backgroundColor: theme.surface,
                            borderRadius: 12,
                            padding: 20,
                            borderWidth: 2,
                            borderColor: theme.border,
                            borderStyle: 'dashed',
                            alignItems: 'center',
                            marginTop: 8,
                        }}
                    >
                        <MaterialIcons name="add-circle-outline" size={32} color={theme.primary} />
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.primary, marginTop: 8 }}>
                            Add Payment Method
                        </Text>
                    </TouchableOpacity>

                    <View style={{
                        backgroundColor: `${theme.primary}10`,
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 24,
                        borderLeftWidth: 4,
                        borderLeftColor: theme.primary,
                    }}>
                        <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                            💡 Your payment methods will be used for withdrawals. You can add multiple methods and set a default for faster transactions.
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* Add Payment Method Modal */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%' }}
                    >
                        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: SCREEN_HEIGHT * 0.85 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Add Payment Method</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Payment Type Selection */}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Payment Type</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => { setPaymentType('bank'); setCurrency('NGN'); }}
                                        style={{
                                            width: '47%',
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: paymentType === 'bank' ? theme.primary : theme.border,
                                            backgroundColor: paymentType === 'bank' ? `${theme.primary}10` : theme.background,
                                        }}
                                    >
                                        <MaterialIcons name="account-balance" size={24} color={paymentType === 'bank' ? theme.primary : theme.textSecondary} style={{ marginBottom: 8 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>Bank Transfer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPaymentType('paypal')}
                                        style={{
                                            width: '47%',
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: paymentType === 'paypal' ? theme.primary : theme.border,
                                            backgroundColor: paymentType === 'paypal' ? `${theme.primary}10` : theme.background,
                                        }}
                                    >
                                        <MaterialIcons name="payment" size={24} color={paymentType === 'paypal' ? theme.primary : theme.textSecondary} style={{ marginBottom: 8 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>PayPal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPaymentType('mobile')}
                                        style={{
                                            width: '47%',
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: paymentType === 'mobile' ? theme.primary : theme.border,
                                            backgroundColor: paymentType === 'mobile' ? `${theme.primary}10` : theme.background,
                                        }}
                                    >
                                        <MaterialIcons name="phone-android" size={24} color={paymentType === 'mobile' ? theme.primary : theme.textSecondary} style={{ marginBottom: 8 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>Mobile Money</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPaymentType('crypto')}
                                        style={{
                                            width: '47%',
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: paymentType === 'crypto' ? theme.primary : theme.border,
                                            backgroundColor: paymentType === 'crypto' ? `${theme.primary}10` : theme.background,
                                        }}
                                    >
                                        <MaterialIcons name="currency-bitcoin" size={24} color={paymentType === 'crypto' ? theme.primary : theme.textSecondary} style={{ marginBottom: 8 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>Crypto</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Currency Selection */}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Currency</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                    {['NGN', 'USD', 'EUR', 'GBP', 'KES', 'ZAR'].map((curr) => {
                                        const isDisabled = paymentType === 'bank' && curr !== 'NGN';
                                        return (
                                            <TouchableOpacity
                                                key={curr}
                                                onPress={() => !isDisabled && setCurrency(curr)}
                                                style={{
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 16,
                                                    borderRadius: 20,
                                                    borderWidth: 2,
                                                    borderColor: currency === curr ? theme.primary : theme.border,
                                                    backgroundColor: currency === curr ? `${theme.primary}20` : isDisabled ? theme.background : theme.background,
                                                    marginRight: 8,
                                                    opacity: isDisabled ? 0.3 : 1
                                                }}
                                                disabled={isDisabled}
                                            >
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: currency === curr ? theme.primary : theme.textSecondary }}>{curr}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                {/* Bank Details */}
                                {paymentType === 'bank' && (
                                    <>
                                        <View style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            borderColor: 'rgba(239, 68, 68, 0.2)',
                                            borderWidth: 1,
                                            borderRadius: 8,
                                            padding: 12,
                                            marginBottom: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}>
                                            <MaterialIcons name="info" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                                            <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>Only Naira transactions are available at this time.</Text>
                                        </View>

                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Bank Details</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 12,
                                            }}
                                            placeholder="Bank Name"
                                            placeholderTextColor={theme.textSecondary}
                                            value={bankDetails.bankName}
                                            onChangeText={(text: string) => setBankDetails({ ...bankDetails, bankName: text })}
                                        />
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 12,
                                            }}
                                            placeholder="Account Number"
                                            placeholderTextColor={theme.textSecondary}
                                            keyboardType="number-pad"
                                            value={bankDetails.accountNumber}
                                            onChangeText={(text: string) => setBankDetails({ ...bankDetails, accountNumber: text })}
                                        />
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 12,
                                            }}
                                            placeholder="Account Holder Name"
                                            placeholderTextColor={theme.textSecondary}
                                            value={bankDetails.accountHolder}
                                            onChangeText={(text: string) => setBankDetails({ ...bankDetails, accountHolder: text })}
                                        />
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 20,
                                            }}
                                            placeholder="SWIFT Code (Optional)"
                                            placeholderTextColor={theme.textSecondary}
                                            value={bankDetails.swiftCode}
                                            onChangeText={(text: string) => setBankDetails({ ...bankDetails, swiftCode: text })}
                                        />
                                    </>
                                )}

                                {paymentType === 'paypal' && (
                                    <>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>PayPal Details</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 20,
                                            }}
                                            placeholder="PayPal Email Address"
                                            placeholderTextColor={theme.textSecondary}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={emailDetails}
                                            onChangeText={setEmailDetails}
                                        />
                                    </>
                                )}

                                {paymentType === 'mobile' && (
                                    <>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Mobile Money Details</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 20,
                                            }}
                                            placeholder="Mobile Number"
                                            placeholderTextColor={theme.textSecondary}
                                            keyboardType="phone-pad"
                                            value={mobileDetails}
                                            onChangeText={setMobileDetails}
                                        />
                                    </>
                                )}

                                {paymentType === 'crypto' && (
                                    <>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Crypto Wallet</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: theme.background,
                                                borderRadius: 12,
                                                padding: 16,
                                                fontSize: 16,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                marginBottom: 20,
                                            }}
                                            placeholder="Wallet Address"
                                            placeholderTextColor={theme.textSecondary}
                                            value={cryptoDetails}
                                            onChangeText={setCryptoDetails}
                                        />
                                    </>
                                )}

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleAddPaymentMethod}
                                    disabled={isSubmitDisabled}
                                    style={{
                                        backgroundColor: isSubmitDisabled ? theme.border : theme.primary,
                                        borderRadius: 12,
                                        padding: 18,
                                        alignItems: 'center',
                                        marginTop: 10,
                                        opacity: isSubmitDisabled ? 0.6 : 1,
                                        marginBottom: 40
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: isSubmitDisabled ? theme.textSecondary : '#fff' }}>
                                        {isSubmitDisabled ? 'Method Unavailable' : 'Save Payment Method'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};
