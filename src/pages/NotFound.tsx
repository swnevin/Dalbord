
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 font-montserrat text-primary">404</h1>
        <p className="text-xl text-primary/80 font-poppins mb-4">Beklager! Siden du leter etter finnes ikke</p>
        <a href="/" className="text-secondary hover:text-secondary/90 underline font-poppins">
          Tilbake til forsiden
        </a>
      </div>
    </div>
  );
};

export default NotFound;
