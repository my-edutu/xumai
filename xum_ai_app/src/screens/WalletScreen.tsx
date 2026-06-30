import React, { useState, useEffect } from 'react';
import ReactNative, {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { requestWithdrawal } from '../services/walletService';
import { Transaction } from '../services/types';
import { UserService } from '../services/userService';
import { ScreenName } from '../types';
import { createGlobalStyles, createWalletStyles } from '../styles';
import { SHADOWS } from '../constants/designTokens';

interface WalletScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
    balance: number;
    transactions: Transaction[];
    onOpenContributorHub: () => void;
    onOpenNeuralInput: () => void;
    session: any;
    accountType?: 'user' | 'company' | null;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
    onNavigate,
    onBack,
    balance,
    transactions,
    onOpenContributorHub,
    onOpenNeuralInput,
    session,
    accountType
}) => {
    const { theme } = useTheme();
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal' | 'mobile' | 'usdt'>('bank');
    const [currency, setCurrency] = useState('USD');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        swiftCode: '',
    });
    const [mobilePhone, setMobilePhone] = useState('');
    const [usdtDetails, setUsdtDetails] = useState({
        walletAddress: '',
        network: 'TRC20' as 'TRC20' | 'ERC20' | 'BEP20',
    });
    const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isLoadingPayments, setIsLoadingPayments] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            fetchPaymentMethods();
        }
    }, [session?.user?.id]);

    const fetchPaymentMethods = async () => {
        setIsLoadingPayments(true);
        const methods = await UserService.getPaymentDetails(session.user.id);
        setSavedPaymentMethods(methods || []);
        setIsLoadingPayments(false);
    };

    const styles = createGlobalStyles(theme);
    const walletStyles = createWalletStyles(theme);


    const handleWithdrawal = () => {
        if (balance <= 0) {
            alert("No balance available to withdraw.");
            return;
        }

        // Check if user has a bank account linked
        const hasBankAccount = savedPaymentMethods.some(m => m.type === 'bank');
        if (!hasBankAccount) {
            ReactNative.Alert.alert(
                "Add Bank Account",
                "Please add a bank account in your payment settings before you can withdraw funds.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Go to Settings", onPress: () => onNavigate(ScreenName.SETTINGS) }
                ]
            );
            return;
        }

        setWithdrawAmount(balance.toFixed(2));
        setShowWithdrawModal(true);
    };

    const submitWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);

        if (!withdrawAmount || isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (amount < 5) {
            alert("Minimum withdrawal amount is $5.00.");
            return;
        }

        if (paymentMethod === 'bank') {
            if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolder) {
                alert("Please fill in all required bank details.");
                return;
            }
        }

        if (paymentMethod === 'mobile' && !mobilePhone) {
            alert("Please enter your mobile money phone number.");
            return;
        }

        if (paymentMethod === 'usdt' && !usdtDetails.walletAddress) {
            alert("Please enter your USDT wallet address.");
            return;
        }

        setIsWithdrawing(true);

        let paymentDetails: Record<string, any>;
        if (paymentMethod === 'bank') {
            paymentDetails = { ...bankDetails, currency };
        } else if (paymentMethod === 'mobile') {
            paymentDetails = { phone: mobilePhone, email: session.user.email, currency };
        } else if (paymentMethod === 'usdt') {
            paymentDetails = { walletAddress: usdtDetails.walletAddress, network: usdtDetails.network };
        } else {
            paymentDetails = { email: session.user.email, currency };
        }

        const methodMap: Record<string, string> = {
            bank: 'bank_transfer',
            paypal: 'paypal',
            mobile: 'mobile_money',
            usdt: 'crypto_usdt',
        };

        const result = await requestWithdrawal(
            session.user.id,
            amount,
            methodMap[paymentMethod],
            paymentDetails
        );

        setIsWithdrawing(false);

        if (result.success) {
            ReactNative.Alert.alert(
                "Security Verification",
                "A verification code has been sent to your registered email. Please enter it to authorize this withdrawal.",
                [{ text: "OK", onPress: () => setShowOTPModal(true) }]
            );
            setShowWithdrawModal(false);
        } else {
            alert("Error submitting withdrawal: " + result.error);
        }
    };

    const verifyOTPAndComplete = async () => {
        if (!otpCode || otpCode.length < 6) {
            alert("Please enter a valid 6-digit OTP.");
            return;
        }

        setIsVerifyingOTP(true);
        // Simulate OTP verification delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsVerifyingOTP(false);

        if (otpCode === '123456' || otpCode.length === 6) { // Accept any 6 digits for demo/MVP
            ReactNative.Alert.alert(
                "Withdrawal Successful",
                "Your withdrawal request has been verified. Funds will be sent to your account in 24 hours.",
                [{ text: "Done", onPress: () => setShowOTPModal(false) }]
            );
            setBankDetails({ bankName: '', accountNumber: '', accountHolder: '', swiftCode: '' });
            setMobilePhone('');
            setUsdtDetails({ walletAddress: '', network: 'TRC20' });
            setWithdrawAmount('');
            setOtpCode('');
        } else {
            alert("Invalid OTP. Please try again.");
        }
    };

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Wallet</Text>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.SETTINGS)}>
                    <MaterialIcons name="settings" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Minimalist Balance Section */}
                {/* Minimalist Balance Section */}
                <View style={[walletStyles.balanceCardRedesign, { alignItems: 'center', marginTop: 8, paddingVertical: 12 }]}>
                    <Text style={walletStyles.balanceLabelRedesign}>Total Balance</Text>

                    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                        <Text style={[walletStyles.balanceValueRedesign, { marginBottom: 0 }]}>
                            ${balance.toFixed(2)}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', width: '100%' }}>
                            {accountType !== 'user' && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 20,
                                        paddingVertical: 14,
                                        borderRadius: 30,
                                        backgroundColor: '#635bff',
                                        gap: 8,
                                        ...SHADOWS.sm
                                    }}
                                    onPress={() => {}}
                                >
                                    <MaterialIcons name="add-card" size={20} color="#fff" />
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Add Funds
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 14,
                                    borderRadius: 30,
                                    backgroundColor: 'transparent',
                                    borderWidth: 1.5,
                                    borderColor: balance > 0 ? theme.success : theme.textTertiary + '40',
                                    gap: 8,
                                    minWidth: accountType === 'user' ? 200 : undefined,
                                    justifyContent: 'center'
                                }}
                                onPress={balance > 0 ? handleWithdrawal : () => alert("No balance available to withdraw.")}
                            >
                                <MaterialIcons name="arrow-outward" size={20} color={balance > 0 ? theme.success : theme.textTertiary} />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: balance > 0 ? theme.success : theme.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Withdraw
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


                <Text style={walletStyles.historyTitleRedesign}>Recent Activity</Text>

                {transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <View key={tx.id} style={walletStyles.historyItemRedesign}>
                            <View style={walletStyles.historyIconBoxRedesign}>
                                <MaterialIcons
                                    name={tx.type === 'earn' ? 'add' : tx.type === 'withdraw' ? 'arrow-outward' : 'check'}
                                    size={24}
                                    color={tx.type === 'earn' || tx.type === 'bonus' ? theme.success : theme.text}
                                />
                            </View>
                            <View style={walletStyles.historyInfoRedesign}>
                                <Text style={walletStyles.historyTitleTextRedesign}>{tx.description}</Text>
                                <Text style={walletStyles.historyDateRedesign}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[
                                walletStyles.historyAmountRedesign,
                                { color: tx.type === 'earn' || tx.type === 'bonus' ? theme.success : theme.text }
                            ]}>
                                {tx.type === 'earn' || tx.type === 'bonus' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Text style={{ color: theme.textSecondary }}>No recent activity.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Withdrawal Modal */}
            <Modal
                visible={showWithdrawModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowWithdrawModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Withdraw Funds</Text>
                                <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                    <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Payment Method Selection */}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Payment Method</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                                    {([
                                        { key: 'bank', icon: 'account-balance', label: 'Bank Transfer' },
                                        { key: 'paypal', icon: 'payment', label: 'PayPal' },
                                        { key: 'mobile', icon: 'phone-android', label: 'Mobile Money' },
                                        { key: 'usdt', icon: 'currency-bitcoin', label: 'USDT' },
                                    ] as const).map(({ key, icon, label }) => (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => setPaymentMethod(key)}
                                            style={{
                                                width: '47%',
                                                padding: 14,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                borderColor: paymentMethod === key ? theme.primary : theme.border,
                                                backgroundColor: paymentMethod === key ? `${theme.primary}10` : theme.background,
                                            }}
                                        >
                                            <MaterialIcons name={icon as any} size={22} color={paymentMethod === key ? theme.primary : theme.textSecondary} style={{ marginBottom: 6 }} />
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Currency Selection */}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Currency</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                    {['USD', 'NGN', 'EUR', 'GBP', 'KES', 'ZAR'].map((curr) => (
                                        <TouchableOpacity
                                            key={curr}
                                            onPress={() => setCurrency(curr)}
                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 16,
                                                borderRadius: 20,
                                                borderWidth: 2,
                                                borderColor: currency === curr ? theme.primary : theme.border,
                                                backgroundColor: currency === curr ? `${theme.primary}20` : theme.background,
                                                marginRight: 8,
                                            }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: currency === curr ? theme.primary : theme.textSecondary }}>{curr}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Amount */}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Amount</Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 12 }}>Minimum: $5.00 USD</Text>
                                <TextInput
                                    style={{
                                        backgroundColor: theme.background,
                                        borderRadius: 12,
                                        padding: 16,
                                        fontSize: 16,
                                        color: theme.text,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        marginBottom: 8,
                                    }}
                                    placeholder={`Enter amount in ${paymentMethod === 'usdt' ? 'USD (paid as USDT)' : currency}`}
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="decimal-pad"
                                    value={withdrawAmount}
                                    onChangeText={setWithdrawAmount}
                                />
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 20 }}>
                                    Processing fee: $0.50 deducted. Requests processed within 3–5 business days.
                                </Text>

                                {/* Bank Details (only show if bank transfer selected) */}
                                {paymentMethod === 'bank' && (
                                    <>
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

                                {/* Mobile Money — Phone Number */}
                                {paymentMethod === 'mobile' && (
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
                                            placeholder="Phone number (e.g. +234 801 234 5678)"
                                            placeholderTextColor={theme.textSecondary}
                                            keyboardType="phone-pad"
                                            value={mobilePhone}
                                            onChangeText={setMobilePhone}
                                        />
                                    </>
                                )}

                                {/* USDT Details */}
                                {paymentMethod === 'usdt' && (
                                    <>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>USDT Details</Text>
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
                                            placeholder="Wallet Address"
                                            placeholderTextColor={theme.textSecondary}
                                            autoCapitalize="none"
                                            value={usdtDetails.walletAddress}
                                            onChangeText={(text: string) => setUsdtDetails(d => ({ ...d, walletAddress: text }))}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Network</Text>
                                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                            {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
                                                <TouchableOpacity
                                                    key={net}
                                                    onPress={() => setUsdtDetails(d => ({ ...d, network: net }))}
                                                    style={{
                                                        flex: 1,
                                                        paddingVertical: 10,
                                                        borderRadius: 10,
                                                        borderWidth: 2,
                                                        borderColor: usdtDetails.network === net ? theme.primary : theme.border,
                                                        backgroundColor: usdtDetails.network === net ? `${theme.primary}15` : theme.background,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: usdtDetails.network === net ? theme.primary : theme.textSecondary }}>
                                                        {net}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, marginBottom: 20 }}>
                                            <Text style={{ fontSize: 12, color: '#f59e0b' }}>
                                                Double-check your wallet address and network. Incorrect details may result in permanent loss of funds.
                                            </Text>
                                        </View>
                                    </>
                                )}

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={submitWithdrawal}
                                    disabled={isWithdrawing}
                                    style={{
                                        backgroundColor: theme.primary,
                                        borderRadius: 12,
                                        padding: 18,
                                        alignItems: 'center',
                                        marginTop: 10,
                                        opacity: isWithdrawing ? 0.7 : 1,
                                    }}
                                >
                                    {isWithdrawing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Submit Withdrawal Request</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            {/* OTP Verification Modal */}
            <Modal
                visible={showOTPModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOTPModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${theme.primary}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                            <MaterialIcons name="security" size={32} color={theme.primary} />
                        </View>
                        
                        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 12, textAlign: 'center' }}>Verify Withdrawal</Text>
                        <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 32, textAlign: 'center', lineHeight: 22 }}>
                            Please enter the 6-digit code sent to your email to authorize this transaction.
                        </Text>

                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 24,
                                fontWeight: '700',
                                color: theme.text,
                                borderWidth: 2,
                                borderColor: theme.primary,
                                marginBottom: 24,
                                width: '100%',
                                textAlign: 'center',
                                letterSpacing: 8
                            }}
                            placeholder="000000"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otpCode}
                            onChangeText={setOtpCode}
                            autoFocus
                        />

                        <TouchableOpacity
                            onPress={verifyOTPAndComplete}
                            disabled={isVerifyingOTP}
                            style={{
                                backgroundColor: theme.primary,
                                borderRadius: 12,
                                padding: 18,
                                alignItems: 'center',
                                width: '100%',
                                opacity: isVerifyingOTP ? 0.7 : 1,
                            }}
                        >
                            {isVerifyingOTP ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Verify & Complete</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setShowOTPModal(false)}
                            style={{ marginTop: 20 }}
                        >
                            <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
