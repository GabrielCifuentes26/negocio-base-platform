import { Suspense } from "react";

import { AcceptInvitationCard } from "@/modules/auth/components/accept-invitation-card";

export default function AcceptInvitationPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <Suspense fallback={null}>
        <AcceptInvitationCard />
      </Suspense>
    </main>
  );
}
