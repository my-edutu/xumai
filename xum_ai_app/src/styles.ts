import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from './context/ThemeContext';
import { SPACING, TYPOGRAPHY, LAYOUT, SHADOWS } from './constants/designTokens';

export const createGlobalStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    flex1: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        padding: SPACING.lg, // 24px
        paddingBottom: 120,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? 24 : 12, // Matched with HomeScreen padding
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        minHeight: LAYOUT.headerHeight,
        backgroundColor: theme.background,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg, // 16px
        fontWeight: '700',
        fontFamily: TYPOGRAPHY.fonts.display,
        color: theme.text,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    // Section
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.xs, // 10px -> 11px? Let's use xs (10) or sm (12). Original was 13. Let's use sm.
        fontWeight: '700',
        color: theme.textSecondary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: SPACING.md,
        marginTop: SPACING.lg,
    },
    // Mission Card
    missionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: LAYOUT.radius.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: theme.border,
        minHeight: 80,
    },
    missionIconBox: {
        width: LAYOUT.iconButton, // 48px
        height: LAYOUT.iconButton,
        borderRadius: LAYOUT.radius.md,
        backgroundColor: theme.surfaceHighlight, // was rgba...
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    missionInfo: {
        flex: 1,
    },
    missionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: theme.text,
        marginBottom: SPACING.xs,
        letterSpacing: 0.3,
    },
    missionTime: {
        fontSize: TYPOGRAPHY.size.sm,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    missionReward: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '800',
        color: theme.primary,
        marginLeft: SPACING.sm,
    },
    // Judge Card
    judgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: LAYOUT.radius.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: theme.border,
        minHeight: 80,
    },
    judgeIconBox: {
        width: LAYOUT.iconButton, // 48px
        height: LAYOUT.iconButton,
        borderRadius: LAYOUT.radius.md,
        backgroundColor: theme.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    judgeInfo: {
        flex: 1,
    },
    judgeTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: theme.text,
        marginBottom: SPACING.xs,
        letterSpacing: 0.2,
    },
    judgeSubtitle: {
        fontSize: TYPOGRAPHY.size.sm, // 12px
        color: theme.textSecondary,
        fontWeight: '500',
    },
    judgeReward: {
        alignItems: 'flex-end',
        marginLeft: SPACING.md,
    },
    judgeRewardValue: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
        color: theme.primary,
        marginBottom: SPACING.xs,
    },
});

export const createCaptureStyles = (theme: ThemeColors) => StyleSheet.create({
    heroTitle: {
        fontSize: TYPOGRAPHY.size.display, // 32px
        fontWeight: '700',
        color: theme.text,
        lineHeight: 40,
        marginBottom: SPACING.sm,
    },
    heroSubtitle: {
        fontSize: TYPOGRAPHY.size.lg, // 16px
        color: theme.textSecondary,
        lineHeight: 24,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.surface,
        borderRadius: LAYOUT.radius.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
        gap: SPACING.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: LAYOUT.radius.xl, // 24px
        padding: SPACING.lg, // 24px
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: theme.border,
    },
    optionIconBox: {
        width: 64, // Custom large size
        height: 64,
        borderRadius: LAYOUT.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: TYPOGRAPHY.size.xl, // 20px
        fontWeight: '700',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    optionSubtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: theme.textSecondary,
        marginBottom: SPACING.xs,
    },
    optionReward: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: theme.success,
    },
    promptCard: {
        backgroundColor: theme.surface,
        borderRadius: LAYOUT.radius.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    promptBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: LAYOUT.radius.sm,
        marginBottom: SPACING.md,
    },
    promptBadgeText: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    promptText: {
        fontSize: TYPOGRAPHY.size.xxl, // 24px
        fontWeight: '600',
        color: theme.text,
        lineHeight: TYPOGRAPHY.lineHeight.xxl,
        marginBottom: SPACING.md,
    },
    promptHint: {
        fontSize: TYPOGRAPHY.size.sm,
        color: theme.textSecondary,
    },
    recordButton: {
        width: 100, // Custom oversized
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
    },
    translationInput: {
        borderRadius: LAYOUT.radius.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        minHeight: 120, // Taller
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceHighlight, // Input background
        color: theme.text,
    },
    submitButton: {
        borderRadius: LAYOUT.radius.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
        backgroundColor: theme.primary,
        height: LAYOUT.buttonHeight,
        justifyContent: 'center',
    },
    rewardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: LAYOUT.radius.lg,
        padding: SPACING.lg,
        marginTop: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)', // Success hint
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
});

