//import Script from 'next/script';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from 'react';
import PropTypes from 'prop-types';



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Condominium",
  description: "Sistema de control administrativo de condiminios",
};

export default function RootLayout({ children }) {
  RootLayout.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <html lang="en">
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      {/* <Script src="https://unpkg.com/flowbite@latest/dist/flowbite.js" strategy="afterInteractive" /> */}

        {children}
        
        
        
      </body>
      
    </html>
  );
}
