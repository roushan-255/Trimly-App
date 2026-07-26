import { Brand } from './brand';

export function Footer() {
  return <footer className="border-t border-slate-200 bg-stone-50"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><div><Brand /><p className="mt-3 text-sm text-slate-500">Your next great haircut starts here.</p></div><p className="text-sm text-slate-500">© {new Date().getFullYear()} Trimly. Made for better barbering.</p></div></footer>;
}
