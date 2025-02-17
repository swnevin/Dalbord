
import { useState, useEffect } from "react";

const MINIMUM_LOADING_TIME = 1000; // 1 second

export const useMinimumLoading = (isActuallyLoading: boolean) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isActuallyLoading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, MINIMUM_LOADING_TIME);

      return () => clearTimeout(timer);
    }
  }, [isActuallyLoading]);

  return isLoading;
};
