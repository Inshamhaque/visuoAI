"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Scissors,
  Video,
  Download,
  Save,
  RotateCcw,
  FastForward,
  Rewind,
} from "lucide-react";

interface Clip {
  id: string;
  url: string;
  order: number;
  duration?: number;
  name?: string;
  startTime?: number;
  endTime?: number;
}

interface VideoPlayerProps {
  clips: Clip[];
  onClipsChange?: (clips: Clip[]) => void;
}

export default function VideoEditor({
  clips,
  onClipsChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const dragStartIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const [clipList, setClipList] = useState<Clip[]>(
    [...clips]
      .map((clip) => ({
        ...clip,
        id: clip.id || `clip-${clip.order}-${Date.now()}`,
        name: clip.name || `Clip ${clip.order}`,
      }))
      .sort((a, b) => a.order - b.order)
  );
  const [currIdx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [draggedClip, setDraggedClip] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // clipping states
  const [clipMode, setClipMode] = useState(false);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [clipEnd, setClipEnd] = useState<number | null>(null);

  const currentClip = clipList[currIdx];

  // Update parent component when clips change
  useEffect(() => {
    onClipsChange?.(clipList);
  }, [clipList, onClipsChange]);

  const handleMetadataLoaded = useCallback(
    (duration: number) => {
      setClipList((prev) =>
        prev.map((clip, idx) =>
          idx === currIdx ? { ...clip, duration } : clip
        )
      );
    },
    [currIdx]
  );

  const handleEnded = useCallback(() => {
    if (currIdx < clipList.length - 1) {
      setIdx(currIdx + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currIdx, clipList.length]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentClip?.url) {
      console.log("No video or clip available");
      return;
    }

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          console.log("Video started playing");
        })
        .catch((error) => {
          console.error("Play failed:", error);
          setIsPlaying(false);
          if (error.name === "NotAllowedError") {
            alert(
              "Please interact with the page first to enable video playback"
            );
          }
        });
    } else {
      video.pause();
      setIsPlaying(false);
      console.log("Video paused");
    }
  }, [currentClip?.url]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      video.muted = false;
      setIsMuted(false);
    } else {
      video.volume = 0;
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const goToPreviousClip = useCallback(() => {
    if (currIdx > 0) {
      setIdx(currIdx - 1);
    }
  }, [currIdx]);

  const goToNextClip = useCallback(() => {
    if (currIdx < clipList.length - 1) {
      setIdx(currIdx + 1);
    }
  }, [currIdx, clipList.length]);

  const deleteClip = useCallback(
    (index: number) => {
      if (clipList.length <= 1) return;

      const newClips = clipList.filter((_, i) => i !== index);
      const reordered = newClips.map((clip, i) => ({ ...clip, order: i + 1 }));
      setClipList(reordered);

      if (index === currIdx && currIdx >= reordered.length) {
        setIdx(reordered.length - 1);
      } else if (index < currIdx) {
        setIdx(currIdx - 1);
      }
    },
    [clipList, currIdx]
  );

  const duplicateClip = useCallback(
    (index: number) => {
      const clipToDuplicate = clipList[index];
      const newClip: Clip = {
        ...clipToDuplicate,
        id: `${clipToDuplicate.id}-copy-${Date.now()}`,
        order: clipToDuplicate.order + 1,
        name: `${clipToDuplicate.name || "Clip"} (Copy)`,
      };

      const newClips = [...clipList];
      newClips.splice(index + 1, 0, newClip);

      const reordered = newClips.map((clip, i) => ({ ...clip, order: i + 1 }));
      setClipList(reordered);
    },
    [clipList]
  );

  // Clip functionality
  const startClipping = useCallback(() => {
    setClipMode(true);
    setClipStart(null);
    setClipEnd(null);
  }, []);

  const setClipPoint = useCallback((type: "start" | "end") => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    if (type === "start") {
      setClipStart(time);
    } else {
      setClipEnd(time);
    }
  }, []);

  const applyClip = useCallback(() => {
    if (clipStart === null || clipEnd === null || clipStart >= clipEnd) {
      alert("Please set valid start and end points for clipping");
      return;
    }

    const updatedClips = clipList.map((clip, index) => {
      if (index === currIdx) {
        return {
          ...clip,
          startTime: clipStart,
          endTime: clipEnd,
          duration: clipEnd - clipStart,
          name: `${clip.name} (Clipped)`,
        };
      }
      return clip;
    });

    setClipList(updatedClips);
    setClipMode(false);
    setClipStart(null);
    setClipEnd(null);
  }, [clipStart, clipEnd, clipList, currIdx]);

  // Stitch & Preview functionality
  const stitchAndPreview = useCallback(async () => {
    setIsProcessing(true);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real implementation, you would:
    // 1. Combine all clips into a single video
    // 2. Apply transitions, effects, etc.
    // 3. Generate a preview URL

    console.log("Stitching clips:", clipList);
    alert("Preview generated! (This is a simulation)");
    setIsProcessing(false);
  }, [clipList]);

  // Export functionality
  const exportVideo = useCallback(async () => {
    setIsProcessing(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // In a real implementation, you would:
    // 1. Process all clips according to timeline
    // 2. Apply effects, transitions, audio
    // 3. Encode to final format
    // 4. Provide download link

    console.log("Exporting video with clips:", clipList);
    alert("Video exported successfully! (This is a simulation)");
    setIsProcessing(false);
  }, [clipList]);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    dragStartIndex.current = index;
    setDraggedClip(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIndex.current = index;
  }, []);

  const handleDragLeave = useCallback(() => {
    dragOverIndex.current = null;
  }, []);

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const startIdx = dragStartIndex.current;
      if (startIdx === null || startIdx === index) return;

      const updated = [...clipList];
      const [removed] = updated.splice(startIdx, 1);
      updated.splice(index, 0, removed);

      const reordered = updated.map((clip, i) => ({ ...clip, order: i + 1 }));
      setClipList(reordered);

      if (startIdx === currIdx) {
        setIdx(index);
      } else if (startIdx < currIdx && index >= currIdx) {
        setIdx(currIdx - 1);
      } else if (startIdx > currIdx && index <= currIdx) {
        setIdx(currIdx + 1);
      }

      dragStartIndex.current = null;
      dragOverIndex.current = null;
      setDraggedClip(null);
    },
    [clipList, currIdx]
  );

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const timeline = timelineRef.current;
    if (!timeline || !timelineMap.total) return;

    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const targetTime = percent * timelineMap.total;

    const clipIndex = timelineMap.map.findIndex(
      (clip) => targetTime >= clip.start && targetTime <= clip.end
    );

    if (clipIndex !== -1) {
      setIdx(clipIndex);
      const video = videoRef.current;
      if (video) {
        const localTime = targetTime - timelineMap.map[clipIndex].start;
        video.currentTime = localTime;
      }
    }
  }, []);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip?.url) return;

    const handleLoadStart = () => setIsPlaying(false);
    const handleCanPlay = () => {
      if (isPlaying) {
        video.play().catch((error) => {
          console.log("Auto-play failed:", error);
          setIsPlaying(false);
        });
      }
    };

    const handleError = (e) => {
      console.error("Video error:", e);
      setIsPlaying(false);
    };

    video.src = currentClip.url;
    video.volume = isMuted ? 0 : volume;
    video.playbackRate = playbackRate;

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.load();

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [currIdx, currentClip?.url]);

  useEffect(() => {
    let animationId: number;
    const updatePlayhead = () => {
      const video = videoRef.current;
      if (!video || !currentClip?.duration) return;

      const localTime = video.currentTime;
      setCurrentTime(localTime);
      const globalOffset = timelineMap.map[currIdx]?.start ?? 0;
      const globalTime = globalOffset + localTime;
      const percent =
        timelineMap.total > 0 ? (globalTime / timelineMap.total) * 100 : 0;

      if (playheadRef.current) {
        playheadRef.current.style.left = `${Math.min(100, Math.max(0, percent))}%`;
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(updatePlayhead);
      }
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(updatePlayhead);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    currIdx,
    timelineMap.total,
    timelineMap.map,
    currentClip?.duration,
    isPlaying,
  ]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            goToPreviousClip();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            goToNextClip();
          }
          break;
        case "KeyM":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePlayPause, goToPreviousClip, goToNextClip, toggleMute]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Video Editor</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Keyboard shortcuts: Space - Play/Pause, Shift+Arrow - Navigate
            clips, M - Mute
          </span>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg mb-6">
        {!currentClip?.url ? (
          <div className="w-full h-96 flex items-center justify-center text-white bg-gray-800">
            <div className="text-center">
              <p className="text-lg mb-2">No video clip selected</p>
              <p className="text-sm text-gray-400">
                Please provide clips with valid URLs
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={currentClip.url}
              className="w-full h-96 object-contain"
              onEnded={handleEnded}
              onLoadedMetadata={(e) =>
                handleMetadataLoaded(e.currentTarget.duration)
              }
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                const localTime = video.currentTime;
                const clip = currentClip;

                // Check if endTime is set and enforce clip range
                if (clip?.endTime != null && localTime >= clip.endTime) {
                  video.pause();
                  setIsPlaying(false);
                  video.currentTime = clip.startTime ?? 0; // Reset if looping desired
                }

                setCurrentTime(localTime);
              }}
            />

            {/* Clipping Mode Overlay */}
            {clipMode && (
              <div className="absolute top-4 left-4 right-4 bg-blue-600/90 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Scissors className="w-5 h-5" />
                    <span className="font-medium">Clipping Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClipPoint("start")}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm"
                    >
                      Set Start{" "}
                      {clipStart !== null && `(${formatTime(clipStart)})`}
                    </button>
                    <button
                      onClick={() => setClipPoint("end")}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                    >
                      Set End {clipEnd !== null && `(${formatTime(clipEnd)})`}
                    </button>
                    <button
                      onClick={applyClip}
                      disabled={clipStart === null || clipEnd === null}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded text-sm"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setClipMode(false)}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousClip}
                disabled={currIdx === 0}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={goToNextClip}
                disabled={currIdx === clipList.length - 1}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Speed:</span>
                <select
                  value={playbackRate}
                  onChange={(e) =>
                    handlePlaybackRateChange(Number(e.target.value))
                  }
                  className="bg-white/20 rounded px-2 py-1 text-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-1">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20"
                />
              </div>

              <div className="text-sm">
                {formatTime(currentTime)} /{" "}
                {formatTime(currentClip?.duration ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Functionalities */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Video Editor Tools
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={startClipping}
            disabled={!currentClip?.url || clipMode}
            className="flex items-center gap-2 px-6 py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            <Scissors className="w-5 h-5" />
            {clipMode ? "Clipping..." : "Clip Video"}
          </button>

          <button
            onClick={stitchAndPreview}
            disabled={isProcessing || clipList.length < 2}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            <Video className="w-5 h-5" />
            {isProcessing ? "Processing..." : "Stitch & Preview"}
          </button>

          <button
            onClick={exportVideo}
            disabled={isProcessing || clipList.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            {isProcessing ? "Exporting..." : "Export Video"}
          </button>
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-600">Processing...</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-4 shadow-md mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Timeline</h3>
          <span className="text-sm text-gray-500">
            Total: {formatTime(timelineMap.total)}
          </span>
        </div>

        <div
          ref={timelineRef}
          className="relative border-2 border-gray-200 rounded bg-gray-50 overflow-x-auto h-24 cursor-pointer"
          onClick={handleTimelineClick}
        >
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-sm"
            style={{ left: "0%" }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
          </div>

          <div className="flex h-full items-center p-2">
            {timelineMap.map.map((clip, index) => {
              const width = Math.max(60, (clip.duration ?? 1) * 12);
              const isDragging = draggedClip === index;
              const isDropTarget = dragOverIndex.current === index;

              return (
                <div
                  key={clip.id}
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(index, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(index);
                  }}
                  className={`
                    relative group flex flex-col justify-center items-center border-2 mx-1 rounded-lg shadow-sm cursor-pointer transition-all duration-200
                    ${
                      index === currIdx
                        ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-400"
                        : "bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
                    }
                    ${isDragging ? "opacity-50 scale-95" : ""}
                    ${isDropTarget ? "ring-2 ring-yellow-400" : ""}
                  `}
                  style={{
                    width: `${width}px`,
                    height: "70px",
                    minWidth: "60px",
                  }}
                >
                  <div className="text-xs font-medium truncate px-1">
                    {clip.name || `Clip ${clip.order}`}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatTime(clip.duration ?? 0)}
                  </div>

                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateClip(index);
                      }}
                      className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs shadow-sm"
                      title="Duplicate clip"
                    >
                      <Plus size={10} />
                    </button>
                    {clipList.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(index);
                        }}
                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow-sm"
                        title="Delete clip"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            Playing: {currentClip?.name || `Clip ${currIdx + 1}`} of{" "}
            {clipList.length}
          </span>
          <span>Duration: {formatTime(currentClip?.duration ?? 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Drag clips to reorder • Click timeline to seek • Hover clips for
            actions
          </span>
        </div>
      </div>
    </div>
  );
}
