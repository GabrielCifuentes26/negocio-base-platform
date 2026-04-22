"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { cancelInvitation, createInvitation, listInvitations } from "@/services/api/invitation-service";
import type { CreateInvitationInput, InvitationListItem } from "@/types/invitation";

export function useInvitations() {
  const { workspace, status, supabaseEnabled } = useAuth();
  const [rows, setRows] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const result = await listInvitations(workspace?.businessId);
    setRows(result.rows);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void listInvitations(workspace?.businessId).then((result) => {
      if (!isActive) {
        return;
      }

      setRows(result.rows);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function addInvitation(input: CreateInvitationInput) {
    const result = await createInvitation(workspace?.businessId, workspace?.membershipId, input);

    if (result.error) {
      return {
        error: result.error,
        inviteLink: null as string | null,
        emailDeliveryError: null as string | null,
      };
    }

    await reload();
    return {
      error: null,
      inviteLink: result.inviteLink,
      emailDeliveryError: result.emailDeliveryError,
    };
  }

  async function removeInvitation(invitationId: string) {
    const result = await cancelInvitation(invitationId);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return {
    rows,
    loading,
    error,
    addInvitation,
    removeInvitation,
  };
}
