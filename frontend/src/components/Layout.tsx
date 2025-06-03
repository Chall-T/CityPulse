import React from 'react';
import NavBar from './NavBar';
import type { SafeUser } from '../types/user';

const Layout = ({ children, user }: { children: React.ReactNode, user: SafeUser | null }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main
        key={user ? "logged-in" : "logged-out"}
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;