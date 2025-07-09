"use client";
import { getFile, getProject, useAppDispatch, useAppSelector } from "@/app/store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement } from "@/app/types/types";
import { useCurrentFrame } from "remotion";
import { useEffect, useRef } from "react";
import { setCurrentTime, setMediaFiles } from "@/app/store/slices/projectSlice";

const Composition = () => {
  const fps = 30;
  const frame = useCurrentFrame();
  const dispatch = useAppDispatch();

  const THRESHOLD = 0.1;
  const previousTime = useRef(0);

  useEffect(() => {
  //   const demoMediaFiles: MediaFile[] = [
  // {
  //   id: "video-1",
  //   fileName: "sample-video.mp4",
  //   fileId: "demo-file-1",
  //   type: "video",
  //   src: "https://decentralized-web2-quickpay.s3.ap-south-1.amazonaws.com/Anibot/addca3ee-369e-4f1b-978d-81a1b0058453/SolarSystemModel.mp4",
  //   startTime: 0,
  //   endTime: 10,
  //   positionStart: 0,
  //   positionEnd: 10,
  //   includeInMerge: true,
  //   playbackSpeed: 1,
  //   volume: 100,
  //   zIndex: 0,
  //   x: 0,
  //   y: 0,
  //   width: 1920,
  //   height: 1080,
  //   opacity: 100,
  //   rotation: 0,
  //   crop: {
  //     x: 0,
  //     y: 0,
  //     width: 960,
  //     height: 540,
  //   },
  // },]
  // dispatch(setMediaFiles(demoMediaFiles));
    const fetchVideos = async()=>{
      const id = localStorage.getItem("projectId")??""
      const preojectStatus = await getProject(id);
      // clear exisiting media files
      dispatch(setMediaFiles([]));
      const demoMediaFiles = projectState.mediaFiles;
      dispatch(setMediaFiles(demoMediaFiles));
    }
    fetchVideos();
  }, [dispatch]);

  const projectState = useAppSelector((state) => state.projectState);
  const { mediaFiles, textElements } = projectState;

  useEffect(() => {
    const currentTimeInSeconds = frame / fps;
    if (Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
      if (currentTimeInSeconds !== undefined) {
        dispatch(setCurrentTime(currentTimeInSeconds));
        previousTime.current = currentTimeInSeconds;
      }
    }
  }, [frame, dispatch, fps]);

  return (
    <>
      {Array.isArray(mediaFiles) &&
        mediaFiles.map((item: MediaFile) => {
          if (!item || !SequenceItem[item.type]) return null;
          return SequenceItem[item.type](item, { fps });
        })}

      {Array.isArray(textElements) &&
        textElements.map((item: TextElement) => {
          if (!item) return null;
          return SequenceItem["text"](item, { fps });
        })}
    </>
  );
};

export default Composition;
