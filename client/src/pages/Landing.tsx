import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            VizChat
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your data visualizations and get AI-powered insights with Data Vizard
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-upload text-blue-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Upload Charts</h3>
              <p className="text-gray-600 text-sm">Upload single or multiple data visualizations</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-green-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">Get comprehensive insights and analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-purple-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Chat Interface</h3>
              <p className="text-gray-600 text-sm">Ask questions about your data</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/login'} 
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}