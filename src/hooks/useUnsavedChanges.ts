import { useDraftStore } from "@/store/useDraftStore";
import { useEffect } from "react";

export const useUnsavedChanges = () => {
  const isDirty = useDraftStore((state) => state.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // 크롬 표준 동작
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
};
