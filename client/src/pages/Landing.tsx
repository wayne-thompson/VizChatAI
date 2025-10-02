import { Button } from '@/components/ui/button';
import { Check, BarChart3, MessageSquare, Zap, Shield, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import logoPath from '@assets/ChatGPT Image Jun 25, 2025, 01_15_34 AM_1750828545033.png';

export default function Landing() {
  const [location] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user just completed authentication (coming from auth callback)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('authenticated') === 'true') {
      setShowWelcome(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
      // Auto-hide welcome message after 5 seconds
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Welcome Message for Authenticated Users */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50 py-3 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Welcome back! You're now logged in. 
                    <Button 
                      variant="link" 
                      className="text-green-800 underline p-0 ml-1 h-auto font-semibold"
                      onClick={() => window.location.reload()}
                    >
                      Refresh to access your dashboard
                    </Button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <i className="fas fa-chart-line text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">VizChat</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-blue-600 font-medium"
                onClick={() => window.location.href = '/api/login'}
              >
                Log In
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <i className="fas fa-sparkles mr-2"></i>
              AI-Powered Data Analysis
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Transform Your Data
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Into Insights</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Upload your charts and visualizations to get AI-powered analysis and insights. 
              Chat with your data using our intelligent assistant.
            </p>
            {showWelcome && (
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto shadow-xl">
                <p className="text-blue-800 font-semibold text-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  You're successfully logged in!
                </p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                  onClick={() => window.location.reload()}
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  Access Dashboard Now
                </Button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 px-10 py-6 text-lg font-semibold"
                onClick={() => window.location.href = '/api/login'}
              >
                <i className="fas fa-rocket mr-2"></i>
                Start Analyzing Now
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-6 flex items-center justify-center gap-4">
              <span className="flex items-center">
                <i className="fas fa-check text-green-500 mr-1"></i>
                Free trial
              </span>
              <span className="flex items-center">
                <i className="fas fa-check text-green-500 mr-1"></i>
                No credit card required
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
              <i className="fas fa-star mr-2"></i>
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Powerful Features for Data Analysis
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to understand your data visualizations and make better decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Chart Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Upload any chart or visualization and get instant AI-powered insights about trends, patterns, and key findings.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Interactive Chat</h3>
              <p className="text-slate-600 leading-relaxed">
                Ask questions about your data in natural language and get detailed explanations from our AI assistant.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Chart Projects</h3>
              <p className="text-slate-600 leading-relaxed">
                Upload multiple visualizations together to get comprehensive business insights and cross-chart analysis.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-all duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Results</h3>
              <p className="text-slate-600 leading-relaxed">
                Get analysis results in seconds, not hours. Our AI processes your visualizations immediately upon upload.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Private</h3>
              <p className="text-slate-600 leading-relaxed">
                Your data is processed securely and never stored permanently. We prioritize your privacy and data security.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Export & Share</h3>
              <p className="text-slate-600 leading-relaxed">
                Save your analysis reports and share insights with your team through secure shareable links.
              </p>
            </div>
          </div>
        </div>
      </section>





      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src={logoPath} 
                  alt="VizChat Logo" 
                  className="h-8 w-8 object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                <span className="ml-2 text-xl font-bold">VizChat</span>
              </div>
              <p className="text-gray-400">
                Transform your data visualizations into actionable insights with AI-powered analysis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VizChat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}