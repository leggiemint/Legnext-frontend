"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar = ({ src, name, email, size = "md", className = "" }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Size configurations
  const sizeConfig = {
    sm: { wrapper: "w-8 h-8", text: "text-xs", image: 32 },
    md: { wrapper: "w-10 h-10", text: "text-sm", image: 40 },
    lg: { wrapper: "w-12 h-12", text: "text-base", image: 48 },
  };

  const config = sizeConfig[size];

  // Generate initials from name or email
  const getInitials = () => {
    if (name?.trim()) {
      return name.charAt(0).toUpperCase();
    }
    if (email?.trim()) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Generate background color based on name/email
  const getBackgroundColor = () => {
    const colors = [
      "bg-purple-600",
      "bg-blue-600", 
      "bg-green-600",
      "bg-yellow-600",
      "bg-red-600",
      "bg-indigo-600",
      "bg-pink-600",
      "bg-teal-600"
    ];
    
    const seed = name || email || "default";
    const index = seed.length % colors.length;
    return colors[index];
  };

  const shouldShowImage = src && src.trim() !== "" && !imageError;

  return (
    <div className={`${config.wrapper} rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {shouldShowImage ? (
        <div className="relative w-full h-full">
          <Image
            src={src}
            alt={name || email || "User avatar"}
            width={config.image}
            height={config.image}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            priority={size === "lg"}
          />
          {imageLoading && (
            <div className={`absolute inset-0 ${getBackgroundColor()} flex items-center justify-center`}>
              <span className={`text-white font-medium ${config.text}`}>
                {getInitials()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full h-full ${getBackgroundColor()} flex items-center justify-center`}>
          <span className={`text-white font-medium ${config.text}`}>
            {getInitials()}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;