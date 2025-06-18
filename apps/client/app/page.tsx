"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import axios from "axios";
import FullScreenLoader from "./components/LoaderScreen";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const onClickHandler = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      localStorage.setItem("prompt", prompt);
      // TODO : Hardcoded authorization header on the client side
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/animation/create`,
        { prompt },
        {
          headers: {
            authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOGE2NmVhYy1kYmIzLTRhMzUtOTJlNS03NjlhMmQwZDZiMTkiLCJpYXQiOjE3NDkzMjc3MTF9.8FqpvJ8Gyp0e52FMOFTEDrjyS94Z-9hTRRhrLGwnqmc",
          },
        }
      );

      const animationId = response.data.animationId;
      router.push(`/chat-editor?id=${encodeURIComponent(animationId)}`);
    } catch (error) {
      console.error("Failed to create animation:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="flex justify-between min-h-screen bg-gradient-to-tr from-gray-800 to-black text-white flex flex-col items-center justify-center px-4 relative">
      {/* Top Right Nav Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="text-sm text-white/70 hover:text-white">
          Sign In
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded">
          Get Started
        </button>
      </div>
      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4">
        What do you want to animate?
      </h1>
      {/* Subheading */}
      <p className="text-center text-white/60 mb-6 max-w-2xl">
        Create educational animations by simply describing concepts. Great for
        explaining physics, math, coding, biology, or any idea visually.
      </p>
      {/* Input Prompt */}
      <div className="flex bg-gray-800 rounded-lg w-full max-w-xl p-4 shadow-lg mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g. Show how gravity affects a falling object..."
          className="bg-transparent w-full text-white placeholder-white/50 p-3 rounded-md focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={onClickHandler}
          disabled={!prompt || loading}
          className="bg-blue-600 flex justify-center items-center p-3 rounded-xl ml-2 hover:bg-blue-700 transition disabled:opacity-50"
          aria-label="Submit Prompt"
        >
          <MoveRight size={18} />
        </button>
      </div>
      {/* Try Examples */}
      <p className="text-white/50 text-sm mb-4">Try an example</p>
      <div className="flex flex-wrap justify-center gap-3 text-sm text-white/70 mb-8">
        {[
          "Animate Pythagoras Theorem",
          "Visualize Merge Sort",
          "Show Solar System Model",
          "Explain Neural Networks",
        ].map((example, idx) => (
          <button
            key={idx}
            className="bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
            onClick={() => handleExampleClick(example)}
          >
            {example}
          </button>
        ))}
      </div>
      {loading && <FullScreenLoader message="Creating animation..." />}
    </div>
  );
}
