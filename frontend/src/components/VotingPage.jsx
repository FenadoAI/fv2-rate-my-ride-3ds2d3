import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, ThumbsDown, RotateCcw, Trophy, Upload } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API = `${API_BASE}/api`;

const VotingPage = () => {
  const [currentCar, setCurrentCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState(null);
  const [votesCount, setVotesCount] = useState(0);
  const navigate = useNavigate();

  const fetchRandomCar = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/cars/random`);
      setCurrentCar(response.data);
      setVoted(false);
    } catch (error) {
      console.error('Error fetching car:', error);
      if (error.response?.status === 404) {
        setError('No cars available yet. Be the first to upload one!');
      } else {
        setError('Failed to load cars. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (isHot) => {
    if (!currentCar || voting) return;

    setVoting(true);
    try {
      await axios.post(`${API}/cars/vote`, {
        car_id: currentCar.id,
        is_hot: isHot
      });

      setVoted(true);
      setVotesCount(prev => prev + 1);

      // Auto-advance to next car after 1.5 seconds
      setTimeout(() => {
        fetchRandomCar();
      }, 1500);

    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to record vote. Please try again.');
      setVoting(false);
    }
  };

  useEffect(() => {
    fetchRandomCar();
  }, []);

  const VoteButton = ({ isHot, onClick, children, className }) => (
    <Button
      onClick={onClick}
      disabled={voting || voted}
      size="lg"
      className={`flex-1 h-16 text-xl font-bold transition-all transform hover:scale-105 ${className} ${
        voted ? 'opacity-50' : ''
      }`}
    >
      {children}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔥 Hot Cars</h1>
            <p className="text-sm text-gray-600">Votes cast: {votesCount}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/upload')}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline" onClick={() => navigate('/leaderboard')}>
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {loading ? (
            <Card className="w-full">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading next car...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="w-full">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => navigate('/upload')} className="bg-orange-500 hover:bg-orange-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Car
                  </Button>
                  <Button variant="outline" onClick={fetchRandomCar}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentCar && (
            <div className="space-y-6">
              {/* Car image */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={currentCar.photo}
                      alt="Car to vote on"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Voting buttons */}
              <div className="flex gap-4">
                <VoteButton
                  isHot={true}
                  onClick={() => handleVote(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Flame className="w-6 h-6 mr-2" />
                  HOT
                </VoteButton>
                <VoteButton
                  isHot={false}
                  onClick={() => handleVote(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <ThumbsDown className="w-6 h-6 mr-2" />
                  NOT
                </VoteButton>
              </div>

              {/* Car stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-red-500">{currentCar.hot_votes}</p>
                      <p className="text-sm text-gray-600">Hot Votes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-500">{currentCar.not_votes}</p>
                      <p className="text-sm text-gray-600">Not Votes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-500">
                        {currentCar.total_votes > 0 ? Math.round(currentCar.score * 100) : 0}%
                      </p>
                      <p className="text-sm text-gray-600">Hot Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status message */}
              {voted && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-green-800 font-medium">
                      Vote recorded! Loading next car...
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Next button */}
              <Button
                variant="outline"
                onClick={fetchRandomCar}
                className="w-full"
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Next Car
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;