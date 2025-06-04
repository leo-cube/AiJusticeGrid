'use client';

import React from 'react';

export default function DegreeGuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50">
      {children}
    </div>
  );
}
