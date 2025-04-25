import '../App.css'

const OAUTH_URL = import.meta.env.VITE_DISCORD_OAUTH_URL;

const App = () => {
  const handleDiscordLogin = () => {
    window.location.href = OAUTH_URL;
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white"> 
    <img src="palantir-white.png"  alt="avatar" className=" w-26   h-32 mb-4"/>
      <div className="text-center">
       
        <h1 className="text-3xl font-bold mb-6">Connect to Client Landscaper Pipeline</h1>
        <h2 className="text-2xl font-semibold mb-6">Connect to Discord</h2>
        <button
          onClick={handleDiscordLogin}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Login with Discord
        </button>
      </div>
    </div>
  );
};

export default App;
