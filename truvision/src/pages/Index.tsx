import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { WebcamDetection } from '@/components/WebcamDetection';
import { VideoUpload } from '@/components/VideoUpload';
import { Button } from '@/components/ui/button';
import api from '@/api/api';

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    checkBackend();
    // Re-check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    try {
      await api.checkBackendHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed top-6 right-6 z-50"
      >
        <Button
          variant="glass"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-12 h-12"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-6xl md:text-7xl font-black mb-4 text-foreground"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-glow text-primary">TruVision</span>
          </motion.h1>
          <div className="h-1 w-32 bg-primary mx-auto mb-6 glow-primary-strong rounded-full" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground font-light"
          >
            Unmasking Digital Lies with AI Precision
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground/60 mt-3"
          >
            Powered by MobileNetV2 deep learning model for real-time deepfake detection
          </motion.p>

          {/* Backend Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-semibold"
            style={{
              background: backendStatus === 'online'
                ? 'rgba(16, 185, 129, 0.1)'
                : backendStatus === 'offline'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(156, 163, 175, 0.1)',
              borderColor: backendStatus === 'online'
                ? 'rgba(16, 185, 129, 0.3)'
                : backendStatus === 'offline'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(156, 163, 175, 0.3)',
              color: backendStatus === 'online'
                ? 'rgb(52, 211, 153)'
                : backendStatus === 'offline'
                  ? 'rgb(248, 113, 113)'
                  : 'rgb(156, 163, 175)',
            }}
          >
            {backendStatus === 'online' ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Backend Connected
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Backend Offline — Start Flask server on port 5000
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                Checking backend...
              </>
            )}
          </motion.div>
        </motion.header>

        {/* Detection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto mb-12">
          <WebcamDetection />
          <VideoUpload />
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 text-muted-foreground text-sm"
        >
          <p>© 2026 TruVision</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
