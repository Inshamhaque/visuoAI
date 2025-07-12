import FullScreenLoader from "@/app/components/LoaderScreen";
import { BACKEND_URL } from "@/app/lib/utils";
import { getProject } from "@/app/store";
import axios from "axios";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function Export() {
  const [loading, setIsLoading] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoKey, setVideoKey] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    console.log("Loader state changed:", loading);
  }, [loading]);

  const uploadTos3 = (file:any)=>{
    // convert the src to binary to give a post request with id,src to the backend
  }

  const onClickHandler = async () => {
    const confirmed = confirm("Have you saved your project? Please confirm before exporting.");
    if (!confirmed) {
      toast.error("Please save your project before exporting.");
      return;
    }

    setIsLoading(true);
    try {
      const projectId = localStorage.getItem("projectId") ?? "";
      const projectState = await getProject(projectId);
      // TODO:
      // first we need to upload the audio files to the s3
      // create an array of audio files and then uplaod each audio file to s3 via axios, 
      // it return the s3 uri and then repalce the data uri with respeoctive s3 uri
      // then we can carry on with export functionality
      
      const response = await axios.post(`${BACKEND_URL}/processor/export`, {
        payload: projectState
      });

      if (response.data.success) {
        setVideoUrl(response.data.s3Url);
        setVideoKey(response.data.key);
        setShowVideoPopup(true);
        toast.success('Exported successfully!');
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to start export.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (videoUrl) {
      setDownloading(true);
      try {
        // Fetch the video as a blob
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'final.mp4'; // You can customize the filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        toast.success('Video downloaded successfully!');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download video. Please try again.');
      } finally {
        setDownloading(false);
      }
    }
  };

  const closePopup = () => {
    setShowVideoPopup(false);
    setVideoUrl("");
    setVideoKey("");
  };

  return (
    <>
      {loading && <FullScreenLoader />}
      
      <button className="px-2 py-3 rounded-md hover:cursor-pointer hover:bg-gray-400 bg-gray-300 text-gray-800" onClick={onClickHandler} disabled={loading}>
        Save & Export
      </button>

      {/* Video Popup Modal */}
      {showVideoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Export Complete!</h2>
              <button 
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <video 
                controls 
                className="w-full max-h-96 rounded"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={downloadVideo}
                disabled={downloading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded"
              >
                {downloading ? 'Downloading...' : 'Download Video'}
              </button>
              <button 
                onClick={closePopup}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}