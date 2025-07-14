"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import axios from "axios";
import FullScreenLoader from "./components/LoaderScreen";
import { toast, ToastContainer } from 'react-toastify';
import { BACKEND_URL } from "./lib/utils";
import { store, storeProject, useAppDispatch } from "./store";
import { ProjectState } from "./types/types";
import { addProject } from "./store/slices/projectsSlice";
import { useAppSelector } from "./store";
import { setFilesID, setMediaFiles, setTextElements } from "./store/slices/projectSlice";
import Image from "next/image";
import Screenshot from "@/assets/Screenshot_2025-07-10_at_2.25.40_AM-removebg-preview.png";
import { OverlaySidebar } from "./components/ui/Sidebar";
import { HomeHoverSidebar } from "./components/ui/HomeHoverSidebar";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState("");
  const dispatch = useAppDispatch();
  const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
  const [isSigned, setIsSigned] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // ✅ new state

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsSigned(true);
    }

    // ✅ Device detection
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android|iphone|ipad|iPod/i.test(userAgent.toLowerCase())) {
      setIsMobile(true);
    }
  }, []);

  const onClickHandler = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      const isToken = localStorage.getItem("token");
      if (!isToken) {
        router.push('/auth/signin');
        return;
      }
      localStorage.setItem("prompt", prompt);
      const response = await axios.post(
        `${BACKEND_URL}/animation/create`,
        { prompt },
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      const { animationId, videos, success } = response.data;
      if (response.data.status === 401) {
        return toast.error('Unauthorized user', { position: "top-right" });
      }
      if(response.data.status==411){
        return toast.error("Free Limit reached, Subscribe to continue",{
          position:"top-right"
        })
      }

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

      localStorage.setItem("projectId", animationId);
      await storeProject(newProject);
      dispatch(addProject(newProject));

      const updatedMedia = [];
      const updatedFiles = [...filesID || []];

      for (const video of videos) {
        const newID = crypto.randomUUID();
        try {
          updatedMedia.push(video);
          updatedFiles.push(newID);
        } catch (error) {
          console.error('Error storing video:', error);
        }
      }
      dispatch(setTextElements([]))
      dispatch(setMediaFiles(updatedMedia));
      dispatch(setFilesID(updatedFiles));
      toast.success('Media added successfully.');
      router.push(`/chat-editor/${encodeURIComponent(animationId)}`);
    } catch (error) {
      toast.error("Failed to create animation", { position: "top-right" });
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  // ✅ If mobile, return warning page
  if (isMobile) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-4 text-center space-y-6">
      <Image src={Screenshot} alt="Mobile Restriction" className="w-80 h-auto" />
      <p className="text-lg sm:text-2xl font-semibold max-w-md">
        ⚠️ This video editor is only available on desktop devices.<br />
        Please open this website on a PC or laptop for the best experience.
      </p>
    </div>
  );
}


  // ✅ Otherwise render full app
  return (
    <div className="flex justify-between min-h-screen bg-gradient-to-tr from-gray-800 to-black text-white flex flex-col items-center justify-center px-4 relative">
      {isSigned && <HomeHoverSidebar />}
      <div className="w-full flex items-center justify-between px-4 py-3 absolute top-0 left-0 z-50">
        <div className="flex items-center">
          <Image src={Screenshot} alt="Logo" className="h-20 w-auto" />
        </div>

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

      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4">
        What do you want to animate?
      </h1>
      <p className="text-center text-white/60 mb-6 max-w-2xl">
        Create educational animations by simply describing concepts. Great for
        explaining physics, math, coding, biology, or any idea visually.
      </p>
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
