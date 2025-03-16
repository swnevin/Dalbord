
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  duration?: number; // in milliseconds
  value?: number; // If provided, uses external progress value instead of animation
}

export const Loader = ({ 
  className, 
  size = "md", 
  showProgress = true,
  duration = 3000,
  value
}: LoaderProps) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (value !== undefined) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min(Math.floor((elapsedTime / duration) * 100), 99);
      setProgress(newProgress);
      
      if (elapsedTime >= duration) {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [duration, value]);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  const progressValue = value !== undefined ? value : progress;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <img
        src="/lovable-uploads/f59d2e9a-80de-456b-bf9a-dd2bd0058c4b.png"
        alt="Dalai Loader"
        className={cn(
          "animate-pulse",
          sizeClasses[size],
          className
        )}
        style={{
          animation: "loader 3s ease-in-out infinite"
        }}
      />
      {showProgress && (
        <div className="w-full max-w-32 flex flex-col items-center">
          <Progress value={progressValue} className="h-1.5" />
          <span className="text-xs text-muted-foreground mt-1">{progressValue}%</span>
        </div>
      )}
      <style>{`
        @keyframes loader {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            transform: rotate(0deg) scale(1);
          }
          75% {
            transform: rotate(-90deg) scale(1.1);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
