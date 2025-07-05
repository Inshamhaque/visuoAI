# 🎬 AniBot — AI-Powered Educational Animation Platform

**AniBot** is a next-gen educational content creation tool that blends AI chat interfaces with a professional-grade animation studio. Powered by [Manim](https://www.manim.community/), it allows educators, students, and developers to create animated videos for math, science, programming, and beyond — all in one powerful web interface.

---

## 🌟 Overview

AniBot is designed to:
- 🎓 Automate educational content generation
- ✨ Render Manim-powered math/science animations
- 🎬 Offer a professional video editing suite in the browser
- 🤖 Use AI chat to turn natural language into structured animations

---

## 🏗️ Architecture & Tech Stack

**Monorepo:** Managed with **Turborepo**  
**Language:** TypeScript  
**Client:** Next.js 15.3.3 with React 19.0.0  
**Server:** Node.js with Prisma ORM  
**Package Manager:** npm workspaces  

### 🔧 Technologies Used

```json
{
  "Frontend": ["Next.js", "React 19", "TypeScript 5"],
  "UI/UX": ["Tailwind CSS 4", "Framer Motion 12", "Lucide React"],
  "Video": ["Remotion 4", "@remotion/player", "Video.js 8"],
  "State": ["Redux Toolkit 2.8", "React Redux 9.2"],
  "Animation": ["Manim", "React Moveable"],
  "Database": ["Prisma ORM"],
  "Utilities": ["Axios", "Lodash", "IndexedDB", "React Hot Toast"]
}
````

---

## 🎥 Video Editing Features

### 🛠️ Professional Editor

* Multi-track timeline (drag, drop, position)
* Frame-accurate playback and scrubbing
* Real-time video preview

### 📁 Asset Management

* Media upload/import
* Dynamic text overlays
* Organized media library

### 🔄 Advanced Controls

* Playback shortcuts & speeds
* Real-time timeline seeking
* In-editor preview with live updates

---

## 🎨 Content Creation

* Text customization (font, size, color, effects)
* Video/image manipulation: scale, rotate, opacity
* Keyframe support
* Layer-based control system

---

## 📤 Export & Rendering

* Export in multiple formats and resolutions
* Remotion-powered React video rendering
* Batch export supported

---

## 🤖 AI Integration

### 💬 Smart Chat Interface

* Natural Language Processing (NLP)-powered educational assistant
* Seamlessly request animations or visualizations through simple prompts
* Currently supports single-prompt animation generation
* #Coming Soon: Multi-turn conversations and reprompting for iterative refinement

### 📐 Manim for Education

* Science/Math/Programming visual generation
* CLI or AI-assisted Manim script generation
* Auto-rendering via server-side pipeline (WIP)

---

## 🎓 Educational Use Cases

* Mathematics (algebra, calculus, geometry)
* Science (physics, chemistry, biology)
* Programming (data structures, flowcharts)
* Data visualization
* Engineering concepts

---

## 🔐 Authentication

* Email/password-based sign-up and login
* Protected routes & session-based access
* Persistent user state and access control

---

## ⚙️ Project Structure

```bash
AniBot/
├── apps/
│   ├── client/             # Frontend (Next.js)
│   │   └── app/
│   │       ├── auth/       # Auth pages
│   │       ├── chat-editor/
│   │       ├── components/
│   │       │   └── VideoEditor/
│   │       │       ├── AssetsPanel/
│   │       │       ├── Properties/
│   │       │       ├── timeline/
│   │       │       └── remotion/
│   │       └── store/     # Redux store
│   └── server/            # Backend API
│       ├── prisma/        # DB schema
│       └── src/           # Core logic
└── packages/              # Shared libs
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development
npm run dev

# 3. Build for production
npm run build

# 4. Run type check
npm run check-types
```

---

## 🧪 Features in Development

* 🔁 Collaborative Editing
* 🧠 Better AI-Manim translation
* ☁️ Cloud Rendering Support
* 🎞️ Advanced Animation Presets
* 📼 Export to GIF/MP4/WebM formats

---

## 🎯 Why AniBot?

* 🎓 **Built for Education**: Core focus on teaching/learning workflows
* 🤖 **AI-Native**: Use chat to automate complex tasks
* 🎬 **Pro-Grade Editor**: Full-featured, yet simple UX
* ⚡ **Powered by React/Remotion/Manim**: Best of both code and content worlds
* 💻 **Modern Dev Stack**: Latest TypeScript, Redux, Next.js 15, React 19

---

## 🤝 Contributing

We’re actively looking for contributors!
If you’re passionate about:

* ✨ Animations & visuals
* 🤖 AI + education
* ⚙️ Video editors
  …then join us in building AniBot 🚀


---

## 💬 Contact

* 🧠 Created by [Inshamul Haque](https://github.com/inshamhaque)
* 📬 Contact: [haqueinsham@gmail.com](mailto:haqueinsham@gmail.com)

---

> **AniBot** is redefining educational content creation — one animation at a time.

