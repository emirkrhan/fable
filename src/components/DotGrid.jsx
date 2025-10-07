'use client';

export default function DotGrid({ children }) {
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0',
        }}
      />
      {children}
    </div>
  );
}