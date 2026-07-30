import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAcceptInvite } from "jazz-tools/react";
import { useAuthSheets } from "@/lib/auth-sheets-context";
import { useAuth } from "./auth";
import { INVITE_HINT, joinCircle } from "./circles";
import { useAppAccount } from "./hooks";
import { Circle } from "./schema";

/**
 * Watches the URL fragment for an invite and joins the circle.
 * Mounted once, above the routes — invites can land on any screen.
 *
 * An anonymous account can't sync, so joining before sign-up would produce a
 * circle whose data never reaches anyone. The invite is held instead, the
 * sign-up sheet opens, and the join runs once there's a real account.
 */
export function InviteListener() {
  const account = useAppAccount();
  const { isAuthenticated } = useAuth();
  const { openSignUp } = useAuthSheets();
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useAcceptInvite({
    invitedObjectSchema: Circle,
    forValueHint: INVITE_HINT,
    onAccept: (circleId) => setPendingId(circleId),
  });

  useEffect(() => {
    if (!pendingId || !account.$isLoaded) return;
    if (!isAuthenticated) {
      openSignUp();
      return;
    }
    const circleId = pendingId;
    setPendingId(null);
    void joinCircle(account, circleId).then((result) =>
      result === "full"
        ? navigate("/circles", { state: { inviteRefused: true } })
        : navigate(`/circle/${circleId}`),
    );
  }, [pendingId, account, isAuthenticated, openSignUp, navigate]);

  return null;
}
