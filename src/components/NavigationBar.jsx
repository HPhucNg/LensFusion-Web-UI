import React from 'react';
import NavigationItem from './NavigationItem';
import AuthButtons from './AuthButtons';

const navigationItems = [
  { label: 'Home', isActive: true },
  { label: 'Explore', isActive: false },
  { label: 'Community', isActive: false },
  { label: 'Pricing', isActive: false },
  { label: 'About Us', isActive: false }
];

function NavigationBar() {
  return (
    <header className="flex overflow-hidden flex-wrap gap-6 items-center p-8 bg-white border-b border-zinc-300 max-md:px-5">
      <div className="flex gap-6 items-center self-stretch my-auto w-10">
        <div className="flex justify-center items-center self-stretch my-auto w-10">
          <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/ae2d83d4d3e8b13caf1a5b074e86f5725406e34effba8ffd87bfe5f0c8e7e457?placeholderIfAbsent=true&apiKey=fe8dbfae9d1d44f98f5fdb0d4432c30a" className="object-contain self-stretch my-auto w-6 aspect-[0.69]" alt="Company logo" />
        </div>
      </div>
      <nav className="flex flex-wrap flex-1 shrink gap-2 items-start self-stretch my-auto leading-none basis-0 font-[number:var(--sds-typography-body-font-weight-regular)] min-w-[240px] text-[color:var(--sds-color-text-default-default)] text-[length:var(--sds-typography-body-size-medium)] max-md:max-w-full">
        {navigationItems.map((item, index) => (
          <NavigationItem key={index} label={item.label} isActive={item.isActive} />
        ))}
      </nav>
      <AuthButtons />
    </header>
  );
}

export default NavigationBar;