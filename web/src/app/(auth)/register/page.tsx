import { RegisterPage } from "./_components/register-page";
import { Suspense } from "react";

export default function RegisterRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RegisterPage />
    </Suspense>
  );
}
