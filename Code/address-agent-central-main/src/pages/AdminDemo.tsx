import { ArrowLeft, TestTube, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { AAVAPanel } from '@/components/admin/AAVAPanel';

export default function AdminDemo() {
  return (
    <>
      <SEOHead 
        title="Admin Demo - AAVA Verification"
        description="AAVA Field Agent verification panel"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/admin/aip-portal">
                  <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to AIP Portal
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">AAVA Field Agent Portal</h1>
                  <p className="text-slate-400">
                    Address verification with photo + geolocation validation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <h3 className="font-semibold text-orange-400 mb-2">
              AAVA Verification Process:
            </h3>
            <ol className="text-sm text-orange-300/80 space-y-1 list-decimal list-inside">
              <li><strong>Upload Photo:</strong> Take a picture of the location with geotag metadata</li>
              <li><strong>Capture Location:</strong> Allow browser to access your current GPS coordinates</li>
              <li><strong>Distance Check:</strong> Your location must be within 100 meters of the address</li>
              <li><strong>Verify:</strong> If all checks pass, the address is verified as L3</li>
            </ol>
          </div>

          {/* AAVA Panel */}
          <AAVAPanel />
          
          {/* Terminal Info */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-slate-400">
              <span className="text-green-400 font-mono">TIP:</span> Watch the terminal for colored activity logs showing verification status and token generation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
