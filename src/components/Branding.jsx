import React from "react";
import Link from "next/link";
import Image from "next/image";

function Branding() {
  return (
    <Link 
      className="flex items-center space-x-2"
      href="/" 
    >
      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12">
        <Image
          src="/icon.ico"
          alt="Brand Logo"
          width={32}
          height={32}
          className="object-contain w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 transform scale-100"
        />  
      </div>
      <span className="font-semibold italic text-xl md:text-2xl lg:text-2xl">
        LensFusion
      </span>
    </Link>
  );
}

export default Branding;
