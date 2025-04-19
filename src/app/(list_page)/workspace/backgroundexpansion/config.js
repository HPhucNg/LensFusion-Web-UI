export const ratioSettings = {
    '9:16': { width: 720, height: 1280 },
    '16:9': { width: 1280, height: 720 },
    '1:1': { width: 1024, height: 1024 },
    'custom': { width: '', height: '' },
};

export const defaultParams = {
    width: 720, 
    height: 1280, 
    overlap_percentage: 10, 
    num_inference_steps: 8, 
    resize_option: "Full", 
    custom_resize_percentage: 50, 
    prompt_input: "", 
    alignment: "Middle", 
    overlap_left:true, 
    overlap_right: true, 
    overlap_top: true, 
    overlap_bottom: true, 
}