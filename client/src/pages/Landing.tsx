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
    <div className="min-h-screen bg-white">
      {/* Welcome Message for Authenticated Users */}
      {showWelcome && (
        <div className="bg-green-50 border-b border-green-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Welcome back! You're now logged in. 
                    <Button 
                      variant="link" 
                      className="text-green-700 underline p-0 ml-1 h-auto"
                      onClick={() => window.location.reload()}
                    >
                      Refresh to access your dashboard
                    </Button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-400 hover:text-green-500"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={logoPath} 
                alt="VizChat Logo" 
                className="h-8 w-8 object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <span className="ml-2 text-xl font-bold text-gray-900">VizChat</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = '/api/login'}>
                Log In
              </Button>
              <Button onClick={() => window.location.href = '/api/login'}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Data
              <span className="text-blue-600 block">Into Insights</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload your charts and visualizations to get AI-powered analysis and insights. 
              Chat with your data using our intelligent assistant powered by GPT-4 Vision.
            </p>
            {showWelcome && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium">
                  🎉 You're successfully logged in! The page should automatically update to show your dashboard.
                </p>
                <Button 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.reload()}
                >
                  Access Dashboard Now
                </Button>
              </div>
            )}
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Analyzing Now
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Free trial • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Data Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to understand your data visualizations and make better decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Chart Analysis</h3>
              <p className="text-gray-600">
                Upload any chart or visualization and get instant AI-powered insights about trends, patterns, and key findings.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Chat</h3>
              <p className="text-gray-600">
                Ask questions about your data in natural language and get detailed explanations from our AI assistant.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Chart Projects</h3>
              <p className="text-gray-600">
                Upload multiple visualizations together to get comprehensive business insights and cross-chart analysis.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Results</h3>
              <p className="text-gray-600">
                Get analysis results in seconds, not hours. Our AI processes your visualizations immediately upon upload.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is processed securely and never stored permanently. We prioritize your privacy and data security.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Export & Share</h3>
              <p className="text-gray-600">
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