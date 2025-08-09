import { getProject, storeProject, useAppSelector } from "@/app/store";
import {
  setMarkerTrack,
  setTextElements,
  setMediaFiles,
  setTimelineZoom,
  setCurrentTime,
  setIsPlaying,
  setActiveElement,
} from "@/app/store/slices/projectSlice";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import Header from "./Header";
import VideoTimeline from "./element-timeline/VideoTimeline";
import ImageTimeline from "./element-timeline/ImageTimeline";
import AudioTimeline from "./element-timeline/AudioTimeline";
import TextTimeline from "./element-timeline/TextTimeline";
import { throttle } from "lodash";
import GlobalKeyHandlerProps from "../Globalkeyhandler";
import { toast, ToastContainer } from "react-toastify";
export const Timeline = () => {
  const {
    currentTime,
    timelineZoom,
    enableMarkerTracking,
    activeElement,
    activeElementIndex,
    mediaFiles,
    textElements,
    duration,
    isPlaying,
  } = useAppSelector((state) => state.projectState);
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);

  const throttledZoom = useMemo(
    () =>
      throttle((value: number) => {
        dispatch(setTimelineZoom(value));
      }, 100),
    [dispatch]
  );

  const handleSplit = () => {
    let element = null;
    let elements = null;
    let setElements = null;

    if (!activeElement) {
      toast.error("No element selected.");
      return;
    }

    if (activeElement === "media") {
      elements = [...mediaFiles];
      element = elements[activeElementIndex];
      setElements = setMediaFiles;

      if (!element) {
        toast.error("No element selected.");
        return;
      }

      const { positionStart, positionEnd } = element;

      if (currentTime <= positionStart || currentTime >= positionEnd) {
        toast.error("Marker is outside the selected element bounds.");
        return;
      }

      const positionDuration = positionEnd - positionStart;

      // Media logic (uses startTime/endTime for trimming)
      const { startTime, endTime } = element;
      const sourceDuration = endTime - startTime;
      const ratio = (currentTime - positionStart) / positionDuration;
      const splitSourceOffset = startTime + ratio * sourceDuration;

      const firstPart = {
        ...element,
        id: crypto.randomUUID(),
        positionStart,
        positionEnd: currentTime,
        startTime,
        endTime: splitSourceOffset,
      };

      const secondPart = {
        ...element,
        id: crypto.randomUUID(),
        positionStart: currentTime,
        positionEnd,
        startTime: splitSourceOffset,
        endTime,
      };

      elements.splice(activeElementIndex, 1, firstPart, secondPart);
    } else if (activeElement === "text") {
      elements = [...textElements];
      element = elements[activeElementIndex];
      setElements = setTextElements;

      if (!element) {
        toast.error("No element selected.");
        return;
      }

      const { positionStart, positionEnd } = element;

      if (currentTime <= positionStart || currentTime >= positionEnd) {
        toast.error("Marker is outside the selected element.");
        return;
      }

      const firstPart = {
        ...element,
        id: crypto.randomUUID(),
        positionStart,
        positionEnd: currentTime,
      };

      const secondPart = {
        ...element,
        id: crypto.randomUUID(),
        positionStart: currentTime,
        positionEnd,
      };

      elements.splice(activeElementIndex, 1, firstPart, secondPart);
    }

    if (elements && setElements) {
      dispatch(setElements(elements as any));
      dispatch(setActiveElement(null));
      toast.success("Element split successfully.");
    }
  };

  const handleDuplicate = () => {
    let element = null;
    let elements = null;
    let setElements = null;

    if (activeElement === "media") {
      elements = [...mediaFiles];
      element = elements[activeElementIndex];
      setElements = setMediaFiles;
    } else if (activeElement === "text") {
      elements = [...textElements];
      element = elements[activeElementIndex];
      setElements = setTextElements;
    }

    if (!element) {
      toast.error("No element selected.");
      return;
    }

    const duplicatedElement = {
      ...element,
      id: crypto.randomUUID(),
    };

    if (elements) {
      elements.splice(activeElementIndex + 1, 0, duplicatedElement as any);
    }

    if (elements && setElements) {
      dispatch(setElements(elements as any));
      dispatch(setActiveElement(null));
      toast.success("Element duplicated successfully.");
    }
  };

  const handleDelete = () => {
    // @ts-ignore
    let element = null;
    let elements = null;
    let setElements = null;

    if (activeElement === "media") {
      elements = [...mediaFiles];
      element = elements[activeElementIndex];
      setElements = setMediaFiles;
    } else if (activeElement === "text") {
      elements = [...textElements];
      element = elements[activeElementIndex];
      setElements = setTextElements;
    }

    if (!element) {
      toast.error("No element selected.");
      return;
    }

    if (elements) {
      // @ts-ignore
      elements = elements.filter((ele) => ele.id !== element.id);
    }

    if (elements && setElements) {
      dispatch(setElements(elements as any));
      dispatch(setActiveElement(null));
      toast.success("Element deleted successfully.");
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    dispatch(setIsPlaying(false));
    const rect = timelineRef.current.getBoundingClientRect();

    const scrollOffset = timelineRef.current.scrollLeft;
    const offsetX = e.clientX - rect.left + scrollOffset;

    const seconds = offsetX / timelineZoom;
    const clampedTime = Math.max(0, Math.min(duration, seconds));

    dispatch(setCurrentTime(clampedTime));
  };

  const handleSave = async () => {
    // in this we shall save the state of all the media types
    const currentMediaFiles = [...mediaFiles];
    console.log(currentMediaFiles);
    const currentTextFiles = [...textElements];
    console.log(currentTextFiles);

    // now save here into the IDB project instance
    const projectId = localStorage.getItem("projectId") ?? "";
    const projectState = await getProject(projectId);
    console.log("earlier project State :", projectState);
    projectState.mediaFiles = currentMediaFiles;
    projectState.textElements = currentTextFiles;
    await storeProject(projectState);
    const newState = await getProject(projectId);
    console.log("new state is ", newState);
    toast.success("State saved Successfully");
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-row items-center justify-between gap-12 w-full">
        <div className="flex flex-row items-center gap-2">
          {/* Track Marker */}
          <button
            onClick={() => dispatch(setMarkerTrack(!enableMarkerTracking))}
            className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
          >
            {enableMarkerTracking ? (
              <Image
                alt="cut"
                className="h-auto w-auto max-w-[20px] max-h-[20px]"
                height={30}
                width={30}
                src="https://www.svgrepo.com/show/447546/yes-alt.svg"
              />
            ) : (
              <Image
                alt="cut"
                className="h-auto w-auto max-w-[20px] max-h-[20px]"
                height={30}
                width={30}
                src="https://www.svgrepo.com/show/447315/dismiss.svg"
              />
            )}
            <span className="ml-2">
              Track Marker <span className="text-xs">(T)</span>
            </span>
          </button>
          {/* Split */}
          <button
            onClick={handleSplit}
            className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
          >
            <Image
              alt="cut"
              className="h-auto w-auto max-w-[20px] max-h-[20px]"
              height={30}
              width={30}
              src="https://www.svgrepo.com/show/509075/cut.svg"
            />
            <span className="ml-2">
              Split <span className="text-xs">(S)</span>
            </span>
          </button>
          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
          >
            <Image
              alt="cut"
              className="h-auto w-auto max-w-[20px] max-h-[20px]"
              height={30}
              width={30}
              src="https://www.svgrepo.com/show/521623/duplicate.svg"
            />
            <span className="ml-2">
              Duplicate <span className="text-xs">(D)</span>
            </span>
          </button>
          {/* Delete */}
          <button
            onClick={handleDelete}
            className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
          >
            <Image
              alt="Delete"
              className="h-auto w-auto max-w-[20px] max-h-[20px]"
              height={30}
              width={30}
              src="https://www.svgrepo.com/show/511788/delete-1487.svg"
            />
            <span className="ml-2">
              Delete <span className="text-xs">(Del)</span>
            </span>
          </button>
          {/* Save State */}
          <button
            onClick={handleSave}
            className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-save-icon lucide-save"
            >
              <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
              <path d="M7 3v4a1 1 0 0 0 1 1h7" />
            </svg>
            <span className="ml-2">Save State</span>
          </button>
        </div>

        {/* Timeline Zoom */}
        <div className="flex flex-row justify-between items-center gap-2 mr-4">
          <label className="block text-sm mt-1 font-semibold text-white">Zoom</label>
          <span className="text-white text-lg">-</span>
          <input
            type="range"
            min={30}
            max={120}
            step="1"
            value={timelineZoom}
            onChange={(e) => throttledZoom(Number(e.target.value))}
            className="w-[100px] bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
          />
          <span className="text-white text-lg">+</span>
        </div>
      </div>

      <div
        className="relative overflow-x-auto w-full border-t border-gray-800 bg-[#1E1D21] z-10"
        ref={timelineRef}
        onClick={handleClick}
      >
        {/* Timeline Header */}
        <Header />

        <div
          className="bg-[#1E1D21]"
          style={{
            width: "100%" /* or whatever width your timeline requires */,
          }}
        >
          {/* Timeline cursor */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50"
            style={{
              left: `${currentTime * timelineZoom}px`,
            }}
          />
          {/* Timeline elements */}
          <div className="w-full">
            <div className="relative h-16 z-10">
              <VideoTimeline />
            </div>

            <div className="relative h-16 z-10">
              <AudioTimeline />
            </div>

            <div className="relative h-16 z-10">
              <ImageTimeline />
            </div>

            <div className="relative h-16 z-10">
              <TextTimeline />
            </div>
          </div>
        </div>
      </div>
      <GlobalKeyHandlerProps
        handleDuplicate={handleDuplicate}
        handleSplit={handleSplit}
        handleDelete={handleDelete}
      />
      <ToastContainer />
    </div>
  );
};

export default memo(Timeline);
