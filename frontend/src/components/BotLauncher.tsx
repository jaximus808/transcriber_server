import "../App.css"
import { useEffect, useState } from 'react';

type VoiceInfo = {
  success: boolean;
  inVoice?: boolean;
  guildId?: string;
  channelId?: string;
};

const TranscriberPrompt = () => {
  const [voiceInfo, setVoiceInfo] = useState<VoiceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('');
  const [started, setStarted] = useState(false);

  const startTranscriber = () => {
    if (!voiceInfo) return;

    fetch('/api/start_transcription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ guildId: voiceInfo.guildId, company })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('Transcription bot started, expect it joining you soon!');
          setStarted(true);
        } else {
          setStatus('Failed to start transcriber bot!');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus(`Error starting transcriber: ${err}`);
      });
  };

  useEffect(() => {
    const fetchVoiceLocation = async () => {
      try {
        const res = await fetch('/api/user_voice_location', { credentials: 'include', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        setVoiceInfo(data);
        setStatus('Ready!');
      } catch (err) {
        console.error('Error fetching voice location:', err);
        setStatus(`Error fetching voice location: ${err}`);
        setVoiceInfo({ success: false });
      } finally {
        setLoading(false);
      }
    };
    fetchVoiceLocation();
  }, []);

  if (loading) return <div className="text-white">Checking your voice status...</div>;
  if (!voiceInfo?.success) return <div className="text-red-400">Unable to detect voice channel.</div>;
  if (!voiceInfo.inVoice) return <div className="text-yellow-300">You're not currently in a voice channel.</div>;

  return (
    <div className="p-4 bg-gray-800 rounded-xl text-white shadow-xl">
      <p className="text-lg mb-2">
        ✅ You're in channel <span className="font-mono text-green-300">{voiceInfo.channelId}</span>
      </p>

      <input
        type="text"
        value={company}
        onChange={e => setCompany(e.target.value)}
        placeholder="Enter company name"
        className="mb-2 p-2 rounded text-black bg-white"
      />

      {!started && (
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold"
          onClick={startTranscriber}
          disabled={!voiceInfo}
        >
          Start Transcriber!
        </button>
      )}

      {status && (
        <p className="mt-4 text-sm text-gray-300">
          {status}
          {started && <span> To stop, type <code>!stop</code> in your Discord server.</span>}
        </p>
      )}
    </div>
  );
};

export default TranscriberPrompt;
