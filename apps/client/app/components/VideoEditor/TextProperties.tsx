"use client";

import { useState } from "react";
import { TextElement } from "../../types/types";
import { useAppDispatch, useAppSelector } from "../../store/index";
import { setTextElements } from "../../store/slices/projectSlice";
import toast from "react-hot-toast";

export default function TextProperties() {
  const dispatch = useAppDispatch();
  const { textElements } = useAppSelector((state) => state.projectState);

  const [textConfig, setTextConfig] = useState<Partial<TextElement>>({
    text: "Example",
    positionStart: 0,
    positionEnd: 10,
    x: 600,
    y: 500,
    fontSize: 200,
    font: "Arial",
    color: "#ff0000",
    backgroundColor: "transparent",
    align: "center",
    zIndex: 0,
    opacity: 100,
    rotation: 0,
    animation: "none",
  });

  const handleAddText = () => {
    const lastEnd =
      textElements.length > 0 ? Math.max(...textElements.map((f) => f.positionEnd)) : 0;

    const newTextElement: TextElement = {
      id: crypto.randomUUID(),
      text: textConfig.text || "",
      positionStart: textConfig.positionStart ?? lastEnd,
      positionEnd: textConfig.positionEnd ?? lastEnd + 10,
      x: textConfig.x ?? 0,
      y: textConfig.y ?? 0,
      width: textConfig.width ?? 300,
      height: textConfig.height ?? 100,
      font: textConfig.font ?? "Arial",
      fontSize: textConfig.fontSize ?? 24,
      color: textConfig.color ?? "#ffffff",
      backgroundColor: textConfig.backgroundColor ?? "transparent",
      align: textConfig.align ?? "center",
      zIndex: textConfig.zIndex ?? 0,
      opacity: textConfig.opacity ?? 100,
      rotation: textConfig.rotation ?? 0,
      fadeInDuration: textConfig.fadeInDuration ?? 0,
      fadeOutDuration: textConfig.fadeOutDuration ?? 0,
      animation: textConfig.animation ?? "none",
    };

    dispatch(setTextElements([...textElements, newTextElement]));
    toast.success("Text added successfully");

    // Reset form
    setTextConfig({
      text: "Example",
      positionStart: lastEnd + 10,
      positionEnd: lastEnd + 20,
      x: 500,
      y: 600,
      fontSize: 200,
      font: "Arial",
      color: "#ff0000",
      backgroundColor: "transparent",
      align: "center",
      zIndex: 0,
      opacity: 100,
      rotation: 0,
      animation: "none",
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-center z-50">
        <div className="p-6 rounded-lg w-96">
          <div className="space-y-8">
            <div>
              <label className="text-xl font-bold mb-2 text-white">Text Content</label>
              <textarea
                value={textConfig.text}
                onChange={(e) => setTextConfig({ ...textConfig, text: e.target.value })}
                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">Start Time (s)</label>
                <input
                  type="number"
                  value={textConfig.positionStart}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      positionStart: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">End Time (s)</label>
                <input
                  type="number"
                  value={textConfig.positionEnd}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      positionEnd: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">X Position</label>
                <input
                  type="number"
                  value={textConfig.x}
                  onChange={(e) => setTextConfig({ ...textConfig, x: Number(e.target.value) })}
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Y Position</label>
                <input
                  type="number"
                  value={textConfig.y}
                  onChange={(e) => setTextConfig({ ...textConfig, y: Number(e.target.value) })}
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">Font Size</label>
                <input
                  type="number"
                  value={textConfig.fontSize}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Z-Index</label>
                <input
                  type="number"
                  value={textConfig.zIndex}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      zIndex: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Font Type</label>
              <select
                value={textConfig.font}
                onChange={(e) => setTextConfig({ ...textConfig, font: e.target.value })}
                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 text-white rounded"
              >
                <option value="Arial">Arial</option>
                <option value="Inter">Inter</option>
                <option value="Lato">Lato</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-white">Text Color</label>
                <input
                  type="color"
                  value={textConfig.color}
                  onChange={(e) => setTextConfig({ ...textConfig, color: e.target.value })}
                  className="w-full h-10 p-1 bg-darkSurfacePrimary border border-white border-opacity-10 rounded"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddText}
                  className="px-4 py-2 bg-white text-black hover:bg-[#ccc] rounded"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
