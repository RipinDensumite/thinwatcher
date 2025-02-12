"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface Session {
  ID: string
  User: string
  State: string
}

interface ClientStatus {
  isOnline: boolean
  users: string[]
  sessions: Session[]
  lastUpdated: string
}

interface Client {
  clientId: string
  status: ClientStatus
}

const API_URL = "https://thinwatcherbackend.ripin.live"

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      upgrade: false,
      reconnectionAttempts: 5,
      withCredentials: true,
    })

    setSocket(newSocket)

    // Dummy data for display
    const dummyData: Client[] = [
      {
        clientId: "THINCLIENT-01",
        status: {
          isOnline: true,
          users: ["ripin"],
          sessions: [
            { ID: "0", User: "SYSTEM", State: "Disconnected" },
            { ID: "1", User: "ripin", State: "Active" },
            { ID: "36", User: "SYSTEM", State: "Listen" },
          ],
          lastUpdated: "2025-02-12T22:56:03.386Z",
        },
      },
    ]

    setClients(dummyData)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("update", ({ clientId, status }: { clientId: string; status: ClientStatus }) => {
      setClients((prev) => prev.map((client) => (client.clientId === clientId ? { ...client, status } : client)))
    })
  }, [socket])

  const terminateSession = async (clientId: string, sessionId: string) => {
    try {
      await fetch(`${API_URL}/api/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, sessionId }),
      })
    } catch (error) {
      console.error("Termination failed:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Clients</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.clientId} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{client.clientId}</h2>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${client.status.isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {client.status.isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Last Updated: {new Date(client.status.lastUpdated).toLocaleString()}
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>
                <ul className="space-y-2">
                  {client.status.sessions.map((session) => (
                    <li key={session.ID} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium mr-2">{session.User}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${session.State === "Active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {session.State}
                        </span>
                      </div>
                      {session.State === "Active" && (
                        <button
                          onClick={() => terminateSession(client.clientId, session.ID)}
                          className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        >
                          Terminate
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

