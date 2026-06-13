import { Toaster, toast } from "react-hot-toast";

export const ToastAlert = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        success: {
          style: {
            //background: "#d1e7dd",
            color: "#0f5132",
            border: "1px solid #badbcc",
          },
        },
        error: {
          style: {
            //background: "#f8d7da",
            color: "#842029",
            border: "1px solid #f5c2c7",
          },
        },
      }}
    />
  );
};

// Helper toast functions
export const showToast = (message, type = "success") => {
  if (!message) {
    return;
  }
  if (type === "error") {
    toast.error(message);
  } else {
    toast.success(message);
  }
};
