import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { VU_GOLD } from '../theme';

function stopMediaStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

const BRACKET_SIZE = 18;
const BRACKET_COLOR = 'rgba(255, 255, 255, 0.75)';

const CORNER_BRACKETS = [
  { top: 0, left: 0, borders: { borderTop: true, borderLeft: true } },
  { top: 0, right: 0, borders: { borderTop: true, borderRight: true } },
  { bottom: 0, left: 0, borders: { borderBottom: true, borderLeft: true } },
  { bottom: 0, right: 0, borders: { borderBottom: true, borderRight: true } },
];

function FaceGuideOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: 1,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '58%', sm: '52%' },
          maxWidth: 220,
          aspectRatio: '3 / 4',
          borderRadius: '50%',
          border: `2px dashed ${VU_GOLD}`,
          boxShadow: '0 0 0 9999px rgba(0, 51, 102, 0.5)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '33%',
            left: '8%',
            right: '8%',
            height: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.25)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '66%',
            left: '8%',
            right: '8%',
            height: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.25)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '33%',
            top: '8%',
            bottom: '8%',
            width: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.25)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '66%',
            top: '8%',
            bottom: '8%',
            width: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.25)',
          }}
        />

        {CORNER_BRACKETS.map((corner, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: corner.top,
              left: corner.left,
              right: corner.right,
              bottom: corner.bottom,
              width: BRACKET_SIZE,
              height: BRACKET_SIZE,
              ...(corner.borders.borderTop && { borderTop: `2px solid ${BRACKET_COLOR}` }),
              ...(corner.borders.borderLeft && { borderLeft: `2px solid ${BRACKET_COLOR}` }),
              ...(corner.borders.borderRight && { borderRight: `2px solid ${BRACKET_COLOR}` }),
              ...(corner.borders.borderBottom && { borderBottom: `2px solid ${BRACKET_COLOR}` }),
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function cameraErrorMessage(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission denied. Click the camera icon in your browser address bar, allow access for localhost, then try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No webcam found. Connect a camera or use a laptop with a built-in webcam.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Camera is busy. Close other tabs or apps using the webcam (Zoom, Teams, Camera app), wait a few seconds, then click Retry.';
  }
  return 'Unable to access camera. Allow camera permission for this site and make sure no other program is using the webcam.';
}

export default function SelfieCapture({
  onCapture,
  label = 'Capture Selfie',
  processing = false,
  disabled = false,
  autoSubmitOnCapture = true,
  processingLabel = 'Processing…',
}) {
  const webcamRef = useRef(null);
  const streamRef = useRef(null);
  const capturingRef = useRef(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamKey, setWebcamKey] = useState(0);
  const [useBasicConstraints, setUseBasicConstraints] = useState(false);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    stopMediaStream(webcamRef.current?.stream ?? null);
    setCameraReady(false);
  }, []);

  const handleUserMedia = useCallback((stream) => {
    if (streamRef.current && streamRef.current !== stream) {
      stopMediaStream(streamRef.current);
    }
    streamRef.current = stream;
    setCameraReady(true);
    setError('');
  }, []);

  // Delay webcam start so previous streams (e.g. React Strict Mode remount) can release
  useEffect(() => {
    const timer = setTimeout(() => setShowWebcam(true), 400);
    return () => {
      clearTimeout(timer);
      setShowWebcam(false);
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    const handleBeforeUnload = () => stopCamera();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stopCamera]);

  const retryCamera = useCallback(() => {
    stopCamera();
    setError('');
    setCameraReady(false);
    setShowWebcam(false);
    setUseBasicConstraints(false);
    setTimeout(() => {
      setWebcamKey((k) => k + 1);
      setShowWebcam(true);
    }, 500);
  }, [stopCamera]);

  useEffect(() => {
    if (processing) {
      stopCamera();
      setShowWebcam(false);
    } else {
      capturingRef.current = false;
    }
  }, [processing, stopCamera]);

  const capture = useCallback(() => {
    if (capturingRef.current || processing || disabled) return;
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) {
      setError('Camera not available. Please allow camera access in your browser settings and try again.');
      return;
    }
    capturingRef.current = true;
    stopCamera();
    setShowWebcam(false);
    setPreview(shot);
    setError('');
    if (autoSubmitOnCapture) {
      onCapture?.(shot);
    }
  }, [onCapture, stopCamera, processing, disabled, autoSubmitOnCapture]);

  const handleRetake = useCallback(() => {
    if (processing || disabled) return;
    capturingRef.current = false;
    setPreview(null);
    setShowWebcam(false);
    onCapture?.(null);
    setTimeout(() => {
      setWebcamKey((k) => k + 1);
      setShowWebcam(true);
    }, 400);
  }, [onCapture, processing, disabled]);

  const handleConfirm = useCallback(() => {
    if (!preview || processing || disabled) return;
    onCapture?.(preview);
  }, [preview, onCapture, processing, disabled]);

  const handleUserMediaError = useCallback((err) => {
    stopCamera();
    setShowWebcam(false);
    if (!useBasicConstraints && (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError')) {
      setUseBasicConstraints(true);
      setWebcamKey((k) => k + 1);
      setTimeout(() => setShowWebcam(true), 400);
      return;
    }
    setError(cameraErrorMessage(err));
  }, [stopCamera, useBasicConstraints]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="subtitle1" gutterBottom aria-live="polite">
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Position your face inside the frame
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Only one face visible · Use good lighting
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={retryCamera} sx={{ mt: 1, display: 'block' }}>
            Retry camera
          </Button>
        </Alert>
      )}
      {!preview ? (
        <Box>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              maxWidth: 400,
              mx: 'auto',
              minHeight: 240,
            }}
          >
            {showWebcam && !error && !processing ? (
              <Webcam
                key={webcamKey}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.75}
                width="100%"
                style={{ width: '100%', display: 'block', borderRadius: 8 }}
                videoConstraints={
                  useBasicConstraints
                    ? true
                    : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                }
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                aria-label="Webcam for selfie capture"
              />
            ) : !error && (
              <Box
                sx={{
                  height: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">Starting camera…</Typography>
              </Box>
            )}
            {cameraReady && <FaceGuideOverlay />}
          </Box>
          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={capture}
            sx={{ mt: 2 }}
            disabled={!cameraReady || processing || disabled}
            aria-label="Take selfie photo"
          >
            {label}
          </Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ position: 'relative', display: 'inline-block', maxWidth: 400, width: '100%' }}>
            <img
              src={preview}
              alt="Captured selfie preview"
              style={{ maxWidth: 400, width: '100%', borderRadius: 8, display: 'block' }}
            />
            {processing && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: 1,
                  gap: 1,
                }}
              >
                <CircularProgress size={40} sx={{ color: 'common.white' }} />
                <Typography variant="body2" sx={{ color: 'common.white' }}>
                  {processingLabel}
                </Typography>
              </Box>
            )}
          </Box>
          {!autoSubmitOnCapture && !processing && (
            <Button variant="contained" onClick={handleConfirm} sx={{ mt: 1, mr: 1 }} disabled={disabled}>
              Use this photo
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={handleRetake}
            sx={{ mt: 1 }}
            disabled={processing || disabled}
          >
            Retake
          </Button>
        </Box>
      )}
    </Box>
  );
}
