import React from "react";
import Hero from "./Hero";
import EmailForm from "./EmailForm";

function LensFusion() {
  return (
    <main className="flex flex-row">
      <Hero>
        <EmailForm />
      </Hero>
    </main>
  );
}

export default LensFusion;
