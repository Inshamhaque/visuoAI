"use client";
import { ArrowUp } from "lucide-react";
import Navbar from "../components/Navbar";
import React, { useState } from "react";

export default function ChatEditorPage() {
  // const messages = [
  //   {
  //     user:"hello",
  //     ai:"h1"
  //   }
  // ]
  const [messages, setMessages] = useState([
    {
      user: localStorage.getItem("prompt") || "",
      ai: "",
    },
  ]);
  return (
    <div className="bg-gray-800 h-screen text-white flex flex-col overflow-hidden">
      <Navbar />
      <div className="grid grid-cols-2 flex-1 h-full">
        {/* Left Chat Side */}
        <div className="col-span-1 bg-gray-900 flex flex-col h-full">
          {/* Messages scrollable container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900 rounded-t-lg flex flex-col">
            {messages.map((message, index) => {
              const isUser = Boolean(message.user);
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg text-white whitespace-pre-wrap ${
                      isUser
                        ? "bg-blue-600 rounded-br-none"
                        : "bg-green-600 rounded-bl-none"
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {isUser ? "User" : "AI"}
                    </div>
                    <div>{isUser ? message.user : message.ai}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input container */}
          <div className="p-4 pt-2 rounded-b-lg relative">
            <textarea
              className="w-full bg-gray-700 text-white p-3 rounded-xl resize-none pr-12"
              placeholder="Enter the prompt"
              rows={3}
            />
            <button
              type="button"
              className="absolute bg-white rounded-full bottom-6 right-6 text-black p-2 hover:bg-gray-400 transition"
              aria-label="Send"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>

        {/* Right Editor Side */}
        <div className="col-span-1 bg-gray-900 rounded-lg shadow-lg flex flex-col h-full">
          {/* Toolbar or header */}
          <div className="mb-4 text-white font-semibold text-lg select-none">
            Editor
          </div>

          {/* Editor text area */}
          <textarea
            className="flex-1 bg-gray-800 text-white p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your content here..."
          />

          {/* Optional footer buttons */}
          <div className="mt-4 flex justify-end space-x-3 select-none">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Save
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
