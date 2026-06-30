import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useUser, SignIn, SignUp, isValidCompanyEmail } from '../context/ClerkProvider';
import { ArrowLeft, Lock, Building2 } from 'lucide-react';

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const intent = searchParams.get('intent');
    const { user, isLoaded } = useUser();

    // Now only used for Admin Console
    const getRedirectPath = () => {
        return '/admin/dashboard';
    };

    // Check if user is already signed in and redirect appropriately
    useEffect(() => {
        if (isLoaded && user) {
            // Always redirect authenticated users to their dashboard
            // Role-based access is handled by the protected route components
            navigate(getRedirectPath(), { replace: true });
        }
    }, [user, isLoaded, navigate, intent]);

    // If not loaded yet, show loading
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // If user is already signed in, redirect them (handled in useEffect above)
    // This prevents showing the auth form to already authenticated users
    if (user) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Fixed styling for Admin Terminal (Orange theme)
    const themeColor = 'orange';
    const themeBg = 'bg-orange-600';
    const themeBorder = 'border-orange-500/50';
    const themeRing = 'ring-orange-500/10';
    const themeShadow = 'shadow-orange-900/20';

    return (
        <div className="min-h-screen bg-[#020617] selection:bg-blue-500/30 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Minimal Background */}
            <div className="absolute inset-0 -z-10 bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08)_0%,_transparent_70%)] md:bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.12)_0%,_transparent_60%)]"></div>
            </div>

            <div className="w-full max-w-[400px] relative z-10">
                {/* Minimal Header */}
                <div className="text-center mb-10 md:mb-12 animate-[fadeIn_0.3s_ease-out]">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 outfit tracking-tight">
                        Admin Terminal
                    </h2>
                    <p className="text-slate-500 text-sm font-medium opacity-80">
                        Authorized personnel only.
                    </p>
                </div>

                {/* Floating Auth Container */}
                <div className="animate-[slideInUp_0.4s_ease-out_0.1s_forwards] opacity-0 flex justify-center w-full" style={{ animationFillMode: 'forwards' }}>
                    <div className="w-full">
                        <SignIn
                            forceRedirectUrl={getRedirectPath()}
                            signUpForceRedirectUrl={getRedirectPath()}
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'bg-transparent shadow-none p-4 md:p-6 w-full mx-auto',
                                    header: 'hidden',
                                    headerTitle: 'hidden',
                                    headerSubtitle: 'hidden',
                                    socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 h-14 rounded-2xl transition-all',
                                    socialButtonsBlockButtonText: 'text-white font-bold text-base',
                                    dividerLine: 'bg-white/10',
                                    dividerText: 'text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]',
                                    formFieldLabel: 'text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1',
                                    formFieldInput: `bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-700 h-14 rounded-2xl focus:${themeBorder} focus:border-white/30 transition-all text-base px-6 font-bold`,
                                    formButtonPrimary: `${themeBg} hover:opacity-90 h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl ${themeShadow} active:scale-95`,
                                    footerActionLink: `text-${themeColor}-500 hover:text-${themeColor}-400 font-black transition-colors`,
                                    footerAction: 'text-slate-500 text-xs py-6 flex justify-center',
                                    footer: 'bg-transparent',
                                    identityPreviewText: 'text-white font-bold',
                                    identityPreviewEditButton: `text-${themeColor}-500`,
                                    formResendCodeLink: `text-${themeColor}-500`,
                                    otpCodeFieldInput: 'bg-white/[0.05] border-white/10 text-white rounded-xl font-bold font-mono'
                                },
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalFields: false
                                }
                            }}
                            routing="hash"
                        />
                    </div>
                </div>

                {/* Center-aligned Footer Links */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-2 animate-[fadeIn_0.4s_ease-out_0.2s_forwards] opacity-0">
                    <Link to="/" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 order-2 sm:order-1">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                    <div className="flex gap-6 order-1 sm:order-2">
                        <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Support</a>
                        <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Privacy</a>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .heading-font {
                    font-family: 'Space Grotesk', sans-serif;
                }
                /* Clerk Overrides to remove dev mode banners and card backgrounds */
                .cl-internal-ph72j9, .cl-internal-1dauvpw {
                    display: none !important;
                }
                .cl-card, .cl-rootBox {
                    background: transparent !important;
                }
                .cl-footer {
                    background: transparent !important;
                    background-image: none !important;
                    border: none !important;
                }
                .cl-socialButtonsBlockButton {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                .cl-formFieldInput {
                    font-weight: 700 !important;
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
