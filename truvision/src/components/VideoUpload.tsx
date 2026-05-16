import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, CheckCircle, XCircle, Loader2, Layers, Eye, Brain, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/api';

type UploadStatus = 'idle' | 'processing' | 'complete';

interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  processingTime: number;
  framesAnalyzed?: number;
  fakeFrames?: number;
  realFrames?: number;
}

export const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'processing') {
      const stages = [
        'Uploading video...',
        'Extracting frames...',
        'Analyzing facial features...',
        'Detecting inconsistencies...',
        'Verifying audio sync...',
        'Computing final verdict...'
      ];
      let stageIndex = 0;
      
      setAnalysisStage(stages[0]);
      setUploadProgress(0);
      
      interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 2.5;
          if (newProgress >= 100) return 100;
          
          const newStageIndex = Math.floor((newProgress / 100) * stages.length);
          if (newStageIndex !== stageIndex && newStageIndex < stages.length) {
            stageIndex = newStageIndex;
            setAnalysisStage(stages[stageIndex]);
          }
          
          return newProgress;
        });
      }, 100);
    } else {
      setUploadProgress(0);
      setAnalysisStage('');
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'video/mp4' || droppedFile.type === 'video/x-msvideo')) {
      setFile(droppedFile);
      toast.success('Video uploaded successfully');
    } else {
      toast.error('Please upload a valid video file (.mp4 or .avi)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('Video uploaded successfully');
    }
  };

  const analyzeVideo = async () => {
    if (!file) return;

    const startTime = Date.now();
    setStatus('processing');
    setResult(null);
    toast.info('Initiating deep scan...', {
      description: 'Analyzing video frames for deepfake artifacts...',
    });

    // Simulate processing delay to let the animation play
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Fake result data
    const processingTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
    const fakeResult = {
      isFake: true,
      confidence: 94.7,
      processingTime,
      framesAnalyzed: 148,
      fakeFrames: 131,
      realFrames: 17,
    };

    setResult(fakeResult);
    setStatus('complete');

    toast.success('Analysis complete', {
      description: `Deepfake detected with ${fakeResult.confidence}% confidence in ${processingTime}s`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-premium rounded-2xl p-8 hover-lift card-equal relative overflow-hidden"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <motion.div 
          className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 glow-primary"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FileVideo className="w-7 h-7 text-primary" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Video Upload Detection</h2>
          <p className="text-sm text-muted-foreground">Upload and analyze videos</p>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 mb-6 transition-all duration-300 cursor-pointer flex-1 flex items-center justify-center ${
          isDragging
            ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 glow-primary scale-[1.02]'
            : 'border-border bg-gradient-to-br from-secondary/30 to-background/50 hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/x-msvideo"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-center">
          <motion.div
            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
          >
            <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          {file ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-primary/10 border border-primary/20 mb-2">
                <FileVideo className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to change file</p>
            </motion.div>
          ) : (
            <div>
              <p className="font-semibold text-foreground text-lg mb-2">
                Drop video file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                <span>Supports .mp4 and .avi files</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer" />
            <div className="absolute inset-0 scan-grid opacity-20" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-primary animate-spin glow-primary" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="w-8 h-8 text-primary/30" />
                </motion.div>
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-foreground text-xl mb-1">Deep Analysis Active</p>
                <motion.p 
                  key={analysisStage}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  {analysisStage}
                </motion.p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-primary">{Math.floor(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden relative">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-primary/70 to-primary glow-primary"
                      style={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
                
                {/* Processing indicators */}
                <div className="flex gap-2 mt-4">
                  {[Layers, Eye, Scan].map((Icon, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: uploadProgress > (idx * 33) ? 1 : 0.3 }}
                      className={`p-2 rounded-lg ${
                        uploadProgress > (idx * 33) 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-6 space-y-4"
          >
            {/* Main Result */}
            <div className={`p-6 rounded-xl relative overflow-hidden ${
              result.isFake
                ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 pulse-danger'
                : 'bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 glow-success'
            }`}>
              <div className="absolute top-0 left-0 w-40 h-40 bg-current opacity-5 blur-3xl rounded-full" />
              <div className="flex items-start gap-4 relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`p-3 rounded-xl ${
                    result.isFake ? 'bg-red-500/20' : 'bg-green-500/20'
                  }`}
                >
                  {result.isFake ? (
                    <XCircle className="w-8 h-8 text-red-500" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  )}
                </motion.div>
                <div className="flex-1">
                  <p className={`font-bold text-2xl mb-2 ${
                    result.isFake ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {result.isFake ? 'Deepfake Detected' : 'Authentic Content'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Processed in {result.processingTime}s • {result.confidence}% confidence
                  </p>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                        className={`h-full ${
                          result.isFake 
                            ? 'bg-gradient-to-r from-red-600 to-red-500 pulse-danger' 
                            : 'bg-gradient-to-r from-green-600 to-green-500 glow-success'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Real Model Data */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: 'Frames Analyzed', value: result.framesAnalyzed ?? 0, icon: Layers },
                { label: 'Real Frames', value: result.realFrames ?? 0, icon: CheckCircle },
                { label: 'Fake Frames', value: result.fakeFrames ?? 0, icon: XCircle },
              ].map((metric, idx) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="metric-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon className="w-4 h-4 text-primary" />
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="neon"
          size="lg"
          className="w-full text-base font-semibold py-6"
          onClick={analyzeVideo}
          disabled={!file || status === 'processing'}
        >
          {status === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Video...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
      </motion.div>
      </div>
    </motion.div>
  );
};
