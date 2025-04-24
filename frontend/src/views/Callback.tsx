import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Authenticating...');
  const navigate = useNavigate();
  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('No code found in URL');
      return;
    }

    // Optional: send to your backend
    fetch('api/callback', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-discord-code': code
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
        console.log("GOOD?")
        if(data.ok) {
            navigate("/home")
        }
        else {
            navigate("/")
        }
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
