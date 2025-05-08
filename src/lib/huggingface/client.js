"use server";

import { fal } from "@fal-ai/client";

// Configure fal client with API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY
});

export async function processImage(imageFile, params = {}) {
  try {
    // Upload the image file to fal.ai storage
    const imageUrl = await fal.storage.upload(imageFile);

    // Merge default parameters with provided params
    const processParams = {
      prompt: params.prompt || "",
      negative_prompt: params.negativePrompt || "",
      image_url: imageUrl,
      image_size: {
        width: params.imageWidth || 1024,
        height: params.imageHeight || 1024
      },
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

    return result.data.images;
  } catch (error) {
    console.error("Error in processImage:", error);
    throw new Error(error.message || "Failed to process image");
  }
}