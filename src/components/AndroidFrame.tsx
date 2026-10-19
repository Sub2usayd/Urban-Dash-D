import React from 'react';
import { Smartphone, Monitor, Cpu, Sparkles } from 'lucide-react';

interface AndroidFrameProps {
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  fps: number;
  triCount: number;
  drawCalls: number;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  isPhoneFrame,
  onTogglePhoneFrame,
  fps,
  triCount,
  drawCalls,
  children,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">

      {isPhoneFrame ? (
        /* Simulated Android Mobile Device Chassis (19.5:9 Aspect Ratio) */
        <div className="relative w-full max-w-[420px] h-[860px] max-h-[92vh] bg-slate-900 border-[10px] border-slate-800 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ring-1 ring-white/10 my-auto">
          {/* Punch-hole camera notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-40 border border-slate-800" />

          {/* Android Speaker Grill */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-700 rounded-full z-40" />

          {/* Screen Display Area */}
          <div className="relative w-full h-full overflow-hidden bg-slate-950">
            {children}
          </div>

          {/* Android Gesture Bar at bottom */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-40 pointer-events-none" />
        </div>
      ) : (
        /* Full Viewport Canvas */
        <div className="relative w-full h-full overflow-hidden bg-slate-950">{children}</div>
      )}
    </div>
  );
};
