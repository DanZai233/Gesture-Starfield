import { useState, useEffect } from 'react';
import { Camera, CameraOff, Hand, Loader2, Maximize2 } from 'lucide-react';
import StarfieldCanvas from './StarfieldCanvas';
import { useHandTracking } from './hooks/useHandTracking';

export default function App() {
  const [started, setStarted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const { videoRef, isInitializing, error, handState } = useHandTracking(started);

  if (!started) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-200 p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 mb-4">
            <Hand className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Gesture Starfield</h1>
          <p className="text-neutral-400 text-lg">
            Control a 3D warp speed starfield using just your hands. 
            Open your palm to accelerate, pinch your fingers to slow down, and move your hand to steer.
          </p>
          
          <div className="bg-neutral-900 rounded-xl p-4 text-sm text-neutral-400 border border-neutral-800 text-left">
            <p className="flex items-center gap-2 font-medium text-neutral-300 mb-2">
              <Camera className="w-4 h-4" /> Camera Access Required
            </p>
            <p>This experience processes video locally directly in your browser. No video data is uploaded.</p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            Start Experience
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Canvas Effect */}
      <StarfieldCanvas handState={handState} />

      {/* Floating UI */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        
        {/* Status Indicators */}
        <div className="space-y-2 pointer-events-auto">
          {error ? (
            <div className="flex items-center gap-2 bg-red-950/80 text-red-400 px-4 py-2 rounded-full backdrop-blur-sm border border-red-900/50 text-sm">
              <CameraOff className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : isInitializing ? (
            <div className="flex items-center gap-2 bg-neutral-900/80 text-neutral-300 px-4 py-2 rounded-full backdrop-blur-sm border border-neutral-800 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading AI Models...</span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border text-sm transition-colors duration-300 ${handState.active ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30' : 'bg-neutral-900/80 text-neutral-400 border-neutral-800'}`}>
              <Hand className={`w-4 h-4 ${handState.active ? 'opacity-100' : 'opacity-40'}`} />
              <span>{handState.active ? 'Hand Detected' : 'Show Your Hand'}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="p-3 rounded-full bg-neutral-900/60 hover:bg-neutral-800/80 backdrop-blur-sm border border-neutral-800 transition-colors"
            title="Toggle Camera View"
          >
            {showVideo ? <Camera className="w-5 h-5 text-neutral-300" /> : <CameraOff className="w-5 h-5 text-neutral-500" />}
          </button>
        </div>
      </div>

      {/* Speed Gauge / Info */}
      <div className="absolute bottom-10 left-10 pointer-events-none">
        {handState.active && (
          <div className="flex flex-col gap-2">
             <div className="text-xs uppercase tracking-widest text-indigo-400/80 font-mono">Warp Drive</div>
             <div className="flex items-end gap-2">
                <div className="text-6xl font-bold tracking-tighter text-white/90 font-mono tabular-nums">
                   {Math.round((handState.pinchDistance / 0.4) * 100)}%
                </div>
             </div>
             {/* Speed bar */}
             <div className="h-1 w-48 bg-neutral-900 rounded-full overflow-hidden mt-1">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-75"
                 style={{ width: `${Math.min(100, (handState.pinchDistance / 0.4) * 100)}%` }}
               />
             </div>
          </div>
        )}
      </div>

      {/* Picture-in-picture video feed */}
      <div className={`absolute bottom-6 right-6 w-48 aspect-[4/3] rounded-xl overflow-hidden border-2 border-neutral-800 shadow-2xl transition-all duration-300 ${showVideo && !error ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />
        {/* Hand Overlay on video */}
        {handState.active && (
          <div 
            className="absolute w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{
              left: `${handState.x * 100}%`,
              top: `${handState.y * 100}%`
            }}
          />
        )}
      </div>

    </div>
  );
}
