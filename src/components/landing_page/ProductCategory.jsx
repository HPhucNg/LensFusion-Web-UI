'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'skincare', label: 'Skincare' },
  { id: 'candles', label: 'Candles' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'bags', label: 'Bags' },
];

const productImages = {
  skincare: [
    { src: 'https://i.pinimg.com/736x/a1/df/51/a1df51fac9062fe1bd3a17d903f82184.jpg', alt: 'Skincare product 1' },
    { src: 'https://i.pinimg.com/736x/6b/01/8c/6b018c8c261160b888aead8a1c0453b3.jpg', alt: 'Skincare product 2' },
    { src: 'https://i.pinimg.com/236x/b7/08/f6/b708f6a333d1bb4d16a8085ebf1a6998.jpg', alt: 'Skincare product 3' },
    { src: 'https://i.pinimg.com/236x/6f/a0/7c/6fa07cddad364703667eb86f812a8980.jpg', alt: 'Skincare product 4' },
    { src: 'https://i.pinimg.com/236x/70/45/eb/7045eb0ff48efcb3a33a904a883f131b.jpg', alt: 'Skincare product 5' },
    { src: 'https://i.pinimg.com/236x/7d/28/97/7d289786594fb461191b6f914f083bb1.jpg', alt: 'Skincare product 6' },
    { src: 'https://i.pinimg.com/474x/69/35/04/6935047d21b1a952a0da74da5bb3f0d1.jpg', alt: 'Skincare product 7' },
    { src: 'https://i.pinimg.com/236x/5d/12/e4/5d12e446a2368c4a8aaf3695d74e6cbc.jpg', alt: 'Skincare product 8' },
  ],
  candles: [
    { src: "https://i.pinimg.com/736x/38/97/a8/3897a80273ee46dc8b0944e8a854e92e.jpg", alt: "Candle 1" },
    { src: "https://i.pinimg.com/736x/ad/7d/69/ad7d699e66dd0c4e0e0c1c3f4722873f.jpg", alt: "Candle 2" },
    { src: "https://i.pinimg.com/474x/3a/ca/ba/3acaba0dd23778da7e07bdc8c8b3a20b.jpg", alt: "Candle 3" },
    { src: "https://i.pinimg.com/236x/a3/31/8a/a3318a114ba4f71166f6d4d4b5ad5d6b.jpg", alt: "Candle 4" },
    { src: "https://i.pinimg.com/236x/c8/d1/0b/c8d10b5a89c5d182fffc951b5815eb6a.jpg", alt: "Candle 5" },
    { src: "https://i.pinimg.com/236x/80/aa/33/80aa33fe52dcc2d84d8ecf10ac3e9428.jpg", alt: "Candle 6" },
    { src: "https://i.pinimg.com/236x/d1/f3/0b/d1f30b830a52d47cd39a53f3e9c52a6d.jpg", alt: "Candle 7" },
    { src: "https://i.pinimg.com/236x/8e/71/e9/8e71e912db614cdd39e7ec4f697d095f.jpg", alt: "Candle 8" },
  ],
  furniture: [
    { src: "https://i.pinimg.com/236x/31/c5/00/31c5007c1a1bbbfa55a3e383853fcbe0.jpg", alt: "Furniture piece 1" },
    { src: "https://i.pinimg.com/236x/64/4c/5e/644c5eb408504bbb33a4d91d0f90ae1c.jpg", alt: "Furniture piece 2" },
    { src: "https://i.pinimg.com/236x/d4/be/88/d4be88f8315011e99d650602cb244c15.jpg", alt: "Furniture piece 3" },
    { src: "https://i.pinimg.com/236x/75/2a/03/752a032d07b1fe24dd1033fd5e9ac19c.jpg", alt: "Furniture piece 4" },
    { src: "https://i.pinimg.com/236x/4d/94/4e/4d944e6bfffe045096784ef472d7064b.jpg", alt: "Furniture piece 5" },
    { src: "https://i.pinimg.com/236x/c8/70/66/c8706682533a108329948d675faa5ea9.jpg", alt: "Furniture piece 6" },
    { src: "https://i.pinimg.com/236x/a1/40/9e/a1409ed8ca709c499adbde319d472b8b.jpg", alt: "Furniture piece 7" },
    { src: "https://i.pinimg.com/736x/1b/e6/e2/1be6e2106228e35bac2fb89b5087fb81.jpg", alt: "Furniture piece 8" },
  ],
  jewellery: [
    { src: "https://i.pinimg.com/474x/34/a4/ce/34a4ce1bcb30e759cc9712043878a78b.jpg", alt: "Jewellery item 1" },
    { src: "https://i.pinimg.com/236x/c3/1e/89/c31e89cd41b05a947ba345c3901b7c17.jpg", alt: "Jewellery item 2" },
    { src: "https://i.pinimg.com/236x/f8/02/f5/f802f534e706334bf65930d120bddfde.jpg", alt: "Jewellery item 3" },
    { src: "https://i.pinimg.com/236x/c9/2f/01/c92f01b342b9234aa72786a5a66c6136.jpg", alt: "Jewellery item 4" },
    { src: "https://i.pinimg.com/236x/2b/29/12/2b2912b369730c4225393db58ee4eb28.jpg", alt: "Jewellery item 5" },
    { src: "https://i.pinimg.com/236x/88/b1/c7/88b1c7de217112e097e4602ca7c8df56.jpg", alt: "Jewellery item 6" },
    { src: "https://i.pinimg.com/236x/c8/15/de/c815de2d083dfa705551d6202f9a4e57.jpg", alt: "Jewellery item 7" },
    { src: "https://i.pinimg.com/236x/88/37/05/883705e0b453d8d3deb712e876c97b0d.jpg", alt: "Jewellery item 8" },
  ],
  bags: [
    { src: "https://i.pinimg.com/236x/7a/73/ec/7a73ec06de2d7928e7b2277363216e18.jpg", alt: "Bag 1" },
    { src: "https://i.pinimg.com/236x/8d/01/5a/8d015ae8437e5d32fc7af5c4837121af.jpg", alt: "Bag 2" },
    { src: "https://i.pinimg.com/236x/10/35/c7/1035c768ee133389df33c641a9740626.jpg", alt: "Bag 3" },
    { src: "https://i.pinimg.com/236x/98/c0/51/98c051ab717e4e93db6dff989bb129a1.jpg", alt: "Bag 4" },
    { src: "https://i.pinimg.com/236x/33/25/86/3325863145bbf66552d9e1b78b5cec1a.jpg", alt: "Bag 5" },
    { src: "https://i.pinimg.com/236x/d4/60/33/d46033b5c697c66e4663333341328df8.jpg", alt: "Bag 6" },
    { src: "https://i.pinimg.com/236x/c1/b7/20/c1b720d96036e59ca78384db84b55e1e.jpg", alt: "Bag 7" },
    { src: "https://i.pinimg.com/736x/db/52/ad/db52ad62eebeb1fd6c5dcf542d227aa7.jpg", alt: "Bag 8" },
  ],
  
};

const ProductCategory = () => {
  const [selectedCategory, setSelectedCategory] = useState('skincare');

  return (
    <div className="px-4 mt-[-1rem] text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-2xl lg:text-5xl font-bold text-center mb-12">
          Beautiful product photography for every category
        </h2>

        <div className="flex justify-center mb-8">
          <div className="flex rounded-full bg-black/40 p-1">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-8 py-3 text-lg transition-all rounded-full relative',
                  selectedCategory === category.id
                    ? 'bg-[#EBDDF7] text-black'
                    : 'text-gray-400 hover:text-white',
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productImages[selectedCategory].map((image, index) => (
            <div key={index} className="aspect-square rounded-2xl overflow-hidden border border-white/20">
              <Image
                src={image.src}
                alt={image.alt}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out transform hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCategory;