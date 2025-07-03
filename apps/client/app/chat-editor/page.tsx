"use client";
import { ArrowUp } from "lucide-react";
import Navbar from "../components/Navbar";
import React, { useState } from "react";
import VideoEditor from "../components/VideoEditor/main";

export default function ChatEditorPage() {
  // const messages = [
  //   {
  //     user:"hello",
  //     ai:"h1"
  //   }
  // ]
  
  return (
    <div className="bg-gray-800 h-screen text-white flex flex-col overflow-hidden">

      <div className="col-span-1 bg-gray-900 rounded-lg shadow-lg flex flex-col h-full">
          {/* Toolbar or header */}
          <VideoEditor />
        </div>
    </div>
  );
}
