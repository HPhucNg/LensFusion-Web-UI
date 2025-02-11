"use server";
let Client;

async function getClient() {
  if (!Client) {
    const { Client: ImportedClient } = await import('@gradio/client');
    Client = ImportedClient;
  }
  return Client;
}

export async function processImage(imageFile, params = {}) {
  try {
    const ClientClass = await getClient();
    
    const client = await ClientClass.connect("lllyasviel/iclight-v2");

    // Merge default parameters with provided params
    const processParams = {
      bg_source: params.bgSource || "None",
      prompt: params.prompt || "",
      image_height: params.imageHeight || 1152,
      num_samples: params.numSamples || 1,
      seed: params.seed ? parseInt(params.seed) : Math.floor(Math.random() * 1000000),
      steps: params.steps || 40,
      n_prompt: params.negativePrompt || DEFAULT_PARAMS.negativePrompt,
      cfg: params.cfg || 1,
      gs: params.gs || 5,
      rs: params.rs || 1,
      init_denoise: params.initDenoise || 0.999
    };

    const result = await client.predict("/process", {
      input_fg: imageFile,
      ...processParams
    });

    return result.data;
  } catch (error) {
    console.error("Error in processImage:", error);
    throw new Error(error.message || "Failed to process image");
  }
}