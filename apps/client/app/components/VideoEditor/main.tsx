"use client";
import { useEffect, useRef, useState } from "react";
import { getFile, storeProject, useAppDispatch, useAppSelector } from "../../store/index";
import { getProject } from "../../store";
import { setCurrentProject, updateProject } from "../../store/slices/projectsSlice";
import { rehydrate, setMediaFiles } from '../../store/slices/projectSlice';
import { setActiveSection } from "../../store/slices/projectSlice";
import AddText from '../VideoEditor/AssetsPanel/tools-section/AddText';
// import AddMedia from '../../../components/editor/AssetsPanel/AddButtons/UploadMedia';
// import MediaList from '../../../components/editor/AssetsPanel/tools-section/MediaList';
import { useRouter } from 'next/navigation';
import TextButton from "../VideoEditor/AssetsPanel/SideButtons/TextButton";
// import LibraryButton from "@/app/components/editor/AssetsPanel/SidebarButtons/LibraryButton";
import ExportButton from "../VideoEditor/AssetsPanel/SideButtons/ExportButton";
import HomeButton from "../VideoEditor/AssetsPanel/SideButtons/HomeButton";
// import ShortcutsButton from "@/app/components/editor/AssetsPanel/SidebarButtons/ShortcutsButton";
import MediaProperties from "../VideoEditor/Properties/MediaProperties";
import TextProperties from "../VideoEditor/Properties/TextProperties"
import { Timeline } from "./timeline/Timeline";
import { PreviewPlayer } from "./Player";
import { MediaFile } from "@/app/types/types";
// import ExportList from "../../../components/editor/AssetsPanel/tools-section/ExportList";
import Image from "next/image";
import { HamburgerIcon } from "lucide-react";
import OverlaySidebar from "../ui/Sidebar";
// import ProjectName from "../../../components/editor/player/ProjectName";
export default function Project({ params }: { params: { id: string } }) {
    const { id } = params || "1234";
    const dispatch = useAppDispatch();
    const projectState = useAppSelector((state) => state.projectState);
    const { currentProjectId } = useAppSelector((state) => state.projects);
    const [isLoading, setIsLoading] = useState(false); // todo: fix this
    const [open,setIsOpen] = useState(false) 

    const router = useRouter();
    const { activeSection, activeElement } = projectState;
    // when page is loaded set the project id if it exists
    useEffect(() => {
        const loadProject = async () => {
            if (id) {
                setIsLoading(true);
                const project = await getProject(id);
                if (project) {
                    dispatch(setCurrentProject(id));
                    setIsLoading(false);
                } else {
                    router.push('/404');
                }
            }
        };
        loadProject();
    }, [id, dispatch]);

    // set project state from with the current project id
    useEffect(() => {
        const loadProject = async () => {
            if (currentProjectId) {
                const project = await getProject(currentProjectId);
                if (project) {
                    dispatch(rehydrate(project));

                    dispatch(setMediaFiles(await Promise.all(
                        project.mediaFiles.map(async (media: MediaFile) => {
                            const file = await getFile(media.fileId);
                            return { ...media, src: URL.createObjectURL(file) };
                        })
                    )));
                }
            }
        };
        loadProject();
    }, [dispatch, currentProjectId]);


    // save
    useEffect(() => {
        const saveProject = async () => {
            if (!projectState || projectState.id != currentProjectId) return;
            await storeProject(projectState);
            dispatch(updateProject(projectState));
        };
        saveProject();
    }, [projectState, dispatch]);


    const handleFocus = (section: "media" | "text" | "export") => {
        dispatch(setActiveSection(section));
    };

    return (
        <div className="flex flex-col h-screen select-none">
            <OverlaySidebar  isOpen={open} setIsOpen={setIsOpen}/>
            {/* Loading screen */}
            {
                isLoading ? (
                    <div className="fixed inset-0 flex items-center bg-black bg-opacity-50 justify-center z-50">
                        <div className="bg-black bg-opacity-70 p-6 rounded-lg flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-t-white border-r-white border-opacity-30 border-t-opacity-100 rounded-full animate-spin"></div>
                            <p className="mt-4 text-white text-lg">Loading project...</p>
                        </div>
                    </div>
                ) : null
            }
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Buttons */}
                <div className="flex-[0.1] min-w-[60px] max-w-[100px] border-r border-gray-700 overflow-y-auto p-4">
                    <div className="flex flex-col space-y-2">
                        <HomeButton />
                        <TextButton onClick={() => handleFocus("text")} />
                        {/* <LibraryButton onClick={() => handleFocus("media")} /> */}
                        <ExportButton onClick={() => handleFocus("export")} />
                            <div onClick={()=>{setIsOpen(true)
                            }} >
                                <HamburgerIcon  />
                            </div>
                        
                        
                    </div>
                </div>

                {/* Add media and text */}
                <div className="flex-[0.3] min-w-[200px] border-r border-gray-800 overflow-y-auto p-4">
                    {activeSection === "media" && (
                        <div>
                            <h2 className="text-lg flex flex-row gap-2 items-center justify-center font-semibold mb-2">
                                This is the media modal
                                {/* <AddMedia /> */}
                            </h2>
                            {/* <MediaList /> */}
                        </div>
                    )}
                    {activeSection === "text" && (
                        <div>
                          
                            <AddText />
                        </div>
                    )}
                    {/*  we dont need this */}
                    {activeSection === "export" && (
                        <div className="relative">
                            <h2 className="text-lg font-semibold mb-4">Export</h2>
                            <OverlaySidebar isOpen={open} setIsOpen={setIsOpen}/>
                            {/* <ExportList /> */}
                        </div>
                    )}
                </div>

                {/* Center - Video Preview */}
                <div className="flex items-center justify-center flex-col flex-[1] overflow-hidden">
                    {/* <ProjectName /> */}
                    <PreviewPlayer />
                </div>

                {/* Right Sidebar - Element Properties */}
                <div className="flex-[0.4] min-w-[200px] border-l border-gray-800 overflow-y-auto p-4">
                    {activeElement === "media" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Media Properties</h2>
                            Media properties section 
                            <MediaProperties />
                        </div>
                    )}
                    {activeElement === "text" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Text Properties</h2>
                            Text properties section
                            <TextProperties />
                        </div>
                    )}
                </div>
            </div>
            {/* Timeline at bottom */}
            <div className="flex flex-row border-t border-gray-500">
                <div className=" bg-darkSurfacePrimary flex flex-col items-center justify-center mt-20">

                    <div className="relative h-16">
                        <div className="flex items-center gap-2 p-4">
                            <Image
                                alt="Video"
                                className="invert h-auto w-auto max-w-[30px] max-h-[30px]"
                                height={30}
                                width={30}
                                src="https://www.svgrepo.com/show/532727/video.svg"
                            />
                        </div>
                    </div>

                    <div className="relative h-16">
                        <div className="flex items-center gap-2 p-4">
                            <Image
                                alt="Video"
                                className="invert h-auto w-auto max-w-[30px] max-h-[30px]"
                                height={30}
                                width={30}
                                src="https://www.svgrepo.com/show/532708/music.svg"
                            />
                        </div>
                    </div>

                    <div className="relative h-16">
                        <div className="flex items-center gap-2 p-4">
                            <Image
                                alt="Video"
                                className="invert h-auto w-auto max-w-[30px] max-h-[30px]"
                                height={30}
                                width={30}
                                src="https://www.svgrepo.com/show/535454/image.svg"
                            />
                        </div>
                    </div>

                    <div className="relative h-16">
                        <div className="flex items-center gap-2 p-4">
                            <Image
                                alt="Video"
                                className="invert h-auto w-auto max-w-[30px] max-h-[30px]"
                                height={30}
                                width={30}
                                src="https://www.svgrepo.com/show/535686/text.svg"
                            />
                        </div>
                    </div>
                </div>
                <Timeline />
            </div>
        </div >
    );
}
// 