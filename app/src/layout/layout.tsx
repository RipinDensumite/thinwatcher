export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[100dvh] bg-slate-200/70">
      <nav className="fixed z-10 top-0 left-0 py-4 rounded-md bg-white/30 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-60 w-full flex justify-center border-b-2 border-slate-300/50">
        <div className="flex items-center justify-center w-full">
          <h1 className="text-xl font-bold select-none">ThinWatcher</h1>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </section>
  );
}
