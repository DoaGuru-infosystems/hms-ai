import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Sparkles, Lock, Eye, EyeOff, AtSign, CornerDownRight, 
  AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { superAdminAuth } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [shake, setShake] = useState(false);
  const [isTypingDemo, setIsTypingDemo] = useState(false);

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, touchedFields }
  } = useForm({
    defaultValues: { email: '', password: '' },
    mode: 'onChange'
  });

  const emailValue = watch('email');
  const isEmailValid = !errors.email && emailValue?.length > 0;
  const isEmailInvalid = !!errors.email && (touchedFields.email || isTypingDemo);

  const onSubmit = async (formData) => {
    setApiError('');
    setLoading(true);

    try {
      const response = await superAdminAuth.login(formData.email, formData.password);
      const data = response.data;

      // Save token and user details to localStorage
      localStorage.setItem('superAdminToken', data.token);
      localStorage.setItem('superAdminUser', JSON.stringify({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      }));

      if (onLoginSuccess) {
        onLoginSuccess(data.token, data);
      }
    } catch (err) {
      console.error('Super Admin Login Error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Server error. Please check backend connection.';
      setApiError(errorMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    triggerShake();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Ultra-smooth letter-by-letter typing animation integrated with React Hook Form
  const handleFillDemo = () => {
    if (isTypingDemo || loading) return;
    setIsTypingDemo(true);
    setApiError('');
    clearErrors();
    setValue('email', '', { shouldValidate: true });
    setValue('password', '', { shouldValidate: true });

    const demoEmail = 'superadmin@hms.com';
    const demoPass = 'superadmin';

    let i = 0;
    const emailInterval = setInterval(() => {
      if (i < demoEmail.length) {
        setValue('email', demoEmail.slice(0, i + 1), { shouldValidate: true, shouldTouch: true });
        i++;
      } else {
        clearInterval(emailInterval);
        setTimeout(() => {
          let j = 0;
          const passInterval = setInterval(() => {
            if (j < demoPass.length) {
              setValue('password', demoPass.slice(0, j + 1), { shouldValidate: true, shouldTouch: true });
              j++;
            } else {
              clearInterval(passInterval);
              setIsTypingDemo(false);
            }
          }, 20);
        }, 120);
      }
    }, 22);
  };

  return (
    <div className="glass-login-bg">
      {/* Soft Blurred Healthcare Mesh Circles */}
      <div className="mesh-circle circle-1" />
      <div className="mesh-circle circle-2" />
      <div className="mesh-circle circle-3" />

      <div className="glass-card-container">
        <div className={`frosted-glass-card ${shake ? 'shake-error' : ''}`}>
          {/* Subtle Top-Right Ambient Glow Spot */}
          <div className="glass-card-glow" />

          {/* Top Bar: Brand & Demo Pill */}
          <div className="glass-card-top-bar">
            <div className="glass-brand-name">
              <Sparkles size={18} className="brand-icon-sparkle" />
              <span>HMS Super Admin</span>
            </div>
            <button 
              type="button" 
              onClick={handleFillDemo} 
              disabled={isTypingDemo}
              className={`glass-pill-demo-btn ${isTypingDemo ? 'typing' : ''}`}
              title="Click for letter-by-letter auto fill"
            >
              {isTypingDemo ? 'Typing...' : 'Demo Fill'}
            </button>
          </div>

          {/* Title */}
          <h1 className="glass-login-title">Log in</h1>

          {/* API Error Alert if any */}
          {apiError && (
            <div className="glass-error-badge animate-fade-in">
              <AlertCircle size={15} />
              <span>{apiError}</span>
            </div>
          )}

          {/* Login Form using React Hook Form */}
          <form onSubmit={handleSubmit(onSubmit, onError)} className="glass-login-form" noValidate>
            
            {/* Email Field with React Hook Form Registration */}
            <div className="glass-input-group">
              <div className={`glass-pill-input-wrapper ${isEmailInvalid ? 'input-invalid' : ''} ${isEmailValid ? 'input-valid' : ''}`}>
                <div className="pill-icon-circle">
                  <AtSign size={16} className="input-icon-svg" />
                </div>
                <input
                  type="email"
                  placeholder="Enter email address"
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address format'
                    }
                  })}
                  onChange={(e) => {
                    register('email').onChange(e);
                    if (apiError) setApiError('');
                  }}
                />
                {isEmailValid && (
                  <CheckCircle2 size={16} className="valid-check-icon" />
                )}
              </div>
              {errors.email && (
                <span className="field-error-subtext">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field with React Hook Form Registration */}
            <div className="glass-input-group">
              <div className={`glass-pill-input-wrapper ${errors.password && touchedFields.password ? 'input-invalid' : ''}`}>
                <div className="pill-icon-circle">
                  <Lock size={16} className="input-icon-svg" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  {...register('password', {
                    required: 'Password is required'
                  })}
                  onChange={(e) => {
                    register('password').onChange(e);
                    if (apiError) setApiError('');
                  }}
                />
                <button
                  type="button"
                  className={`glass-eye-toggle-btn ${showPassword ? 'active' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error-subtext">{errors.password.message}</span>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-pass-row">
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="glass-forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Bottom Row: Disclaimer Text + Floating Action Button */}
            <div className="glass-card-bottom-row">
              <p className="glass-disclaimer-text">
                Restricted Access — Authorized Personnel Only. This portal is for verified Super Admins to manage hospital subscriptions and platform operations.
              </p>

              {/* Floating Dark Circular Submit Button */}
              <button
                type="submit"
                className={`glass-floating-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading || isTypingDemo}
                title="Log in to Super Admin Portal"
              >
                {loading ? (
                  <Loader2 size={24} className="submit-spinner-icon" />
                ) : (
                  <CornerDownRight size={22} className="submit-arrow-icon" />
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
