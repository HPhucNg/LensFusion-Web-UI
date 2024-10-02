import React from "react";
import Hero from "./Hero";
import EmailForm from "./EmailForm";

function LensFusion() {
  return (
    <main className="flex flex-col">
      <Hero>
        <EmailForm />
      </Hero>
    </main>
  );
}

export default LensFusion;
