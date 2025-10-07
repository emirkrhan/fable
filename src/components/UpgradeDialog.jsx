'use client';

import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UpgradeDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg leading-none">Upgrade to Premium</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {/* Free Plan */}
          <div className="border border-border rounded-lg p-5 bg-card flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-5 flex-1">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Up to 3 boards</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>30 AI messages per day</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Basic collaboration</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Export to JSON</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-2 px-4 bg-muted text-muted-foreground rounded-md text-sm font-medium cursor-not-allowed border border-border"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-border rounded-lg p-5 bg-card flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">Premium</h3>
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <span className="text-white">★</span>
                  POPULAR
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">$7</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-5 flex-1">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited boards</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited AI messages</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Advanced collaboration</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Export to PDF</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Custom branding</span>
              </li>
            </ul>

            <button
              onClick={() => {
                // TODO: Implement payment flow
                alert('Payment integration coming soon!');
              }}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          All plans include core features: cards, connections, and real-time collaboration
        </p>
      </DialogContent>
    </Dialog>
  );
}
