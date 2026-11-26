import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateRoomPage from './pages/CreateRoomPage'
import JoinRoomPage from './pages/JoinRoomPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CreatorPage from './pages/CreatorPage'
import PublicRoomsPage from './pages/PublicRoomsPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/creator" element={<CreatorPage />} />
      <Route path="/create" element={<CreateRoomPage />} />
      <Route path="/join" element={<JoinRoomPage />} />
      <Route path="/rooms" element={<PublicRoomsPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/lobby/:code" element={<LobbyPage />} />
      <Route path="/game/:code" element={<GamePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
