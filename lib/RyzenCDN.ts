export async function uploadToRyzenCDN(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://api.ryzumi.vip/api/uploader/ryzencdn", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.success && result.url) {
      return result.url;
    } else {
      console.error("RyzenCDN Upload Failed:", result);
      return null;
    }
  } catch (error) {
    console.error("Error uploading to RyzenCDN:", error);
    return null;
  }
}