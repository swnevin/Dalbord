
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loader = ({ className, size = "md" }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className="flex items-center justify-center">
      <img
        src="/lovable-uploads/f59d2e9a-80de-456b-bf9a-dd2bd0058c4b.png"
        alt="Dalai Loader"
        className={cn(
          "animate-[spin_3s_ease-in-out_infinite] animate-[pulse_2s_ease-in-out_infinite]",
          sizeClasses[size],
          className
        )}
        style={{
          animation: "loader 3s ease-in-out infinite"
        }}
      />
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
