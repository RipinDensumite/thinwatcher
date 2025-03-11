import { useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import Layout from "@/layout/layout";
import { UserRound, WifiOff, Wifi, Trash2, Computer } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AuthContext } from "@/context/AuthContext";

interface Session {
  ID: string;
  User: string;
  State: string;
}

interface ClientStatus {
  isOnline: boolean;
  users: string[];
  sessions: Session[];
  lastUpdated: Date;
}

interface Client {
  clientId: string;
  status: ClientStatus;
}

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export default function HomePage() {
  const isMobile = useMediaQuery("only screen and (max-width : 768px)");
  const [clients, setClients] = useState<Client[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, token } = useContext(AuthContext);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`, {
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClients(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setError("Failed to fetch initial data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const deleteClient = async (clientId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": import.meta.env.VITE_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
      setError("Failed to delete client. Please try again.");
    }
  };

  // Socket connection
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      upgrade: false,
      reconnectionAttempts: 5,
      withCredentials: true,
      query: {
        apiKey: import.meta.env.VITE_API_KEY,
      },
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setError("Connection lost. Attempting to reconnect...");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError(`Connection error: ${error.message}`);
    });

    // Initial data from socket
    newSocket.on("initial-data", (data: [string, ClientStatus][]) => {
      const formattedData = data.map(([clientId, status]) => ({
        clientId,
        status,
      }));
      setClients(formattedData);
    });

    // Updates
    newSocket.on(
      "update",
      ({ clientId, status }: { clientId: string; status: ClientStatus }) => {
        setClients((prev) => {
          const clientIndex = prev.findIndex(
            (client) => client.clientId === clientId
          );
          if (clientIndex === -1) {
            // New client
            return [...prev, { clientId, status }];
          }
          // Update existing client
          const newClients = [...prev];
          newClients[clientIndex] = { clientId, status };
          return newClients;
        });
      }
    );

    // Delete client
    newSocket.on("client-removed", (clientId: string) => {
      setClients((prev) =>
        prev.filter((client) => client.clientId !== clientId)
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Loader component
  const Loader = () => (
    <div className="flex justify-center items-center h-64">
      <span className="loading loading-spinner loading-xl"></span>
    </div>
  );

  // Status badge component
  const StatusBadge = ({ isOnline }: { isOnline: boolean }) =>
    isOnline ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all duration-300 ease-in-out">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        Healthy
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-all duration-300 ease-in-out">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
        Unhealthy
      </span>
    );

  // Connection status component
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 transition-all duration-300 ease-in-out">
      {isConnected ? (
        <span className="text-emerald-600 flex items-center gap-2 font-medium">
          <Wifi className="h-4 w-4" />
          Connected
        </span>
      ) : (
        <span className="text-red-600 flex items-center gap-2 font-medium">
          <WifiOff className="h-4 w-4" />
          Disconnected
        </span>
      )}
    </div>
  );

  // Error alert component
  const ErrorAlert = () =>
    error && (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm mb-6 animate-fadeIn transition-all duration-300 ease-in-out">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );

  // Empty state component
  const EmptyState = () =>
    clients.length === 0 &&
    !error && (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
        <Computer className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No clients connected
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Waiting for thin clients to connect to the system.
        </p>
      </div>
    );

  // Mobile view
  if (isMobile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl overflow-x-auto">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-0 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-slate-500 p-2 rounded-lg shadow-lg">
                  <Computer className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">ThinClient</h1>
                <div className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {clients.length}
                </div>
              </div>
              <ConnectionStatus />
            </div>

            <ErrorAlert />
            <EmptyState />
          </div>

          {!isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {clients.map((client) => (
                <div
                  key={client.clientId}
                  className="bg-white rounded-xl shadow-sm overflow-auto min-w-fit border border-gray-100 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-1.5 rounded-lg">
                          <Computer className="h-5 w-5 text-gray-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {client.clientId}
                        </h2>
                      </div>
                      <StatusBadge isOnline={client.status.isOnline} />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p>
                        Updated{" "}
                        {new Date(client.status.lastUpdated).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-md font-semibold text-gray-800">
                            Active Sessions
                          </h3>
                          <span className="flex items-center justify-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
                            <span className="text-sm font-medium">
                              {client.status.users.length}
                            </span>
                            <UserRound className="text-gray-700 size-4" />
                          </span>
                        </div>

                        {user?.role === "admin" && (
                          <button
                            onClick={() => deleteClient(client.clientId)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      {client.status.sessions.length > 0 ? (
                        <ul className="space-y-2 mt-3">
                          {client.status.sessions.map((session) => (
                            <li
                              key={session.ID}
                              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <UserRound className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-800">
                                  {session.User}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    session.State === "Active"
                                      ? "bg-slate-100 text-slate-800"
                                      : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {session.State}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic mt-2">
                          No active sessions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Loader />
          )}
        </div>
      </Layout>
    );
  } else {
    // Desktop view
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-slate-500 to-slate-600 p-3 rounded-xl shadow-lg">
                <Computer className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  ThinClient Dashboard
                </h1>
                <p className="text-gray-500">
                  Monitoring {clients.length} connected devices
                </p>
              </div>
            </div>
            <ConnectionStatus />
          </div>

          <ErrorAlert />
          <EmptyState />

          {!isLoading ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold text-gray-700">
                        Client
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700">
                        Last Update
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700">
                        Sessions
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <>
                        <tr
                          key={client.clientId}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${
                            index !== clients.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2 rounded-lg">
                                <Computer className="h-5 w-5 text-slate-700" />
                              </div>
                              <span className="font-medium text-gray-800">
                                {client.clientId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {new Date(
                                  client.status.lastUpdated
                                ).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                {client.status.users.length}
                              </span>
                              <UserRound className="text-gray-600 size-4" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge isOnline={client.status.isOnline} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user?.role === "admin" && (
                              <button
                                onClick={() => deleteClient(client.clientId)}
                                className="cursor-pointer inline-flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5"
                              >
                                <Trash2 size={16} />
                                <span className="text-sm font-medium">
                                  Delete
                                </span>
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Session List */}
                        {client.status.sessions.length > 0 && (
                          <>
                            {client.status.sessions.map(
                              (session, sessionIndex) => (
                                <tr
                                  key={session.ID}
                                  className={`bg-gray-50 hover:bg-gray-100 transition-colors duration-150 ${
                                    sessionIndex !==
                                    client.status.sessions.length - 1
                                      ? "border-b border-gray-100"
                                      : ""
                                  }`}
                                >
                                  <td className="px-6 py-3 pl-12">
                                    <div className="flex items-center gap-2">
                                      <UserRound
                                        size={16}
                                        className="text-gray-500"
                                      />
                                      <span className="font-medium text-gray-700">
                                        {session.User}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          session.State === "Active"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                      >
                                        {session.State}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3"></td>
                                  <td className="px-6 py-3"></td>
                                  <td className="px-6 py-3"></td>
                                  <td className="px-6 py-3"></td>
                                </tr>
                              )
                            )}
                          </>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Loader />
          )}
        </div>
      </Layout>
    );
  }
}
