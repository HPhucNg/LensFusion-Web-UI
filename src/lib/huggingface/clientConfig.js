// This file contains client-side configurations and doesn't use "use server"
export const defaultParams = {
    bgSource: "None",
    prompt: "",
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
        id: "seed",
        label: "Seed",
        type: "text",
        placeholder: "12345",
        defaultValue: "12345"  // Set default value to 12345
    }
  ];