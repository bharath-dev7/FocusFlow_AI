/**
 * Utility functions for analyzing MediaPipe landmarks for fatigue and distraction detection.
 */

// EAR (Eye Aspect Ratio) constants
const EYE_AR_THRESH = 0.25; // Eye closure threshold
const EYE_AR_CONSEC_FRAMES = 15; // ~0.5s to 1s of frames at 20-30fps

/**
 * Calculates EAR (Eye Aspect Ratio).
 * EAR = ||P2-P6|| + ||P3-P5|| / (2 * ||P1-P4||)
 */
export const calculateEAR = (landmarks) => {
    // Indices for left eye (Standard MediaPipe FaceMesh indices)
    // Top-left: 160, Top-right: 158, Bottom-left: 161, Bottom-right: 163, Inner: 133, Outer: 33
    const leftEye = [160, 158, 161, 163, 133, 33];
    // Right eye indices...
    const rightEye = [385, 387, 384, 388, 362, 263];

    const getDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    const calcSingleEAR = (eyeIndices) => {
        const p1 = landmarks[eyeIndices[5]]; // Outer
        const p2 = landmarks[eyeIndices[0]]; // Top-left
        const p3 = landmarks[eyeIndices[1]]; // Top-right
        const p4 = landmarks[eyeIndices[4]]; // Inner
        const p5 = landmarks[eyeIndices[3]]; // Bottom-right
        const p6 = landmarks[eyeIndices[2]]; // Bottom-left

        const vertical1 = getDist(p2, p6);
        const vertical2 = getDist(p3, p5);
        const horizontal = getDist(p1, p4);

        return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    return (calcSingleEAR(leftEye) + calcSingleEAR(rightEye)) / 2.0;
};

/**
 * Detects if the head is oriented away from the screen.
 * Uses the nose bridge and face center to approximate yaw.
 */
export const checkDistraction = (landmarks) => {
    const nose = landmarks[1]; // Tip of nose
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    // Simple horizontal balance check
    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const leftDist = Math.abs(nose.x - leftCheek.x);
    const rightDist = Math.abs(nose.x - rightCheek.x);

    const ratio = leftDist / rightDist;

    // If ratio is too skewed, the head is turned
    return ratio < 0.3 || ratio > 3.3;
};

/**
 * Detection state manager to handle debouncing and state persistence.
 */
export class DetectionState {
    constructor() {
        this.eyeClosedFrames = 0;
        this.lastFatigueTrigger = 0;
        this.lastDistractionTrigger = 0;
        this.cooldown = 30000; // 30s cooldown between same-type interventions
    }

    process(landmarks) {
        const ear = calculateEAR(landmarks);
        const isDistracted = checkDistraction(landmarks);
        const now = Date.now();

        let result = null;

        // Fatigue Logic: EAR below threshold for X consecutive frames
        if (ear < EYE_AR_THRESH) {
            this.eyeClosedFrames++;
            if (this.eyeClosedFrames > EYE_AR_CONSEC_FRAMES && (now - this.lastFatigueTrigger > this.cooldown)) {
                result = "fatigue";
                this.lastFatigueTrigger = now;
                this.eyeClosedFrames = 0;
            }
        } else {
            this.eyeClosedFrames = 0;
        }

        // Distraction Logic: Instant trigger if turned away
        if (!result && isDistracted && (now - this.lastDistractionTrigger > this.cooldown)) {
            result = "distraction";
            this.lastDistractionTrigger = now;
        }

        return result;
    }
}
