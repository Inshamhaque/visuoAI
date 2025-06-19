import { useState } from "react";
import Functionalities from "./Functionalities";
import VideoPlayer from "./Player";
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
  // const [clips, onClipsChange] = useState(clips);
  return (
    <div>
      <VideoPlayer clips={clips} />
      {/* <Functionalities /> */}
    </div>
  );
}
