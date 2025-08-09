"use client";
import React, { useEffect, useState } from "react";
import { X, Menu, Home, User, Settings, Mail, Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { BACKEND_URL } from "@/app/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import { getProject, storeProject, useAppDispatch } from "@/app/store";
import { ProjectState } from "@/app/types/types";
import { addProject } from "@/app/store/slices/projectsSlice";
import { useAppSelector } from "@/app/store";
import { setFilesID, setMediaFiles, setTextElements } from "@/app/store/slices/projectSlice";


interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  chatId: string;
  aspectRatio: string;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  duration: number;
  currentTime: number;
  activeSection: string;
  activeElement: string | null;
  activeElementIndex: number;
  timelineZoom: number;
  zoomLevel: number;
  isPlaying: boolean;
  isMuted: boolean;
  enableMarkerTracking: boolean;
  exportSettings: {
    fps: number;
    speed: string;
    format: string;
    quality: string;
    resolution: string;
    includeSubtitles: boolean;
  };
  mediaFiles: any[];
  textElements: any[]; // Can replace `any` with a proper type if structure is known
  timelineItems: any[];
  history: any[];
  future: any[];
  createdAt: string; // ISO date string
  lastModified: string; // ISO date string
}




export const HomeHoverSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { textElements } = useAppSelector((state) => state.projectState);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/user/projects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.status == 411) {
          return toast.error("No projects are there", { position: "top-right" });
        }

        setProjects(response.data.projects);
        setLoading(false);
      } catch (e) {
        toast.error('Some error occurred while fetching projects', {
          position: "top-right",
        });
        setError(true);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Mouse hover detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 10) {
        setIsHovered(true);
      } else if (e.clientX > 320) { // Increased from 300 to 320 to match width
        setIsHovered(false);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleProjectClick = async (item: any) => {
    try {
      const project = await getProject(item.id);
      const videos = project.mediaFiles;

      const updatedMedia = [];
      const updatedFiles = [];

      for (const video of videos) {
        const newID = crypto.randomUUID();
        try {
          updatedMedia.push(video);
          updatedFiles.push(newID);
        } catch (error) {
          console.error('Error storing video:', error);
        }
      }

      dispatch(setMediaFiles(updatedMedia));
      
      // Extract text elements from the project
      const projectId = localStorage.getItem("projectId") ?? "";
      const projectStatus = await getProject(projectId);
      const { textElements } = projectStatus;
      dispatch(setTextElements(textElements));
      
      localStorage.setItem("projectId", item.id);
      setIsHovered(false); // Close sidebar after selection
      router.push(`/chat-editor/${item.id}`);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    }
  };

  const handleNavigationClick = (item: SidebarItem) => {
    if (item.href) {
      router.push(item.href);
      setIsHovered(false); // Close sidebar after navigation
    }
  };

  return (
    <div className="relative z-50">
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-slate-800/90 backdrop-blur-lg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-700",
          isHovered ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          
          <button
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            onClick={() => setIsHovered(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* Body - Scrollable Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* Projects Section */}
          <div className="mb-6">
            {loading ? (
              <div className="text-white/70 text-sm">Loading projects...</div>
            ) : error ? (
              <div className="text-red-400 text-sm">Failed to load projects</div>
            ) : projects.length === 0 ? (
              <div className="text-white/70 text-sm">No projects found</div>
            ) : (
              <nav className="space-y-2">
                {projects.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleProjectClick(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left bg-white/5 hover:bg-white/10 transition-all duration-200 text-white font-medium hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>

          
        </div>

        {/* Hover Instruction */}
        <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-400 text-center">
          Move mouse away to close
        </div>
      </div>
    </div>
  );
};