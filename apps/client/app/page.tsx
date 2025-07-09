"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import axios from "axios";
import FullScreenLoader from "./components/LoaderScreen";
import { toast, ToastContainer } from 'react-toastify'
import { BACKEND_URL } from "./lib/utils";
import { store, storeFile, storeProject, useAppDispatch } from "./store";
import { random, update } from "lodash";
import { ProjectState } from "./types/types";
import { addProject } from "./store/slices/projectsSlice";
import {  useAppSelector, getFile } from "./store";
import { setFilesID, setMediaFiles } from "./store/slices/projectSlice";
import Image from "next/image";
import Screenshot from "@/assets/Screenshot_2025-07-10_at_2.25.40_AM-removebg-preview.png"
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const dispatch = useAppDispatch();
  const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
  const [isSigned,seisSigned] = useState(false);
  useEffect(()=>{
    const token = localStorage.getItem("token");
    if(token){
      seisSigned(true);
    }
  },[])

  const onClickHandler = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      const isToken = localStorage.getItem("token");
      if(!isToken){
        router.push('/auth/signin');
        return;
      }
      localStorage.setItem("prompt", prompt);
      // TODO : Hardcoded authorization header on the client side
      const response = await axios.post(
        `${BACKEND_URL}/animation/create`,
        { prompt },
        {
          headers: {
            authorization:
              `Bearer ${localStorage.getItem('token')}`
          },
        }
      );
      const {animationId, videos, success } = response.data;
      if(response.data.status==401 || !success){
        return toast.error('Unauthorized user',{
          position:"top-right"
        })
      }
      // create an idb instance for the new project
      const newProject: ProjectState = {
            id: animationId,
            projectName: animationId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            mediaFiles: videos,
            textElements: [],
            currentTime: 0,
            isPlaying: false,
            isMuted: false,
            duration: 0,
            activeSection: 'media',
            activeElement: 'text',
            activeElementIndex: 0,
            filesID: [],
            zoomLevel: 1,
            timelineZoom: 100,
            enableMarkerTracking: true,
            resolution: { width: 1920, height: 1080 },
            fps: 30,
            aspectRatio: '16:9',
            history: [],
            future: [],
            exportSettings: {
                resolution: '1080p',
                quality: 'high',
                speed: 'fastest',
                fps: 30,
                format: 'mp4',
                includeSubtitles: false,
            },
        };
        // debug statement
        console.log(videos)
        localStorage.setItem("projectId",animationId);

        await storeProject(newProject);
        dispatch(addProject(newProject));
        // setNewProjectName('');
        // setIsCreating(false);
        // toast.success('Project created successfully');
      
        // set media files here simply update the existing media files, with the one recieved from the backend
        // also create the file db instance in the IDB

        const updatedMedia = [];
        const updatedFiles = [...filesID || []];

        // Process videos sequentially to avoid IndexedDB transaction conflicts
        for (const video of videos) {
          const newID = crypto.randomUUID();
          try {
            // await storeFile(video, newID);
            updatedMedia.push(video);
            updatedFiles.push(newID);
          } catch (error) {
            console.error('Error storing video:', error);
            // Continue with other videos even if one fails
          }
        }

        dispatch(setMediaFiles(updatedMedia));
        dispatch(setFilesID(updatedFiles));
        toast.success('Media added successfully.');
      router.push(`/chat-editor/${encodeURIComponent(animationId)}`);
    } catch (error) {
      toast.error("Failed to create animation:", {
        position:"top-right"
      });
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
      setPrompt("");
      // test
    }
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="flex justify-between min-h-screen bg-gradient-to-tr from-gray-800 to-black text-white flex flex-col items-center justify-center px-4 relative">
      <div className="w-full flex items-center justify-between px-4 py-3 absolute top-0 left-0 z-50">
        {/* Left: Logo or Image */}
        <div className="flex items-center">
          <Image src={Screenshot} alt="Logo" className="h-20 w-auto" />
        </div>

        {/* Right: Buttons */}
        <div className="flex gap-3">
          {!isSigned && (
            <button
              onClick={() => router.push('/auth/signin')}
              className="text-sm text-white/70 hover:text-white transition"
            >
              Sign In
            </button>
          )}
          {!isSigned && (
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded transition"
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4">
        What do you want to animate?
      </h1>
      {/* Subheading */}
      <p className="text-center text-white/60 mb-6 max-w-2xl">
        Create educational animations by simply describing concepts. Great for
        explaining physics, math, coding, biology, or any idea visually.
      </p>
      {/* Input Prompt */}
      <div className="flex bg-gray-800 rounded-lg w-full max-w-xl p-4 shadow-lg mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g. Show how gravity affects a falling object..."
          className="bg-transparent w-full text-white placeholder-white/50 p-3 rounded-md focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={onClickHandler}
          disabled={!prompt || loading}
          className="bg-blue-600 flex justify-center items-center p-3 rounded-xl ml-2 hover:bg-blue-700 transition disabled:opacity-50"
          aria-label="Submit Prompt"
        >
          <MoveRight size={18} />
        </button>
      </div>
      {/* Try Examples */}
      <p className="text-white/50 text-sm mb-4">Try an example</p>
      <div className="flex flex-wrap justify-center gap-3 text-sm text-white/70 mb-8">
        {[
          "Animate Pythagoras Theorem",
          "Visualize Merge Sort",
          "Show Solar System Model",
          "Explain Neural Networks",
        ].map((example, idx) => (
          <button
            key={idx}
            className="bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
            onClick={() => handleExampleClick(example)}
          >
            {example}
          </button>
        ))}
      </div>
      {loading && <FullScreenLoader message="Creating animation..." />}
      <ToastContainer />
    </div>
  );
}
