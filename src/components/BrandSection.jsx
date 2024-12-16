import Image from 'next/image';

const brands = [
  {
    name: "Amazon",
    logo: "https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg",
  },
  {
    name: "TikTok",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg",
  },
  {
    name: "Etsy",
    logo: "https://www.vectorlogo.zone/logos/etsy/etsy-ar21.svg",
  },
  {
    name: "Shopify",
    logo: "https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg",
  },
  {
    name: "WooCommerce",
    logo: "https://www.svgrepo.com/show/354568/woocommerce.svg",
  },
  {
    name: "Shopee",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg",
  },
  {
    name: "ebay",
    logo: "https://www.vectorlogo.zone/logos/ebay/ebay-ar21.svg",
  },
];

export default function BrandSection() {
  return (
    
    <section className="bg-slate-200 w-full">
      <div className="container mx-auto px-4">
        {/* <h2 className="text-3xl md:text-2xl lg:text-4xl font-bold text-center text-black mb-1">Trusted by Industry Leaders</h2> */}
        <div className="relative flex overflow-hidden">
          <div className="animate-infinite-scroll flex">
            {/* First set of brands */}
            {brands.map((brand) => (
              <div key={brand.name} className="flex items-center justify-center mx-4 min-w-[200px]">
                <Image
                  src={brand.logo}
                  width={150}
                  height={50}
                  alt={`${brand.name} logo`}
                />
              </div>
            ))}
            {/* Duplicate set of brands for seamless loop */}
            {brands.map((brand) => (
              <div key={`${brand.name}-duplicate`} className="flex items-center justify-center mx-4 min-w-[200px]">
                <Image
                  src={brand.logo}
                  width={150}
                  height={50}
                  alt={`${brand.name} logo`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
