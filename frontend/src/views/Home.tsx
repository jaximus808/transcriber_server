import { useEffect, useState } from 'react';
import TranscriberPrompt from '../components/BotLauncher';

import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  avatar?: string;
  discriminator: string;
}

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate()

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
        navigate("/")
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

 

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
      <img src="palantir-white.png"/>
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
      <a target='_blank' href={"https://clientlandscape-5ilramrr6upknllk.apps.usw-18.palantirfoundry.com/"}>Check Your Client Landscape</a>
      <TranscriberPrompt/>
    </div>
  );
};

export default Home;
