import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./components/UploadPage";
import VotingPage from "./components/VotingPage";
import LeaderboardPage from "./components/LeaderboardPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/vote" element={<VotingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
