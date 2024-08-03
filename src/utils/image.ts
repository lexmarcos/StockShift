export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const fileType = file.type || "application/octet-stream";

    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result?.toString() || "";
      const base64WithType = base64.replace(
        "application/octet-stream",
        fileType
      );
      resolve(base64WithType);
    };
    reader.onerror = (error) => reject(error);
  });
};
