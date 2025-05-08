"use server";

import { fal } from "@fal-ai/client";

// Configure fal client with API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY
});

export async function processImage(imageFile, params = {}) {
  try {
    // Upload the image file to fal.ai storage
    const uploadedImageUrl = await fal.storage.upload(imageFile);
    console.log("Uploaded image to fal.ai:", uploadedImageUrl);

    // Merge default parameters with provided params
    const processParams = {
      prompt: params.prompt || "",
      negative_prompt: params.negativePrompt || "",
      image_url: uploadedImageUrl,
      num_inference_steps: params.steps || 28,
      seed: params.seed ? parseInt(params.seed) : undefined,
      initial_latent: params.bgSource || "None",
      num_images: params.numSamples || 1,
      cfg: params.cfg || 1,
      guidance_scale: params.gs || 5,
      enable_hr_fix: true,
      lowres_denoise: 0.98,
      highres_denoise: 0.95,
      hr_downscale: 0.5,
      enable_safety_checker: true,
      output_format: "jpeg"
    };

    console.log("Sending request to fal.ai with params:", JSON.stringify(processParams));

    // Call the fal.ai API
    const result = await fal.subscribe("fal-ai/iclight-v2", {
      input: processParams,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("Raw fal.ai response:", JSON.stringify(result.data));
    
    if (!result.data || !result.data.images || !result.data.images.length) {
      throw new Error("No images returned from fal.ai");
    }

    // Transform the fal.ai response to match the expected structure from Hugging Face
    // Original expected structure:
    // [ [{ image: { url: "main-image-url" }}, { image: { url: "preprocessed-image-url" }}], { url: "webp-url" } ]
    
    const generatedImageUrl = result.data.images[0].url;
    console.log("Image URL from fal.ai:", generatedImageUrl);
    
    const transformedResponse = [
      // First array with main image and preprocessed image objects
      [
        {
          image: {
            url: generatedImageUrl,
            width: result.data.images[0].width,
            height: result.data.images[0].height
          }
        },
        {
          image: {
            // For the preprocessed image, just use the same image for now
            url: generatedImageUrl,
            width: result.data.images[0].width,
            height: result.data.images[0].height
          }
        }
      ],
      // WebP version (also using the same image since fal.ai doesn't provide different formats)
      {
        url: generatedImageUrl
      }
    ];

    console.log("Transformed response for ImageProcessor:", JSON.stringify(transformedResponse));
    return transformedResponse;
  } catch (error) {
    console.error("Error in processImage:", error);
    throw new Error(error.message || "Failed to process image");
  }
}