import { Camera, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type ProcessedImage, processCanvasCapture } from '../utils/image';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (processed: ProcessedImage) => void;
  onFallbackToFile: () => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFile,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setCameraError('');
    setIsReady(false);

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera preview is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setCameraError('Camera access was declined or is unavailable on this device.');
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSnap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const maxDim = 1024;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const processed = processCanvasCapture(canvas);
    onCapture(processed);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Take Product Photo"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden border border-[#E6DFD5]">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#E6DFD5]">
          <h2 className="text-base font-bold text-[#1F1915]">Take Product Photo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#685D53] hover:bg-[#FAF7F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {cameraError ? (
            <div className="py-8 px-4 text-center bg-[#FAF7F2] rounded-xl border border-[#E6DFD5] space-y-3">
              <p className="text-sm font-medium text-[#1F1915]">{cameraError}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackToFile();
                }}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Photo from Device</span>
              </button>
            </div>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden bg-[#1F1915] aspect-[4/3]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                    Starting camera...
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={!isReady}
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFile();
                  }}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E6DFD5] text-[#1F1915] font-semibold text-sm cursor-pointer whitespace-nowrap shrink-0"
                >
                  Upload Instead
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
