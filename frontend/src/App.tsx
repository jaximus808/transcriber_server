import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './views/Landing';
import Callback from './views/Callback';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
