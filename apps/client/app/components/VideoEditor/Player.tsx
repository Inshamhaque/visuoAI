"use client";

import { useRef, useState, useEffect } from "react";

interface Clip {
  url: string;
  order: number;
  duration?: number;
}

interface VideoPlayerProps {
  clips: Clip[];
}

export default function VideoEditor({ clips }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clipList, setClipList] = useState<Clip[]>(
    [...clips].sort((a, b) => a.order - b.order)
  );
  const [currIdx, setIdx] = useState(0);
  const playheadRef = useRef<HTMLDivElement>(null);
  const dragStartIndex = useRef<number | null>(null);

  const currentClip = clipList[currIdx];

  const handleMetadataLoaded = (duration: number) => {
    setClipList((prev) =>
      prev.map((clip, idx) => (idx === currIdx ? { ...clip, duration } : clip))
    );
  };

  const handleEnded = () => {
    if (currIdx < clipList.length - 1) {
      setIdx(currIdx + 1);
    }
  };

  const handleDragStart = (index: number) => {
    dragStartIndex.current = index;
  };

  const handleDrop = (index: number) => {
    const startIdx = dragStartIndex.current;
    if (startIdx === null || startIdx === index) return;

    const updated = [...clipList];
    const [removed] = updated.splice(startIdx, 1);
    updated.splice(index, 0, removed);

    // Reassign order
    const reordered = updated.map((clip, i) => ({ ...clip, order: i + 1 }));
    setClipList(reordered);
    dragStartIndex.current = null;
  };

  const timelineMap = clipList.reduce(
    (acc, clip) => {
      const duration = clip.duration ?? 0;
      const start = acc.total;
      const end = start + duration;
      acc.map.push({ ...clip, start, end });
      acc.total = end;
      return acc;
    },
    { total: 0, map: [] as Array<Clip & { start: number; end: number }> }
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip?.url) return;

    video.src = currentClip.url; // explicitly set src
    video.load();
    video.play().catch(() => {});
  }, [currIdx, currentClip?.url]);

  useEffect(() => {
    let animationId: number;
    const updatePlayhead = () => {
      const video = videoRef.current;
      if (!video || !currentClip?.duration) return;
      const localTime = video.currentTime;
      const globalOffset = timelineMap.map[currIdx]?.start ?? 0;
      const globalTime = globalOffset + localTime;
      const percent = (globalTime / timelineMap.total) * 100;
      if (playheadRef.current) {
        playheadRef.current.style.left = `${percent}%`;
      }
      animationId = requestAnimationFrame(updatePlayhead);
    };
    animationId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationId);
  }, [currIdx, timelineMap.total]);

  return (
    <div className="p-4 max-w-4xl mx-auto ">
      <h2 className="text-lg font-bold mb-2">Video Editor</h2>

      {/* Video Player */}
      <video
        ref={videoRef}
        src={currentClip?.url}
        controls
        height="200"
        className="rounded shadow w-full"
        onEnded={handleEnded}
        onLoadedMetadata={(e) => handleMetadataLoaded(e.currentTarget.duration)}
      />

      {/* Timeline */}
      <div className="relative mt-6 border rounded bg-white overflow-x-auto h-20">
        {/* Playhead */}
        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10"
          style={{ left: `0%` }}
        />

        {/* Timeline Clips */}
        <div className="flex h-full items-center">
          {timelineMap.map.map((clip, index) => {
            const width = (clip.duration ?? 1) * 10; // scale: 10px per sec
            return (
              <div
                key={clip.url}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onClick={() => setIdx(index)}
                className={`bg-blue-600 text-xs text-white flex justify-center items-center border mx-1 rounded-sm shadow cursor-pointer select-none ${
                  index === currIdx ? "ring-2 ring-red-400" : ""
                }`}
                style={{ width: `${width}px`, height: "60px" }}
              >
                Clip {clip.order}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <p className="text-sm text-gray-500 mt-2">
        Now playing clip {currIdx + 1} of {clipList.length} | Total duration:{" "}
        {timelineMap.total.toFixed(2)}s
      </p>
    </div>
  );
}
