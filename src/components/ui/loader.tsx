
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const Loader = ({ className, size = "md", text }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className="flex flex-col items-center justify-center">
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
      {text && (
        <p className="mt-2 text-sm text-gray-500">{text}</p>
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
