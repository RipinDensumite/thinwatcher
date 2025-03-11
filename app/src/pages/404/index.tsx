import { useNavigate } from "react-router";

function WrongPage() {
  const navigate = useNavigate();

  return (
    <>
      <section className="bg-white min-h-[100dvh] flex items-center justify-center">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600">
              404
            </h1>
            <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl">
              Something's missing.
            </p>
            <p className="mb-4 text-lg font-light text-gray-500">
              Sorry, we can't find the page you are looking for.
            </p>
            <button
              onClick={() => navigate("/")}
              className="group relative inline-block text-sm font-medium text-white cursor-pointer focus:ring-3 focus:outline-hidden"
            >
              <span className="absolute inset-0 border border-slate-600"></span>
              <span className="block border border-slate-600 bg-slate-600 px-12 py-3 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                Back to watchers
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default WrongPage;
