"use client";

import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
        <p>You need to log in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
      <Navbar />
      <div className="flex flex-col justify-center items-center py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">Welcome, {user.name}</h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-32 h-32 rounded-full shadow-lg"
              />
            )}
            <div>
              <p className="text-lg mb-2">
                <strong>Name:</strong> {user.name}
              </p>
              <p className="text-lg mb-2">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-lg mb-2">
                <strong>Nickname:</strong> {user.nickname}
              </p>
              {user.updated_at && (
                <p className="text-lg">
                  <strong>Last Updated:</strong>{" "}
                  {new Date(user.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
