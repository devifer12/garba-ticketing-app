import React from "react";
import { motion } from "framer-motion";
import { logError } from "../../utils/errorTracking";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to error tracking service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center bg-slate-900 p-4"
        >
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/30">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-slate-400">
                We're working on fixing this issue.
              </p>
              {process.env.NODE_ENV === "development" && (
                <pre className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left text-xs text-red-400 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-navratri-orange/20 hover:bg-navratri-orange/30 text-navratri-orange font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;