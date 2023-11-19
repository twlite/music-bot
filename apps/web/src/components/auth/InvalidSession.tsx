import React from 'react';

export function InvalidSession() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-background">
      <p className="text-lg text-foreground">Invalid session</p>
    </div>
  );
}
