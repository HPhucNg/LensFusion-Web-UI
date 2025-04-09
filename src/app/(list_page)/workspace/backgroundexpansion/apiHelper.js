"use server"; // server-side execution

import { Client, handle_file } from "@gradio/client";

// to generate an image
export const generateImage = async (params) => {
    try {
        // get parameters from the params object
        const { 
            image, 
            width, 
            height, 
            overlap_percentage, 
            num_inference_steps, 
            resize_option, 
            custom_resize_percentage, 
            prompt_input, 
            alignment, 
            overlap_left, 
            overlap_right, 
            overlap_top, 
            overlap_bottom 
        } = params;

        // parameters for debugging
        console.log("Calling generateImage with params:", params);

        // handle the image file using handle_file (from api_recorder - ensure the proper file handling for Gradio)
        const imageFile = handle_file(image);  // Assuming `image` is the file URL or file path

        const client = await Client.connect("fffiloni/diffusers-image-outpaint");

        // prediction request 
        const result = await client.predict("/infer", { 
            image: imageFile,  
            width: width,
            height: height,
            overlap_percentage: overlap_percentage,
            num_inference_steps: num_inference_steps,
            resize_option: resize_option,
            custom_resize_percentage: custom_resize_percentage,
            prompt_input: prompt_input,
            alignment: alignment,
            overlap_left: overlap_left,
            overlap_right: overlap_right,
            overlap_top: overlap_top,
            overlap_bottom: overlap_bottom
        });

        // result to debug
        console.log("Prediction result:", result);

        // check the returned structure - suppose to get two images
        if (result && result.data && result.data.length > 0) {
          // destructure both images from the nested array structure
          const [generatedImage1, generatedImage2] = result.data[0]; // one tuple
          
          // log and return both image URLs
          console.log("Generated Image 1:", generatedImage1);
          console.log("Generated Image 2:", generatedImage2);

          return { 
              image1_url: generatedImage1?.url || generatedImage1,
              image2_url: generatedImage2?.url || generatedImage2
          };
      }

        return null; // if result is not as expected
    } catch (error) {
        console.error("Error generating image:", error.message || error);
        return null;
    }
};
