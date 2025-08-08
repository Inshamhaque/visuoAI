"use client";
import { useParams } from "next/navigation";
import VideoEditor from "../../components/VideoEditor/main";
import ProtectedRoute from "../../ProtectedRoute";

export default function ChatEditorPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="bg-gray-800 h-screen text-white flex flex-col overflow-hidden">
      <div className="col-span-1 bg-gray-900 rounded-lg shadow-lg flex flex-col h-full">
        <ProtectedRoute>
          <VideoEditor params={{ id }} />
        </ProtectedRoute>
      </div>
    </div>
  );
}
