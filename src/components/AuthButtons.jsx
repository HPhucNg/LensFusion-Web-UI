import React from 'react';

function AuthButtons() {
  return (
    <div className="flex gap-3 items-center w-[200px]">
      <button className="flex-1 px-4 py-2 rounded-lg bg-neutral-200 border border-neutral-500 text-neutral-900 text-center">
        Sign in
      </button>
      <button className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-800 text-center">
        Register
      </button>
    </div>
  );
}

export default AuthButtons;
