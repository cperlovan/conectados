import Image from "next/image";
import React from "react";
import Header from "./components/Header"
import Footer from "./components/Footer"
import center from "../public/image/edif.jpeg"

export default function Home() {
  return (
    <div>
      <Header />
      <div>
        <Image
          className="imacentral"
          src={center.src}
          alt="center"
          height={600}
          width={1700}
        />
      </div>
      <Footer />
    </div>
  );
}
