// src/api/api.js
const API_BASE_URL = 'http://localhost:5000/api'; // Flask backend URL

// Health check – confirm backend is running
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (error) {
    console.error("Backend health check failed:", error);
    throw error;
  }
}

// Analyze a single frame (used by webcam)
export async function analyzeFrame(imageBase64) {
  try {
    const res = await fetch(`${API_BASE_URL}/analyze-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error analyzing frame:", error);
    throw error;
  }
}

// Analyze uploaded video file
export async function analyzeVideo(videoFile) {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);

    const res = await fetch(`${API_BASE_URL}/analyze-video`, {
      method: 'POST',
      body: formData,
    });

    return await res.json();
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

// Start local webcam detection (backend opens webcam window)
export async function startWebcamDetection() {
  try {
    const res = await fetch(`${API_BASE_URL}/start-webcam`);
    return await res.json();
  } catch (error) {
    console.error("Error starting webcam detection:", error);
    throw error;
  }
}

export default {
  checkBackendHealth,
  analyzeFrame,
  analyzeVideo,
  startWebcamDetection
};
