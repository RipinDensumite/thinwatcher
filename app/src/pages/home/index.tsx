import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import Layout from "@/layout/layout";
import { UserRound, WifiOff, Wifi, Trash2, Computer } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";

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
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`, {
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY,
          },
        });
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

  const deleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
      });

      console.log("response" + response);

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

    // Delete client
    newSocket.on("client-removed", (clientId: string) => {
      console.log("Client removed:", clientId);
      setClients((prev) =>
        prev.filter((client) => client.clientId !== clientId)
      );
    });

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

  if (isMobile) {
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
                    {client.status.isOnline ? (
                      <span className="select-none inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Healthy
                      </span>
                    ) : (
                      <span className="select-none inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                        Unhealthy
                      </span>
                    )}
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
  } else {
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

          {/* <div className="flex items-center justify-center gap-5 bg-white border-1 border-gray-200 rounded-2xl w-fit px-4 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              className="size-24"
              viewBox="0 0 30 30"
            >
              <path d="M12 16L3 16 3 23.75 12 24.988zM12 5L3 6.25 3 14 12 14zM14 4.75L14 14 27 14 27 3zM14 16L14 25.25 27 27 27 16z"></path>
            </svg>
            <h1 className="text-7xl font-mono">{clients.length}</h1>
          </div> */}

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

          <div className="my-3">
            <table className="w-full border-collapse border border-gray-200 bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    Last Update
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    Session
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-medium text-gray-900"
                  ></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {clients.map((client) => (
                  <>
                    <tr key={client.clientId} className="hover:bg-gray-50">
                      <th className="px-6 py-4 font-medium text-gray-900 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          x="0px"
                          y="0px"
                          className="size-4"
                          viewBox="0 0 30 30"
                        >
                          <path d="M12 16L3 16 3 23.75 12 24.988zM12 5L3 6.25 3 14 12 14zM14 4.75L14 14 27 14 27 3zM14 16L14 25.25 27 27 27 16z"></path>
                        </svg>
                        {client.clientId}
                      </th>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(client.status.lastUpdated).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1">
                          <span className="text-sm">
                            {client.status.users.length}
                          </span>{" "}
                          <UserRound className="text-black size-4" />
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {client.status.isOnline ? (
                          <span className="select-none inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            Healthy
                          </span>
                        ) : (
                          <span className="select-none inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3"
                            >
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                            Unhealthy
                          </span>
                        )}
                      </td>
                      <td className="flex justify-end gap-4 px-6 py-4 font-medium">
                        <button
                          onClick={() => deleteClient(client.clientId)}
                          className="cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* Session List */}
                    {client.status.sessions.length > 0 && (
                      <h1 className="px-6 py-3 text-md">Session</h1>
                    )}
                    {client.status.sessions.map((session) => (
                      <tr key={session.ID} className="bg-gray-100">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-1">
                          <Computer size={17} /> {session.User}{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              session.State === "Active"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {session.State}
                          </span>
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                        <td className="flex justify-end gap-4 px-6 py-4 font-medium">
                          {/* {session.State === "Active" && (
                            <button className="px-2 py-1 w-fit bg-red-500 text-white rounded-md cursor-pointer">
                              Terminate
                            </button>
                          )} */}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    );
  }
}
