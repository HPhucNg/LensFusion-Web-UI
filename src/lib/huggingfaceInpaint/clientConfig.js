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
    ddim_steps: 50,
    guidance_scale: 7.5,
    batch_size: 1,
    session_id: ""
  };
  
  export const parameterDefinitions = [
    {
      id: "diffusionSteps",
      label: "Diffusion Steps",
      type: "select",
      options: [
        { value: 50, label: "Balanced - 50" },
        { value: 70, label: "High Quality - 70" }
      ],
      defaultValue: defaultParams.ddim_steps
    },
    {
      id: "seed",
      label: "Seed",
      type: "text",
      placeholder: "49123",
      defaultValue: "49123"
    },
    {
      id: "positivePrompt",
      label: "Positive Prompt",
      type: "text",
      defaultValue: defaultParams.positive_prompt
    },
    {
      id: "negativePrompt",
      label: "Negative Prompt",
      type: "text",
      defaultValue: defaultParams.negative_prompt
    }
  ];