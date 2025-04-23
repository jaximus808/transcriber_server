import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('No code found in URL');
      return;
    }

    // Optional: send to your backend
    fetch('http://localhost:3001/callback', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(data => {
        setStatus(`Logged in as ${data.username}`);
      })
      .catch(err => {
        console.error(err);
        setStatus('Failed to authenticate');
      });
  }, [searchParams]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-800 text-white">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{status}</h1>
      </div>
    </div>
  );
};

export default Callback;
