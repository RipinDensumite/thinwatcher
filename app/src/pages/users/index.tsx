import { useState, useEffect, useContext } from "react";
import Layout from "@/layout/layout";
import { toast } from "sonner";
import { AuthContext } from "@/context/AuthContext";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useContext(AuthContext);

  const currentAdminUsername = user?.username;

  // Form states
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle role change
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      toast.success("User role updated successfully");
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  // Handle new user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBtnLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      toast.success("User created successfully");
      setNewUser({ username: "", email: "", password: "" });
      fetchUsers(); // Refresh the user list
      (document.getElementById("createModal") as HTMLDialogElement)?.close();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setIsBtnLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <button
            className="btn btn-neutral"
            onClick={() =>
              (
                document.getElementById("createModal") as HTMLDialogElement
              )?.showModal()
            }
          >
            Add New User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover">
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full min-w-24 max-w-xs"
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={currentAdminUsername === user.username}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {user.created_at ? formatDate(user.created_at) : "N/A"}
                    </td>
                    <td>
                      <button
                        className="btn btn-error btn-sm text-white"
                        onClick={() => {
                          setSelectedUser(user);
                          (
                            document.getElementById(
                              "delModal"
                            ) as HTMLDialogElement
                          )?.showModal();
                        }}
                        disabled={currentAdminUsername === user.username}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create User Modal */}
        <dialog id="createModal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>

            <form onSubmit={handleCreateUser}>
              <h3 className="font-bold text-lg mb-4">Create New User</h3>

              <fieldset className="fieldset">
                <legend className="fieldset-legend text-lg">Username</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  disabled={isBtnLoading}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend text-lg">Email</legend>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  disabled={isBtnLoading}
                  required
                />{" "}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend text-lg">Password</legend>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  disabled={isBtnLoading}
                  required
                />{" "}
              </fieldset>

              <div className="flex items-center justify-end gap-5 mt-4">
                <button
                  type="submit"
                  className="btn btn-neutral"
                  disabled={isBtnLoading}
                >
                  {isBtnLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Create User"
                  )}
                </button>

                <form method="dialog">
                  <button className="btn btn-soft btn-error">Cancel</button>
                </form>
              </div>
            </form>
          </div>
        </dialog>

        {/* Delete Confirmation Modal */}
        <dialog id="delModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete user "{selectedUser?.username}"?
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <form method="dialog" className="space-x-3">
                <button
                  className="btn btn-error text-white"
                  onClick={handleDeleteUser}
                >
                  Delete
                </button>
                <button className="btn">Cancel</button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    </Layout>
  );
}

export default ManageUsersPage;
