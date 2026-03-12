import { useState, useRef, useEffect } from 'react';
import { Camera, Shield, AlertTriangle } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { DetectionState } from '../utils/detectionHelper';

export default function CameraPreview({ onDetection }) {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [detectionLabel, setDetectionLabel] = useState('Initializing AI...');
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const detectionStateRef = useRef(new DetectionState());
    const requestRef = useRef();

    // 1. Initialize MediaPipe Face Landmarker
    useEffect(() => {
        const initLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                landmarkerRef.current = landmarker;
                setIsModelLoading(false);
                setDetectionLabel('AI Ready');
            } catch (err) {
                console.error("Error initializing MediaPipe", err);
                setDetectionLabel('AI Error');
            }
        };
        initLandmarker();
    }, []);

    // 2. Camera & Processing Loop
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraActive(true);
                }
            } catch (err) {
                console.error("Error accessing camera", err);
                setDetectionLabel('Camera Access Denied');
            }
        };

        const detect = async () => {
            if (landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
                const results = await landmarkerRef.current.detectForVideo(videoRef.current, performance.now());

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    const status = detectionStateRef.current.process(results.faceLandmarks[0]);

                    if (status) {
                        setDetectionLabel(status === 'fatigue' ? 'Fatigue Detected!' : 'Distraction Detected!');
                        if (onDetection) onDetection(status);
                    } else if (detectionLabel.includes('Detected')) {
                        // Clear label after a delay if status is fine
                        setTimeout(() => setDetectionLabel('Monitoring...'), 2000);
                    } else {
                        setDetectionLabel('Monitoring...');
                    }
                } else {
                    setDetectionLabel('Face not found');
                }
            }
            requestRef.current = requestAnimationFrame(detect);
        };

        startCamera();
        requestRef.current = requestAnimationFrame(detect);

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [onDetection]);

    return (
        <div className="card" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
            <div style={{ width: '160px', height: '120px', backgroundColor: '#000', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', position: 'relative' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {!isCameraActive && !isModelLoading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                        <Camera size={24} opacity={0.5} />
                    </div>
                )}
                {isModelLoading && (
                    <div className="flex items-center justify-center" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px' }}>
                        Loading AI...
                    </div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-xs">
                    <h4 style={{ margin: 0 }}>Vigilance Monitor</h4>
                    {detectionLabel.includes('Detected') ? (
                        <AlertTriangle size={16} color="var(--color-alert)" />
                    ) : (
                        <Shield size={16} color="var(--color-success)" />
                    )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    {detectionLabel}
                </p>
            </div>
        </div>
    );
}
