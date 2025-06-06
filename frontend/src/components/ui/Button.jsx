import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

const PrimaryButton = ({
  children,
  onClick,
  className = "cursor-pointer",
  disabled = false,
  ...props
}) => {
  return (
    <motion.button
      className={`bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 px-8 py-4 rounded-full text-xl font-bold shadow-xl border border-navratri-orange/20 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={!disabled ? {
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(255,165,0,0.3)",
        y: -2,
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={!disabled ? {
        boxShadow: [
          "0 10px 30px rgba(255,165,0,0.2)",
          "0 15px 35px rgba(255,215,0,0.25)",
          "0 10px 30px rgba(255,165,0,0.2)",
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      onClick={onClick}
      disabled={disabled}
      {...props}>
      {children}
    </motion.button>
  );
};

const GoogleSignInButton = ({ 
  children = "Sign In with Google",
  className = "",
  variant = "primary",
  onClick,
  disabled = false,
  ...props
}) => {
  const { signInWithGoogle, loading, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // If there's a custom onClick, use that instead
    if (onClick) {
      try {
        setIsSigningIn(true);
        setLocalError(null);
        await onClick();
      } catch (error) {
        console.error('Custom onClick failed:', error);
        setLocalError(error.message || 'Sign-in failed. Please try again.');
      } finally {
        setIsSigningIn(false);
      }
      return;
    }

    // Default Google Sign-In behavior
    try {
      setIsSigningIn(true);
      setLocalError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in failed:', error);
      
      // Handle specific error cases
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please wait a moment and try again.';
      }
      
      setLocalError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const baseClasses = "flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 shadow-md hover:shadow-lg",
    secondary: "bg-slate-800/50 backdrop-blur-xl text-white border border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/50"
  };

  const isDisabled = disabled || loading || isSigningIn;
  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        className={`${baseClasses} ${variants[variant]} ${className}`}
        onClick={handleSignIn}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        {...props}
      >
        {isSigningIn ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            {/* Google Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{children}</span>
          </>
        )}
      </motion.button>
      
      {/* Error Message Display */}
      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-red-400 text-sm text-center max-w-xs px-2"
        >
          {displayError}
        </motion.div>
      )}
    </div>
  );
};

export { PrimaryButton, GoogleSignInButton };