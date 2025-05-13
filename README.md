<div align ="center">

![logo](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20173931.png?alt=media&token=17f1e850-8e5b-4d3b-8c21-940fbbc4318c)
# One-Stop AI Creation Platform for E-commerce

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/Stripe-646EDE?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" />
  <img src="https://img.shields.io/badge/LLM-8A2BE2?style=for-the-badge" alt="LLM" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />

Designed for e-commerce sellers, our one-stop SaaS transforms every product into high-converting visuals - cutting costs, saving time, and increasing revenue with every click.

[Visit our website](https://lensfusionai.com)
</div>

# AI Tools
1. ### Background Generation  
   ![Background Generation](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20182730.png?alt=media&token=9fa8260f-eed9-40b0-b546-e996d4d1f443)

   Generates custom backgrounds for images using AI by simply input prompt

2. ### Object Retouch  
   ![Object Retouch](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20192137.png?alt=media&token=37eaf3a4-7a2b-42a5-9005-2c6a86f8ce9d)  

   Use mask system to tranform an object in the image

3. ### Object Removal  
   ![Object Removal](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-13%20024206.png?alt=media&token=56e9a248-9e86-4c5c-87ef-411c2c4937a8)

   Use mask system to remove any object in the image

4. ### Background Expansion  
   ![Background Expansion](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20203841.png?alt=media&token=28edde25-e4a9-4458-86c4-3b5a136bb90c) 

   Extends the background of an image to create a larger canvas with any ratios.

5. ### Background Removal  
   ![Background Removal](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20204248.png?alt=media&token=736ca26f-632f-4620-84aa-a2ebaef0e2b4)

   Isolates the subject by removing the background.

6. ### Upscale  
   ![Upscale](https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fgithub%2FScreenshot%202025-05-12%20205503.png?alt=media&token=9b15bc2b-f6fc-4967-8db4-0de6140192b2)

   Increases image resolution while preserving details, enhancing quality for larger displays.

# Setup 
This project is built using Next.js, a React framework for server-side rendering and static site generation. Follow the steps below to set up the project locally.
## Installation 
1. ### Clone the Repository
``` 
git clone https://github.com/HPhucNg/LensFusion-Web-UI.git
cd LensFusion-Web-UI
```
2. ### Install Dependencies
Using npm:
```
npm install
```
Using yarn:
```
yarn install
```
3. ### Environment Variables
Create a .env file in the root directory and add the necessary environment variables.
Follow .env.example to setup
```
#This is just an example, do not add your key here

# Firebase API
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# STRIPE API 
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_DOMAIN=

NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=
NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID=
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_LINK=
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_LINK=

NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK=
NEXT_PUBLIC_STRIPE_PRO_YEARLY_LINK=

NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID=
NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID=
NEXT_PUBLIC_STRIPE_EXPERTISE_MONTHLY_LINK=
NEXT_PUBLIC_STRIPE_EXPERTISE_YEARLY_LINK=

NEXT_PUBLIC_STRIPE_CREDIT_PURCHASE_PRICE_ID=
NEXT_PUBLIC_STRIPE_CREDIT_PURCHASE_LINK=

# Background Removal API, sign up at https://www.remove.bg/dashboard#api-key
REMOVE_BG_API_KEY=

# Upscale API, sign up at https://imggen.ai/app/manage-api
IMGGEN_API_KEY=


#Huggingface API 
HUGGING_FACE_TOKEN=
HF_ACCESS_TOKEN=

#Cloudflare local Captcha
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
```
4. ### Run the Development Server
Start the Next.js development server:
```
npm run dev
```
or with yarn:
```
yarn dev
```
# Contact

For questions, feedback, or support, reach out via:
- **Email**: phucnguyen0331@gmail.com
- **Linkined**: www.linkedin.com/in/phuc-h-nguyen0331
