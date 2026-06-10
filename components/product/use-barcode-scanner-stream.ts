"use client";

import { useEffect, type RefObject } from "react";

type BarcodeScannerStreamOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  constraints: MediaTrackConstraints;
  onStreamStart: () => void;
  onStreamError: (error: unknown) => void;
};

const stopMediaStream = (stream: MediaStream | null): void => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

const isInterruptedPlaybackError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const attachStreamToVideo = async (
  video: HTMLVideoElement,
  stream: MediaStream,
): Promise<void> => {
  video.srcObject = stream;
  await video.play();
};

export const useBarcodeScannerStream = ({
  videoRef,
  constraints,
  onStreamStart,
  onStreamError,
}: BarcodeScannerStreamOptions): void => {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !navigator.mediaDevices?.getUserMedia) return;

    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    const startStream = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: constraints,
        });
        if (isCancelled) {
          stopMediaStream(stream);
          return;
        }
        activeStream = stream;
        await attachStreamToVideo(video, stream);
        onStreamStart();
      } catch (error) {
        if (isCancelled || isInterruptedPlaybackError(error)) return;
        onStreamError(error);
      }
    };

    void startStream();

    return () => {
      isCancelled = true;
      stopMediaStream(activeStream);
      video.srcObject = null;
    };
  }, [constraints, onStreamError, onStreamStart, videoRef]);
};
