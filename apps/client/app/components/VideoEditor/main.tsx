import { FileUpIcon, FolderUpIcon, HomeIcon, LetterText, Text } from "lucide-react";
import { useState } from "react";
import TextProperties from "./TextProperties";
import { PreviewPlayer } from "./Player";

const clips = [
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    order: 1,
    duration: 30,
    id: "1",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    order: 2,
    duration: 90,
    id: "2",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    order: 3,
    duration: 120,
    id: "3",
  },
];

export default function VideoEditor() {
  const [active,setActive] = useState<"text"|"export">("text")
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <div className="flex flex-col gap-3 p-3 border-r border-gray-300 min-w-[60px]">
        <a href="/" className="p-2  inline-flex items-center justify-center rounded shadow-sm hover:bg-gray-200">
          <HomeIcon className="w-5 h-5" />
        </a>
        <button onClick={()=>{
          setActive("text")
        }} className="p-2 inline-flex items-center justify-center rounded shadow-sm hover:bg-gray-200">
          <LetterText className="w-5 h-5" />
        </button>
        <a href="/" className="p-2 inline-flex items-center justify-center rounded shadow-sm hover:bg-gray-200">
          <FolderUpIcon className="w-5 h-5" />
        </a>

      </div>
      <div className="flex flex-col">
        <div className="flex h-[60vh]">
          <div className="flex-[0.3] min-w-[300px] h-full text-white border-r border-gray-800 overflow-y-auto p-4">
              {active === "text" && (
                <div>
                  <TextProperties />
                </div>            
              )}          
          </div>
          <div className="flex items-center justify-center flex-col flex-[1] overflow-hidden">
            <PreviewPlayer/>
          </div>   
        </div>
        <div className="h-[40%]">
              this is the timeline part
        </div>
      </div>      
    </div>
  );
}
