import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  avatar?: string;
  discriminator: string;
}

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/get_info', {
      credentials: 'include',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error(err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const startTranscription = () => {
    setStatus('Starting transcription...');
    fetch('/api/start_transcription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ company }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to start transcription');
        return res.json();
      })
      .then(() => setStatus('Transcription started successfully.'))
      .catch((err) => {
        console.error(err);
        setStatus('Failed to start transcription.');
      });
  };

  if (loading)
    return (
      <div className="text-white h-screen flex justify-center items-center bg-gray-900">
        Loading...
      </div>
    );

  if (!user)
    return (
      <div className="text-white h-screen flex justify-center items-center bg-gray-900">
        Not logged in
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user.username}
      </h1>
      {user.avatar && (
        <img
          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
          alt="avatar"
          className="rounded-full w-32 h-32 mb-4"
        />
      )}
      <br></br>
      <h2 className='mb-2'>Begin your transcription</h2>
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Enter company name"
        className="mb-2 p-2 rounded text-black bg-white"
      />
      <button
        onClick={startTranscription}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        Start Transcription
      </button>
      {status && <p className="mt-4 text-sm text-gray-300">{status}</p>}
    </div>
  );
};

export default Home;
