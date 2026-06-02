import { Suspense } from "react";

import { TrialExpiredPage } from "./_components/trial-expired-page";

export default function TrialExpiredRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrialExpiredPage />
    </Suspense>
  );
}
