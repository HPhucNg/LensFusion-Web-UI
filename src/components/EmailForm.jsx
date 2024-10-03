import React from "react";

function EmailForm() {
  return (
    <form className="flex gap-3 justify-center items-center mt-10 w-full max-w">
      <div className="flex flex-col w-half">
        <label htmlFor="emailInput" className="sr-only">
          Enter your email
        </label>
        <input
          id="emailInput"
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg border border-gray-300"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-gray-800 text-white rounded-lg"
      >
        Submit
      </button>
    </form>
  );
}

export default EmailForm;
