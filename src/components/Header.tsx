
import React from 'react';
import { Utensils } from 'lucide-react';

interface HeaderProps {
  showLogo?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showLogo = true }) => {
  return (
    <header className="w-full py-4">
      <div className="container mx-auto px-4 flex justify-center md:justify-between items-center">
        {showLogo && (
          <div className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-quickbite-purple" />
            <h1 className="text-2xl font-bold text-quickbite-black">
              Quick<span className="text-quickbite-purple">Bite</span>
            </h1>
          </div>
        )}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-quickbite-black hover:text-quickbite-purple transition-colors">Home</a>
          <a href="#" className="text-quickbite-black hover:text-quickbite-purple transition-colors">About</a>
          <a href="#" className="text-quickbite-black hover:text-quickbite-purple transition-colors">Contact</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
