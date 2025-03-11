import Layout from "@/layout/layout";
import { useState } from "react";
import { toast } from "sonner";

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState("install");
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-8 py-10 text-white">
            <h1 className="text-4xl font-bold tracking-tight">Agents</h1>
            <p className="mt-2 text-slate-100">
              Lightweight monitoring solution for thin clients
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("install")}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ease-in-out ${
                  activeTab === "install"
                    ? "border-slate-600 text-slate-600"
                    : "cursor-pointer border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Installation
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ease-in-out ${
                  activeTab === "usage"
                    ? "border-slate-600 text-slate-600"
                    : "cursor-pointer border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Usage
              </button>
              <button
                onClick={() => setActiveTab("troubleshoot")}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ease-in-out ${
                  activeTab === "troubleshoot"
                    ? "border-slate-600 text-slate-600"
                    : "cursor-pointer border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Troubleshooting
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="px-8 py-6">
            {/* Introduction - Always visible */}
            <section className="mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-slate-100 rounded-lg p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    What is WinAgent?
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    WinAgent is a lightweight agent designed to monitor and
                    manage thin clients in your network. It sends heartbeat
                    signals to a backend server and allows you to monitor client
                    sessions remotely.
                  </p>
                </div>
              </div>
            </section>

            {/* Installation Instructions */}
            {activeTab === "install" && (
              <section className="mb-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Installation Instructions
                </h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  To install WinAgent on a Windows machine, follow these steps:
                </p>
                <ol className="space-y-6 mb-6">
                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        1
                      </span>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">
                          Open PowerShell as Administrator
                        </p>
                        <p className="text-gray-600 mt-1 text-sm">
                          Search for "PowerShell" in the Start menu, right-click
                          on it, and select "Run as Administrator".
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        2
                      </span>
                      <div className="ml-4 w-full">
                        <p className="text-gray-700 font-medium">
                          Run the installation command
                        </p>
                        <div className="mt-3 bg-gray-800 rounded-lg p-4 group relative">
                          <code className="text-gray-100 text-sm font-mono break-all">
                            powershell -c "irm
                            https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/thinwatcher.ps1
                            | iex"
                          </code>
                          <button
                            className="cursor-pointer tooltip absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            data-tip={
                              isCopied ? "Copied!" : "Copy to clipboard"
                            }
                            onClick={() => {
                              navigator.clipboard.writeText(
                                'powershell -c "irm https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/thinwatcher.ps1 | iex"'
                              );
                              setIsCopied(true);
                              toast.success(
                                "Command copied! Paste it in PowerShell to install."
                              );
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm">
                          This command will install the ThinWatcher launcher.
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        3
                      </span>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">
                          Run the ThinWatcher launcher
                        </p>
                        <p className="text-gray-600 mt-1 text-sm">
                          After installation, you'll be asked if you want to run
                          the launcher. Enter{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-600">
                            y
                          </code>{" "}
                          to proceed. Alternatively, you can run it manually by
                          typing{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-600">
                            thinwatcher.cmd
                          </code>{" "}
                          in the command prompt.
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        4
                      </span>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">
                          Start the installation
                        </p>
                        <p className="text-gray-600 mt-1 text-sm">
                          Choose selection number 1 to start the installation.
                          If no configuration file exists, the launcher will run
                          the installation process. Follow the prompts to set up
                          your agent.
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        5
                      </span>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">
                          Provide the required information
                        </p>
                        <div className="mt-3 space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-800">
                              Backend URL
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              The URL of the backend server where the agent will
                              send data (e.g.,{" "}
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-600">
                                https://your-backend-url.com
                              </code>
                              )
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-800">
                              Heartbeat Interval
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              The time interval in seconds at which the agent
                              sends a "heartbeat" signal (e.g.,{" "}
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-600">
                                5
                              </code>
                              )
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-800">
                              Client ID
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              A unique identifier for this thin client (e.g.,{" "}
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-600">
                                THINCLIENT-01
                              </code>
                              )
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex">
                      <span className="flex-shrink-0 bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        6
                      </span>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">
                          Installation complete
                        </p>
                        <p className="text-gray-600 mt-1 text-sm">
                          Once the installation is complete, the agent will
                          start automatically and persist across reboots.
                        </p>
                      </div>
                    </div>
                  </li>
                </ol>
              </section>
            )}

            {/* Usage Instructions */}
            {activeTab === "usage" && (
              <section className="mb-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Using WinAgent
                </h2>
                <div className="bg-slate-50 border-l-4 border-slate-500 p-4 mb-6 rounded-r-lg">
                  <p className="text-slate-700">
                    After installation, WinAgent will automatically start
                    monitoring the thin client and sending heartbeat signals to
                    the backend server.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Monitoring Features
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-0.5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Real-time client status monitoring
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-0.5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Automatic heartbeat signals
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-0.5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Session tracking and management
                      </span>
                    </li>
                  </ul>
                </div>
              </section>
            )}

            {/* Troubleshooting */}
            {activeTab === "troubleshoot" && (
              <section className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Troubleshooting
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  If you encounter any issues during installation or usage, try
                  the following solutions:
                </p>

                <div className="space-y-4">
                  {[
                    {
                      title: "Administrator Privileges",
                      description:
                        "Ensure you are running PowerShell as Administrator.",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      ),
                    },
                    {
                      title: "Internet Connection",
                      description:
                        "Check your internet connection to ensure the script can download the required files.",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                    },
                    {
                      title: "Backend URL",
                      description:
                        "Verify that the backend URL is correct and accessible.",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      ),
                    },
                    {
                      title: "Launcher Issues",
                      description:
                        "If the launcher doesn't start automatically, try running it manually by typing 'thinwatcher.cmd' in the command prompt.",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                    },
                    {
                      title: "Contact Support",
                      description:
                        "Contact the developer for further assistance if the issue persists.",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 bg-slate-50 rounded-full p-2 h-fit">
                        {item.icon}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-800">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
