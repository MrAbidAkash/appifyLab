"use client";

import { Toaster } from "sonner";

export default function ToastClient() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "8px",
          padding: "12px 16px",
          fontWeight: "500",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        },
      }}
    />
  );
}
