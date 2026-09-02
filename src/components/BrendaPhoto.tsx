"use client";

import { useState } from "react";

export default function BrendaPhoto() {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return (
      <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-rose-200 bg-rose-100 text-4xl">
        🏡
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-rose-200 bg-rose-100">
      {/* Troque /public/brenda.jpg por uma foto real da Brenda */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brenda.jpg"
        alt="Brenda"
        className="h-full w-full object-cover"
        onError={() => setHidden(true)}
      />
    </div>
  );
}
