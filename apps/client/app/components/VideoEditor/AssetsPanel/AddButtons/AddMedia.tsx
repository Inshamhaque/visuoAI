import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { MediaFile } from "@/app/types/types";
import { MediaType } from "@/app/types/types";
import { setMediaFiles } from "@/app/store/slices/projectSlice";

export default function AddMedia() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { mediaFiles } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();

  const addMediaHandler = () => {
    if (!audioBase64 || !audioFile) return;
    
    // Later improvements : Add the sound recorder functionality... alongside the audio upload
    // we need to find the ending of the last audio file ... for now just add this
    const id = Math.random().toString();
    const newAudioFile: MediaFile = {
      id: id,
      fileName: audioFile.name, // Use actual file name
      fileId: id,
      type: 'audio',
      startTime: 0, // within the source video
      src: audioBase64, // Store base64 instead of blob URL
      endTime: 0 + (audioDuration ?? 0),
      positionStart: 0, // TODO : calculate this and find a way for this
      positionEnd: 0 + (audioDuration ?? 0),
      includeInMerge: true,
      playbackSpeed: 1,
      volume: 100,
      zIndex: 1,
    }
    const updatedMediaFiles = [...mediaFiles, newAudioFile];
    dispatch(setMediaFiles(updatedMediaFiles));
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("audio/")) {
      alert("Please select a valid audio file.");
      return;
    }

    setAudioFile(file);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      setAudioBase64(base64);
      
      // Get duration using base64 URL
      const audio = new Audio(base64);
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
      });
    } catch (error) {
      console.error('Error converting file to base64:', error);
      alert('Error processing audio file.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 rounded-md shadow-md">
      <h2 className="text-lg font-semibold mb-2 text-gray-300">Upload Audio</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="w-full mb-4 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {audioFile && audioBase64 && (
        <div className="bg-gray-100 p-3 rounded-md">
          <p className="text-sm text-gray-700"><strong>File:</strong> {audioFile.name}</p>
          {audioDuration && (
            <p className="text-sm text-gray-500"><strong>Duration:</strong> {audioDuration.toFixed(2)} sec</p>
          )}
          <audio controls className="mt-2 w-full rounded-md">
            <source src={audioBase64} type={audioFile.type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      <button 
        onClick={addMediaHandler} 
        disabled={!audioBase64}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Add Media
      </button>
    </div>
  );
}