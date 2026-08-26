/** Return true only for a complete six-digit numeric OTP. */
export function isValidOtp(value: string): boolean {
    return /^\d{6}$/.test(value);
}
