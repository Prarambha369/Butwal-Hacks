import { getAllUsers, getPendingRoleRequests } from "@/lib/actions/admin";
import UsersClient from "./users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, pendingRequests] = await Promise.all([
    getAllUsers(),
    getPendingRoleRequests(),
  ]);
  return <UsersClient initialUsers={users} initialPendingRequests={pendingRequests} />;
}
