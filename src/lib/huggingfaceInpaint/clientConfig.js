//client-side config
  export const defaultParams = {
    model_name: "Dreamshaper Inpainting V8",
    use_rasg: true,
    use_painta: true,
    prompt: "",
    imageMask: {
      "background": null,
      "layers": [],
      "composite": null 
    },
    hr_image: null, 
    seed: "",
    eta: 0.1,
    negative_prompt: "text, bad anatomy, bad proportions, blurry, cropped, deformed, disfigured, duplicate, error, extra limbs, gross proportions, jpeg artifacts, long neck, low quality, lowres, malformed, morbid, mutated, mutilated, out of frame, ugly, worst quality",
    positive_prompt: "Full HD, 4K, high quality, high resolution",
    ddim_steps: 70,
    guidance_scale: 7.5,
    batch_size: 1,
    session_id: ""
  };