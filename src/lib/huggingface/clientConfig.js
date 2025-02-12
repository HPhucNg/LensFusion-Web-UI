// This file contains client-side configurations and doesn't use "use server"
export const defaultParams = {
    bgSource: "None",
    prompt: "",
    imageHeight: 1152,
    numSamples: 1,
    seed: "",
    steps: 30,
    negativePrompt: "watermark, text, Logo, wrong color",
    cfg: 1,
    gs: 5,
    rs: 1,
    initDenoise: 0.999
  };
  
  export const parameterDefinitions = [
    {
      id: "prompt",
      label: "Positive Prompt",
      type: "text",
      placeholder: "Describe what you want to generate...",
      defaultValue: defaultParams.prompt
    },
    {
      id: "negativePrompt",
      label: "Negative Prompt",
      type: "text",
      placeholder: "Describe what you want to avoid...",
      defaultValue: defaultParams.negativePrompt
    },
    {
      id: "imageHeight",
      label: "Image Size",
      type: "select",
      options: [
        { value: 512, label: "512 x 512" },
        { value: 768, label: "768 x 768" },
        { value: 1024, label: "1024 x 1024" },
        { value: 1152, label: "1152 x 1152" }
      ],
      defaultValue: defaultParams.imageHeight
    },
    {
      id: "steps",
      label: "Quality Steps",
      type: "select",
      options: [
        { value: 30, label: "Balanced" },
        { value: 40, label: "High Quality" }
      ],
      defaultValue: defaultParams.steps
    },
    {
        id: "seed",
        label: "Seed",
        type: "text",
        placeholder: "12345",
        defaultValue: "12345"  // Set default value to 12345
    }
  ];