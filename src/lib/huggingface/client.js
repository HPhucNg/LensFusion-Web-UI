"use server";
let Client;

async function getClient() {
  if (!Client) {
    const module = await import('@gradio/client');
    Client = module.Client;
  }
  return Client;
}

export async function processImage(imageFile, options = {}) {
  try {
    const ClientClass = await getClient();
    const client = await ClientClass.connect("lllyasviel/iclight-v2");

    const params = {
      bg_source: "Right Light",
      prompt: "professional advertising design of a product. natural lighting. a rustic barn in open fields in the background.",
      image_height: 1152,
      num_samples: 1,
      seed: Math.floor(Math.random() * 1000000),
      steps: 30,
      n_prompt: "low quality, out of frame, illustration, 3d, sepia, painting, cartoons, sketch, watermark, text, Logo, advertisement",
      cfg: 1,
      gs: 5,
      rs: 1,
      init_denoise: 0.999,
      ...options
    };

    const result = await client.predict("/process", {
      input_fg: imageFile,
      ...params
    });

    return result.data;
  } catch (error) {
    console.error("Error in processImage:", error);
    throw new Error(error.message || "Failed to process image");
  }
}