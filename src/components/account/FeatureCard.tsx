"use client";

import React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div
      className="relative border-brutal border-3 border-brutal-black bg-cream p-4 text-center opacity-60 hover:opacity-80 transition-opacity"
      style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
    >
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <h4 className="text-lg font-bold text-brutal-black">{title}</h4>
      <p className="text-xs text-brutal-gray">{description}</p>
      <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center text-sm font-medium text-brutal-gray">
        Coming Soon
      </div>
    </div>
  );
}
