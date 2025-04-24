import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './views/Landing';
import Callback from './views/Callback';
import Home from './views/Home';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
