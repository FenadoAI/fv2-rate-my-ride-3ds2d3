import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Upload, Vote, RotateCcw, Flame, ThumbsDown } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API = `${API_BASE}/api`;

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/cars/leaderboard?limit=20`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankBadge = (position) => {
    if (position <= 3) {
      const colors = {
        1: 'bg-yellow-500 text-white',
        2: 'bg-gray-400 text-white',
        3: 'bg-amber-600 text-white'
      };
      return <Badge className={colors[position]}>#{position}</Badge>;
    }
    return <Badge variant="outline">#{position}</Badge>;
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-red-500';
    if (score >= 0.6) return 'text-orange-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Hot Cars Leaderboard</h1>
              <p className="text-gray-600">The hottest rides ranked by community votes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/upload')}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Car
              </Button>
              <Button variant="outline" onClick={() => navigate('/vote')}>
                <Vote className="w-4 h-4 mr-2" />
                Vote
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchLeaderboard} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No cars yet!</h3>
              <p className="text-gray-600 mb-6">Be the first to upload a car and start the competition.</p>
              <Button onClick={() => navigate('/upload')} className="bg-orange-500 hover:bg-orange-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload First Car
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top 3 showcase */}
            {leaderboard.slice(0, 3).length > 0 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Top 3 Hottest Cars
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {leaderboard.slice(0, 3).map((car, index) => (
                      <div key={car.id} className="text-center">
                        <div className="relative mb-3">
                          {getRankIcon(index + 1)}
                          <div className="mt-2">
                            <img
                              src={car.photo}
                              alt={`#${index + 1} car`}
                              className="w-full h-32 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className={`text-2xl font-bold ${getScoreColor(car.score)}`}>
                            {car.total_votes > 0 ? Math.round(car.score * 100) : 0}%
                          </p>
                          <div className="flex justify-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-red-500">
                              <Flame className="w-3 h-3" />
                              {car.hot_votes}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <ThumbsDown className="w-3 h-3" />
                              {car.not_votes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>All Cars Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((car, index) => (
                    <div
                      key={car.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        {getRankBadge(index + 1)}
                      </div>

                      {/* Car image */}
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={car.photo}
                          alt={`Car #${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className={`text-2xl font-bold ${getScoreColor(car.score)}`}>
                            {car.total_votes > 0 ? Math.round(car.score * 100) : 0}%
                          </p>
                          <p className="text-xs text-gray-600">Hot Score</p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-red-500">{car.hot_votes}</p>
                          <p className="text-xs text-gray-600">Hot</p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-gray-500">{car.not_votes}</p>
                          <p className="text-xs text-gray-600">Not</p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-blue-500">{car.total_votes}</p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                      </div>

                      {/* Trophy for top 3 */}
                      <div className="flex-shrink-0 w-8">
                        {index < 3 && getRankIcon(index + 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Refresh button */}
            <div className="text-center">
              <Button onClick={fetchLeaderboard} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh Leaderboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;