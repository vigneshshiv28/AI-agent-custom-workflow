'use client';

import { Logo } from '@/components/logo';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/lib/auth/auth-service';
import { Toaster, toast } from 'sonner';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const onGoogleSubmit = async () => {
        try {
            const res = await authService.signUp({
                provider: 'google',
                callbackURL: '/dashboard',
            });
            if (res?.error) {
                toast.error(res.error.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Google sign up failed');
        }
    };

    const onSubmit = async (data: SignupFormValues) => {
        try {
            const res = await authService.signUp({
                provider: 'email',
                data: {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                },
                callbackURL: '/dashboard',
            });
            if (res?.error) {
                toast.error(res.error.message);
            } else {
                toast.success('Account created!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Email sign up failed');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black overflow-hidden relative">
            <Toaster
                position="bottom-right"
                toastOptions={{
                    classNames: {
                        toast: "!bg-black !border !border-white/10 !shadow-2xl !text-white data-[type=error]:!text-red-500 data-[type=success]:!text-green-500 data-[type=warning]:!text-yellow-500 data-[type=info]:!text-blue-500",
                        description: "!text-neutral-400",
                        actionButton: "!bg-white !text-black",
                        cancelButton: "!bg-neutral-800 !text-white",
                    },
                }}

            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="flex justify-center mb-8 relative z-10">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm">
                            <Logo />
                        </div>
                    </div>

                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create account</h1>
                        <p className="text-neutral-400 text-sm">Get started with AgentFlow</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGoogleSubmit}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-medium py-3.5 px-4 rounded-xl mb-6 transition-all hover:border-white/20 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </motion.button>

                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
                        <span className="text-neutral-500 text-xs uppercase tracking-wider font-medium">Or</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-xs font-medium text-neutral-400 ml-1">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                {...register('name')}
                                className="w-full bg-neutral-900/50 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-neutral-600 hover:bg-neutral-900/70"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs ml-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-xs font-medium text-neutral-400 ml-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register('email')}
                                className="w-full bg-neutral-900/50 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-neutral-600 hover:bg-neutral-900/70"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-xs font-medium text-neutral-400 ml-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                className="w-full bg-neutral-900/50 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-neutral-600 hover:bg-neutral-900/70"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-black font-bold py-3.5 px-4 rounded-xl transition-all hover:shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)] shadow-lg mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            Sign Up
                            {isSubmitting && (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            )}
                        </motion.button>
                    </form>

                    <p className="text-center text-neutral-400 text-sm mt-8 relative z-10">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline decoration-primary/30 underline-offset-4">
                            Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
