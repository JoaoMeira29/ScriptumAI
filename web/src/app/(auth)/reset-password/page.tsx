import { ResetPasswordPage } from "./_components/reset-password-page";

type ResetPasswordRoutePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordRoutePage({
  searchParams,
}: ResetPasswordRoutePageProps) {
  const params = await searchParams;
  return <ResetPasswordPage token={params.token ?? ""} />;
}
