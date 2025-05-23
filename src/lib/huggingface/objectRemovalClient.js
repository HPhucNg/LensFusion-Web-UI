"use server";
let Client;

async function getClient() {
  if (!Client) {
    const { Client: ImportedClient } = await import('@gradio/client');
    Client = ImportedClient;
  }
  return Client;
}

// Convert base64 data URLs to File objects
async function dataURLToFile(dataURL, fileName) {
  const res = await fetch(dataURL);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
}
 
// convert a blob to a base64 data URL using Node.js Buffer
async function blobToBase64(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString('base64');
  return `data:${blob.type};base64,${base64String}`;
}

export async function removeObjectFromImage(imageData, options = {}) {
  try {
    const ClientClass = await getClient();
    const client = await ClientClass.connect("hpng/AttentiveEraser", {hf_token: process.env.HF_ACCESS_TOKEN});

    // Convert base64 images to File objects
    const backgroundFile = await dataURLToFile(imageData.background, "background.png");
    const layerFile = await dataURLToFile(imageData.layers[0], "layer_0.png");
    const compositeFile = await dataURLToFile(imageData.composite, "composite.png");

    const params = {
      rm_guidance_scale: 9,
      num_inference_steps: 50,
      seed: Math.floor(Math.random() * 1000000), // Random seed by default
      strength: 0.8,
      similarity_suppression_steps: 9,
      similarity_suppression_scale: 0.3,
      ...options
    };

    console.log("Sending image data to API...");
    
    // Format the payload exactly as the model expects
    const result = await client.predict(
      "/remove",
      {
        gradio_image: {
          background: backgroundFile,
          layers: [layerFile],
          composite: compositeFile
        },
        ...params
      }
    );

    console.log("API response received");
    
    // Extract the image URL from the nested array structure
    if (
      result &&
      Array.isArray(result.data) &&
      result.data[0] &&
      Array.isArray(result.data[0]) &&
      result.data[0][2] &&
      result.data[0][2].image &&
      result.data[0][2].image.url
    ) {
      const imageUrl = result.data[0][2].image.url;
      console.log("Extracted image URL:", imageUrl);
      
      // Fetch the file from the remote URL include authorization header
      const response = await fetch(imageUrl, {
        headers: { "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}` }
      });
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      
      return base64Data;
    } else {
      console.error("Unexpected response structure:", result);
      return null;
    }
  } catch (error) {
    console.error("Error in removeObjectFromImage:", error);
    throw new Error(error.message || "Failed to remove object from image");
  }
}
