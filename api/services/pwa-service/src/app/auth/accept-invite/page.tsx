import { AcceptInvitePage } from "./_components/accept-invite-page";

type AcceptInviteRoutePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function AcceptInviteRoutePage({
  searchParams,
}: AcceptInviteRoutePageProps) {
  const params = await searchParams;
  return <AcceptInvitePage token={params.token ?? ""} />;
}
