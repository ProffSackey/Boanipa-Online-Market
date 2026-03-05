import React from 'react';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <p className="text-gray-600">Your inbox is currently empty. Check back later for any messages from support or sellers.</p>
      </div>
    </div>
  );
}
