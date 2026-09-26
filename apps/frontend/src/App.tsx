import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { GameProvider } from '@/lib/game-context';
import { ProtectedRoute } from '@/components/game/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { HowToPlayPage } from '@/pages/HowToPlayPage';
import { AuthPage } from '@/pages/AuthPage';
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
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/how-to-play" element={<HowToPlayPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join"
              element={
                <ProtectedRoute>
                  <JoinRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomCode"
              element={
                <ProtectedRoute>
                  <WaitingRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomCode/select"
              element={
                <ProtectedRoute>
                  <CharacterSelectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomCode/countdown"
              element={
                <ProtectedRoute>
                  <CountdownPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:roomCode"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:roomCode/result"
              element={
                <ProtectedRoute>
                  <GameResultPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
