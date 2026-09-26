import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from '@/lib/game-context';
import { LandingPage } from '@/pages/LandingPage';
import { HowToPlayPage } from '@/pages/HowToPlayPage';
import { CreateRoomPage } from '@/pages/CreateRoomPage';
import { JoinRoomPage } from '@/pages/JoinRoomPage';
import { WaitingRoomPage } from '@/pages/WaitingRoomPage';
import { CharacterSelectPage } from '@/pages/CharacterSelectPage';
import { CountdownPage } from '@/pages/CountdownPage';
import { GamePage } from '@/pages/GamePage';
import { GameResultPage } from '@/pages/GameResultPage';
import './App.css';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/room/:roomCode" element={<WaitingRoomPage />} />
          <Route path="/room/:roomCode/select" element={<CharacterSelectPage />} />
          <Route path="/room/:roomCode/countdown" element={<CountdownPage />} />
          <Route path="/game/:roomCode" element={<GamePage />} />
          <Route path="/game/:roomCode/result" element={<GameResultPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
