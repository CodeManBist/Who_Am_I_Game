import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useState } from 'react';

export function GameControls({ onLeave }: { onLeave: () => void }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMicOn(!micOn)}
        aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${
          micOn
            ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
            : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
        }`}
      >
        {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </button>
      <button
        onClick={() => setCamOn(!camOn)}
        aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${
          camOn
            ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
            : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
        }`}
      >
        {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </button>
      <button
        onClick={onLeave}
        aria-label="Leave game"
        className="flex h-9 items-center gap-1.5 rounded-md border border-[#E56B6F]/30 bg-[#E56B6F]/10 px-3 text-sm font-medium text-[#E56B6F] transition-all hover:bg-[#E56B6F]/20"
      >
        <PhoneOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
