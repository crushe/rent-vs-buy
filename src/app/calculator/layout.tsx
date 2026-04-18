import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculator',
  description:
    'Run the rent vs buy comparison on your own numbers. House price, mortgage rate, rent, and assumptions you can adjust.',
  openGraph: {
    title: 'Rent vs Buy Calculator',
    description: 'Run the rent vs buy comparison on your own numbers.',
  },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
