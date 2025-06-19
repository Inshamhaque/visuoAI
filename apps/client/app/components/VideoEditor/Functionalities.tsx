import { Button } from "../ui/Button";
import { Scissors, Video, Download } from "lucide-react";

export default function Functionalities() {
  return (
    <div className="flex flex-wrap gap-4 justify-center p-4  rounded-2xl shadow-md">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => console.log("Clip video")}
      >
        <Scissors className="w-4 h-4" />
        Clip
      </Button>

      <Button
        variant="secondary"
        className="flex items-center gap-2"
        onClick={() => console.log("Stitch & preview")}
      >
        <Video className="w-4 h-4" />
        Stitch & Preview
      </Button>

      <Button
        variant="default"
        className="flex items-center gap-2"
        onClick={() => console.log("Exporting video")}
      >
        <Download className="w-4 h-4" />
        Export Video
      </Button>
    </div>
  );
}
