"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast",
          description: "toast-description",
          actionButton: "toast-action-button",
          cancelButton: "toast-cancel-button",
          closeButton: "toast-close-button",
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
        },
      }}
      style={
        {
          "--normal-bg": "#171717",
          "--normal-text": "#FAFAFA",
          "--normal-border": "#262626",
          "--border-radius": "4px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
