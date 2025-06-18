"use client";

import { useState } from "react";

export function VideoLayer({ clips }: { clips: Clip[] }) {
  const [clipList, setClipList] = useState(
    [...clips].sort((a, b) => a.order - b.order)
  );

  const handleDragStart = (e: any, index: number) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e: any, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
    const updated = [...clipList];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setClipList(updated.map((clip, idx) => ({ ...clip, order: idx + 1 })));
  };

  const handleDragOver = (e: any) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  return (
    <div className="mt-6 flex gap-2">
      {clipList.map((clip, index) => (
        <div
          key={clip.url}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragOver={handleDragOver}
          className="cursor-move p-2 bg-gray-100 border border-gray-300 rounded shadow-sm w-[150px] text-xs text-center"
        >
          Clip {clip.order}
        </div>
      ))}
    </div>
  );
}
