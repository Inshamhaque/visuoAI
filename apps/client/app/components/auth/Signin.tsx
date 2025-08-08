"use client";
import { BackgroundBeams } from "../ui/background-beams";
import axios from "axios";
import { BACKEND_URL } from "@/app/lib/utils";
import { signininput } from "@/app/types/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SigninCard() {
  const router = useRouter();
  const onClickHandler = async (e: any) => {
    e.preventDefault();
    const res = await axios.post(
      `${BACKEND_URL}/user/signin`,
      {
        mail: input.mail,
        password: input.password,
      },
      {
        withCredentials: true,
      }
    );
    if (res.data.status == 200) {
      toast.success("Login Sucessful", {
        position: "top-right",
      });
      localStorage.setItem("token", res.data.token);
      // TODO: find a better way to direct user to the editor if they had entered the prompt and directed to signin page
      setTimeout(() => {
        router.push("/");
      }, 3000);
      // router.push('/chat-editor');
    } else if (res.data.status == 401) {
      toast.error("Invalid Credentials", {
        position: "top-right",
      });
    } else {
      toast.error("Failed to login. Try again later", {
        position: "top-right",
      });
    }
  };
  const [input, setinput] = useState<signininput>({
    mail: "",
    password: "",
  });
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <BackgroundBeams />

      <div className="relative z-10 w-full max-w-md bg-gray-800 text-white p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In to Anibot</h2>

        <form className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              onChange={(e) => {
                setinput({ ...input, mail: e.target.value });
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              onChange={(e) => {
                setinput({ ...input, password: e.target.value });
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right text-sm text-blue-500 hover:underline">
            <a href="#">Forgot password?</a>
          </div>

          {/* Submit Button */}
          <button
            onClick={onClickHandler}
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 text-sm text-center text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/signup" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
