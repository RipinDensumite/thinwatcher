import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import Layout from "@/layout/layout";
import { UserRound, WifiOff, Wifi } from "lucide-react";

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

const API_URL = "https://thinwatcherbackend.ripin.live";

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setError("Failed to fetch initial data. Please refresh the page.");
      }
    };

    fetchInitialData();
  }, []);

  // Socket connection
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      upgrade: false,
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setError("Connection lost. Attempting to reconnect...");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError(`Connection error: ${error.message}`);
    });

    // Initial data from socket
    newSocket.on("initial-data", (data: [string, ClientStatus][]) => {
      console.log("Received initial data:", data);
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
        console.log("Received update for client:", clientId);
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

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // const terminateSession = async (clientId: string, sessionId: string) => {
  //   try {
  //     const response = await fetch(`${API_URL}/api/terminate`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ clientId, sessionId }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //   } catch (error) {
  //     console.error("Termination failed:", error);
  //     setError("Failed to terminate session. Please try again.");
  //   }
  // };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl">ThinClient : {clients.length}</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-green-600 flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <WifiOff className="h-4 w-4" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {clients.length === 0 && !error && (
          <div className="text-center py-10">
            <p className="text-gray-500">No clients connected</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.clientId}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{client.clientId}</h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      client.status.isOnline
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {client.status.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Last Updated:{" "}
                  {new Date(client.status.lastUpdated).toLocaleString()}
                </p>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">Active Sessions</h3>
                    <span className="flex items-center justify-center gap-1 bg-slate-300/60 ring-2 ring-black/40 rounded-4xl px-3 py-1">
                      <span className="text-sm">
                        {client.status.users.length}
                      </span>{" "}
                      <UserRound className="text-black size-4" />
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {client.status.sessions.map((session) => (
                      <li
                        key={session.ID}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <div>
                          <span className="font-medium mr-2">
                            {session.User}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              session.State === "Active"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {session.State}
                          </span>
                        </div>
                        {/* {session.State === "Active" && (
                          <button
                            onClick={() =>
                              terminateSession(client.clientId, session.ID)
                            }
                            className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
                          >
                            Terminate
                          </button>
                        )} */}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}