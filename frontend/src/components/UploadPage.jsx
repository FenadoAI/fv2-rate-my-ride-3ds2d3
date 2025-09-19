import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API = `${API_BASE}/api`;

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const base64String = await convertToBase64(selectedFile);

      const response = await axios.post(`${API}/cars/upload`, {
        photo: base64String
      });

      console.log('Upload successful:', response.data);
      setUploaded(true);

      // Navigate to voting page after 2 seconds
      setTimeout(() => {
        navigate('/vote');
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
              <p className="text-gray-600 mb-4">Your car is now ready for voting.</p>
              <p className="text-sm text-gray-500">Redirecting to voting page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔥 Hot Cars</h1>
          <p className="text-xl text-gray-600">Upload your ride and see how it ranks!</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Your Car
            </CardTitle>
            <CardDescription>
              Share a photo of your car and let the community vote on how hot it is!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Car preview"
                    className="max-h-64 w-full object-contain rounded-lg"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">Drop your car photo here</p>
                    <p className="text-gray-500">or click to browse files</p>
                  </div>
                </div>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-4">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {uploading ? 'Uploading...' : 'Upload Car'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/vote')}
              >
                Skip to Voting
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/leaderboard')}>
            View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;