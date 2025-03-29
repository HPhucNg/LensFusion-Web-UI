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

    const HF_SPACE_NAME = "raynamaru/HD-Painter";
    const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
  
    const client = await ClientClass.connect(
      HF_SPACE_NAME,
      {
        hf_token: HF_TOKEN,
      }
    );
  
    const processParams = {
      model_name: params.model_name || "Dreamshaper Inpainting V8",
      use_rasg: params.use_rasg !== undefined ? params.use_rasg : true,
      use_painta: params.use_painta !== undefined ? params.use_painta : true,
      prompt: params.prompt || "",
      imageMask: params.imageMask || null,
      hr_image: imageFile,
      seed: params.seed ? parseInt(params.seed) : Math.floor(Math.random() * 1000000),
      eta: params.eta || 0.1,
      negative_prompt: params.negative_prompt || "text, bad anatomy, bad proportions, blurry, cropped, deformed, disfigured, duplicate, error, extra limbs, gross proportions, jpeg artifacts, long neck, low quality, lowres, malformed, morbid, mutated, mutilated, out of frame, ugly, worst quality",
      positive_prompt: params.positive_prompt || "Full HD, 4K, high quality, high resolution",
      ddim_steps: params.ddim_steps || 50,
      guidance_scale: params.guidance_scale || 7.5,
      batch_size: params.batch_size || 1,
      session_id: ""
    };

    const result = await client.predict(
      "/inpaint",
      processParams
    );
        
    return result.data;
  } catch (error) {
    console.error("Error in processImage:", error);
    throw new Error(error.message || "Failed to process image");
  }
}
