import VideoPlayer from "./Player";
import { VideoLayer } from "./VideoLayer";
const clips = [
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    order: 1,
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    order: 2,
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    order: 3,
  },
];
export default function VideoEditor() {
  return (
    <div>
      <VideoPlayer clips={clips} />
      {/* <VideoLayer clips={clips} /> */}
    </div>
  );
}
