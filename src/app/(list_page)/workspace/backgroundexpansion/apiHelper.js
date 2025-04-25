"use server"; // server-side execution
// initialize Client dynamically
let Client;
let handleFile;

async function getClient() {
  if (!Client) {
    const { Client: ImportedClient, handle_file } = await import("@gradio/client");
    Client = ImportedClient;
    handleFile = handle_file;
    // You can assign handle_file to a variable if you need it in the future
  }
  return {Client, handleFile};
}

// convert a blob to a base64 data URL using Node.js Buffer
async function blobToBase64(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    return `data:${blob.type};base64,${base64String}`;
  }

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

        // get the Client class
        const { Client: ClientClass, handleFile } = await getClient();

        const HF_SPACE_NAME = "hpng/diffusers-image-outpaint";
        const HF_TOKEN = process.env.HF_ACCESS_TOKEN;

        const client = await ClientClass.connect(
            HF_SPACE_NAME,
            {
                hf_token: HF_TOKEN,
            }
        );

         // handle the image file using handle_file (from api_recorder - ensure the proper file handling for Gradio)
        const imageFile = handleFile(image);  // `image` is the file URL or file path

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
        if (
            Array.isArray(result?.data) &&
            Array.isArray(result.data[0]) &&
            result.data[0].length >= 2
            ) {
            const getUrl = (item) =>
                typeof item === "object" && item?.url ? item.url : item;

            const image1_url = getUrl(result.data[0][0]);
            const image2_url = getUrl(result.data[0][1]);

            console.log("Generated Image 1:", image1_url);
            console.log("Generated Image 2:", image2_url);

            //return { image1_url, image2_url };

            // fetch the file from the remote URL include authorization header
            const response1 = await fetch(image1_url, {
                headers: { "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}` }
                });
            const response2 = await fetch(image2_url, {
                headers: { "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}` }
                });

            const blob1 = await response1.blob();
            const blob2 = await response2.blob();

            const base64Data1 = await blobToBase64(blob1);
            const base64Data2 = await blobToBase64(blob2);
      
            return { image1_base64: base64Data1, image2_base64: base64Data2 };


            }     
        return null; // if result is not as expected
    } catch (error) {
        console.error("Error generating image:", error.message || error);
        return null;
    }
};
