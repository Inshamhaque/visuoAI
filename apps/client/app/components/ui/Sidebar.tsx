import React, { use, useEffect, useState } from 'react';
import { X, Menu, Home, User, Settings, Mail, Bell, Search } from 'lucide-react';
import { BACKEND_URL, cn } from '../../lib/utils';
import { Dispatch, SetStateAction } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { tree } from 'next/dist/build/templates/app-page';
import { useRouter } from 'next/navigation';
import { getProject, store, storeProject, useAppDispatch } from "../../store";
import { ProjectState } from "../../types/types";
import { addProject } from "../../store/slices/projectsSlice";
import { useAppSelector } from "../../store";
import { setFilesID, setMediaFiles, setTextElements } from "../../store/slices/projectSlice";


interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface OverlaySidebarProps {
  items?: SidebarItem[];
  className?: string;
  isOpen:boolean;
  setIsOpen:React.Dispatch<SetStateAction<boolean>>
}

const defaultItems: SidebarItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Mail, label: 'Messages', href: '/messages' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const OverlaySidebar: React.FC<OverlaySidebarProps> = ({ 
  items = defaultItems, 
  className,
  isOpen,
  setIsOpen 
}) => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { textElements } = useAppSelector((state) => state.projectState);
  
  useEffect(() => {
    const fetch = async () => {
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
      }
    };
    fetch();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleItemClick = async (item: any) => {
    // const newProject: ProjectState = {
    //         id: animationId,
    //         projectName: animationId,
    //         createdAt: new Date().toISOString(),
    //         lastModified: new Date().toISOString(),
    //         mediaFiles: videos,
    //         textElements: [],
    //         currentTime: 0,
    //         isPlaying: false,
    //         isMuted: false,
    //         duration: 0,
    //         activeSection: 'media',
    //         activeElement: 'text',
    //         activeElementIndex: 0,
    //         filesID: [],
    //         zoomLevel: 1,
    //         timelineZoom: 100,
    //         enableMarkerTracking: true,
    //         resolution: { width: 1920, height: 1080 },
    //         fps: 30,
    //         aspectRatio: '16:9',
    //         history: [],
    //         future: [],
    //         exportSettings: {
    //           resolution: '1080p',
    //           quality: 'high',
    //           speed: 'fastest',
    //           fps: 30,
    //           format: 'mp4',
    //           includeSubtitles: false,
    //         },
    //       };
    
          // localStorage.setItem("projectId", item.id);
          // await storeProject(newProject);
          // dispatch(addProject(newProject));

          const project = await getProject(item.id);
          const videos = project.mediaFiles;
    
          const updatedMedia = [];
          const updatedFiles = [];
          const updatedTextFiles = []
    
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
          // flow be like, we extract the textElements from the Idb istead of reduc reducers
          const projectId = localStorage.getItem("projectId")??""
          const projectStatus = await getProject(projectId);
          const { textElements } = projectStatus;
          dispatch(setTextElements(textElements));
          // console.log("project id:",projectId)
          // const projectState = await getProject(projectId);
          // console.log("project state",projectState)
          // dispatch(setTextElements([]))
          // console.log("current text elemnt before dispatch",textElements)
          // const textFiles = projectState.textElements;
          // console.log("after dispatch",textElements)
          // dispatch(setTextElements(textFiles));
                    
          // dispatch(setFilesID(updatedFiles));
          // toast.success('Media added successfully.');
          localStorage.setItem("projectId", item.id);
          setIsOpen(false);
          router.push(`/chat-editor/${item.id}`);
  };

  return (
    <div className="relative z-50">
      {/* Trigger Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 p-3 bg-white text-black shadow-lg rounded-full border border-gray-300 hover:bg-gray-100 transition-all duration-200 hover:scale-105",
          className
        )}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-slate-800/90 backdrop-blur-lg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-700",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <h2 className="text-xl font-bold text-white tracking-wide">🎬 Projects</h2>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {loading ? (
            <div className="text-white/70">Loading...</div>
          ) : (
            <nav className="space-y-3">
              {projects.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left bg-white/5 hover:bg-white/10 transition-all duration-200 text-white font-medium hover:scale-[1.02] focus:outline-none"
                >
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