export const createWalletStyles = (theme: ThemeColors) => StyleSheet.create({
    balanceCardRedesign: {
        alignItems: 'center',
        paddingVertical: 20, // More breathing room
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
    },
    balanceLabelRedesign: {
        fontSize: TYPOGRAPHY.size.sm, // 14px
        fontWeight: '600',
        color: theme.textSecondary,
        letterSpacing: 2,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    balanceValueRedesign: {
        fontSize: 64, // Very large, minimalist
        fontWeight: '800',
        color: theme.text, // Use main text color, not inverse
        letterSpacing: -1,
        marginBottom: SPACING.xl,
    },
    balanceActionsRedesign: {
        flexDirection: 'row',
        gap: SPACING.xl, // Wider gap for cleaner look
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: SPACING.xl,
    },
    // Floating circular action buttons
    actionButtonContainer: {
        alignItems: 'center',
        gap: 8,
    },
    withdrawButtonRedesign: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.text, // High contrast
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    withdrawTextRedesign: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: '700',
        color: theme.text,
        textTransform: 'uppercase',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    addFundsButtonRedesign: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardIconRedesign: {
        display: 'none', // Remove the large background icon
    },
    historyTitleRedesign: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
        color: theme.text,
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.sm, // Align with list items if list has no padding
    },
    historyItemRedesign: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: 'transparent', // Clean list, no card
    },
    historyIconBoxRedesign: {
        width: 48,
        height: 48,
        borderRadius: 24, // Circle
        backgroundColor: theme.surface, // Subtle background
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    historyInfoRedesign: {
        flex: 1,
    },
    historyTitleTextRedesign: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    historyDateRedesign: {
        fontSize: TYPOGRAPHY.size.xs,
        color: theme.textSecondary,
    },
    historyAmountRedesign: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
    },
});

export const createModalStyles = (theme: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.overlay,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.background,
        borderTopLeftRadius: LAYOUT.radius.xxl,
        borderTopRightRadius: LAYOUT.radius.xxl,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
        ...SHADOWS.lg,
    },
    dragHandle: {
        width: 48,
        height: 5,
        backgroundColor: theme.border,
        borderRadius: 3,
        alignSelf: 'center',
        marginVertical: SPACING.md,
    },
    header: {
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size.xxl,
        fontWeight: '700',
        color: theme.text,
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '500',
        color: theme.textSecondary,
    },
});

export const createSettingsStyles = (theme: ThemeColors) => StyleSheet.create({
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: '900',
        color: theme.primary,
        letterSpacing: 1.5,
        marginBottom: SPACING.md,
        marginLeft: SPACING.xs,
        textTransform: 'uppercase',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: LAYOUT.radius.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        minHeight: 64, // Good touch target
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconBox: {
        width: 40, // Close to 44
        height: 40,
        borderRadius: LAYOUT.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surfaceHighlight,
    },
    itemLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: theme.text,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    itemValue: {
        fontSize: TYPOGRAPHY.size.sm,
        color: theme.textSecondary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: LAYOUT.radius.lg,
        borderWidth: 1,
        borderColor: theme.error,
        marginTop: SPACING.md,
        gap: SPACING.sm,
        height: LAYOUT.buttonHeight,
    },
    logoutText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: theme.error,
    },
    footerText: {
        textAlign: 'center',
        fontSize: TYPOGRAPHY.size.xs,
        color: theme.textTertiary,
        marginTop: SPACING.xl,
        marginBottom: SPACING.xxl,
    },
});
