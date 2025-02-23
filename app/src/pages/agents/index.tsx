import Layout from "@/layout/layout";

export default function AgentsPage() {
  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Install and Use WinAgent
        </h1>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            What is WinAgent?
          </h2>
          <p className="text-gray-600">
            WinAgent is a lightweight agent designed to monitor and manage thin
            clients in your network. It sends heartbeat signals to a backend
            server and allows you to monitor client sessions remotely.
          </p>
        </section>

        {/* Installation Instructions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Installation Instructions
          </h2>
          <p className="text-gray-600 mb-4">
            To install WinAgent on a Windows machine, follow these steps:
          </p>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>
              Open PowerShell as Administrator. You can do this by searching for
              "PowerShell" in the Start menu, right-clicking on it, and
              selecting "Run as Administrator".
            </li>
            <li>
              Run the following command to install WinAgent:
              <div className="mt-2 bg-gray-800 rounded-lg p-4">
                <code className="text-white break-all">
                  powershell -c "irm
                  https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/thinwatcher.ps1
                  | iex"
                </code>
              </div>
            </li>
            <li>
              Follow the on-screen prompts to complete the installation. You
              will be asked to provide the following details:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  <strong>Backend URL</strong> (e.g.,{" "}
                  <code>https://your-backend-url.com</code>): The URL of the
                  backend server where the agent will send data. This is the
                  server that manages and monitors your thin clients.
                </li>
                <li>
                  <strong>Heartbeat Interval</strong> (e.g., <code>5</code>{" "}
                  seconds): The time interval (in seconds) at which the agent
                  sends a "heartbeat" signal to the backend server. This helps
                  the backend track the client's status and ensure it's online.
                </li>
                <li>
                  <strong>Client ID</strong> (e.g., <code>THINCLIENT-01</code>):
                  A unique identifier for this thin client. This name is used to
                  distinguish the client in the backend system and should be
                  unique across all clients.
                </li>
              </ul>
            </li>
            <li>
              Once the installation is complete, the agent will start
              automatically and persist across reboots.
            </li>
          </ol>
        </section>

        {/* Usage Instructions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Using WinAgent
          </h2>
          <p className="text-gray-600 mb-4">
            After installation, WinAgent will automatically start monitoring the
            thin client and sending heartbeat signals to the backend server. You
            can manage the agent using the following commands on the launcher:
          </p>
          {/* <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              <strong>Reconfigure the Agent:</strong> Run the installation
              command again to reconfigure the agent with new settings.
            </li>
            <li>
              <strong>Uninstall the Agent:</strong> Use the uninstall option in
              the launcher menu to remove the agent from the system.
            </li>
          </ul> */}
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Troubleshooting
          </h2>
          <p className="text-gray-600 mb-4">
            If you encounter any issues during installation or usage, try the
            following:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Ensure you are running PowerShell as Administrator.</li>
            <li>
              Check your internet connection to ensure the script can download
              the required files.
            </li>
            <li>Verify that the backend URL is correct and accessible.</li>
            <li>
              If the agent fails to start, check the Task Scheduler for the
              "WinAgent" task and ensure it is running.
            </li>
            <li>
              Contact the creator for further assistance if the issue persists.
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}
