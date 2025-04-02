import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#FF6900] to-[#ff8533] shadow-md fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col items-center justify-center text-xs text-white">
          <p className="text-center">
            © {new Date().getFullYear()} RB First Connect. All rights reserved.
          </p>
          <p className="font-medium">
            Powered by PARTH
          </p>
        </div>
      </div>
    </footer>
  );
}