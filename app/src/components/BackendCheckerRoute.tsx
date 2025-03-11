import { useState, useEffect } from "react";
import PageLoadingComponent from "./PageLoadingComponent";

interface BackendCheckerRouteProps {
  children?: React.ReactNode;
}

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

const NoConnectionView = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        {/* <img
          src="/connection-error.svg"
          alt="Connection Error"
          className="w-64 h-64 mx-auto mb-6"
        /> */}
        <h1 className="font-bold text-3xl mb-4 text-gray-800">
          Unable to Connect to Backend
        </h1>
        <p className="text-gray-600 text-lg mb-2">
          We're having trouble connecting to our servers.
        </p>
        <p className="text-gray-600 mb-6">
          Please verify the backend URL and try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-ghost"
        >
          Refresh Page
        </button>
      </div>
    </section>
  );
};

const BackendCheckerRoute = ({ children }: BackendCheckerRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isConnect, setIsConnect] = useState(false);

  useEffect(() => {
    async function CheckBackendCon() {
      try {
        const response = await fetch(`${API_URL}/api/ctest`);

        if (response.status === 200) {
          setIsConnect(true);
        } else {
          setIsConnect(false);
        }
      } catch (err) {
        console.error(err);
        return false;
      } finally {
        setLoading(false);
      }
    }

    CheckBackendCon();
  }, []);

  // Show loading state while the connection is trying establish
  if (loading) {
    return <PageLoadingComponent />;
  }

  // If the connection establish, render them, otherwise render the outlet
  return isConnect ? <>{children}</> : <NoConnectionView />;
};

export default BackendCheckerRoute;
