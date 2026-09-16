import { getAllUsers, getPendingRoleRequests } from "@/lib/actions/admin";
import UsersClient from "./users-client";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Users", description: "Manage users", path: "/dashboard/maintainer/users", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, pendingRequests] = await Promise.all([
    getAllUsers(),
    getPendingRoleRequests(),
  ]);
  return <UsersClient initialUsers={users} initialPendingRequests={pendingRequests} />;
}
