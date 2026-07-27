import { useNavigate } from "react-router";
import { useAcceptInvite } from "jazz-tools/react";
import { Circle } from "./schema";
import { INVITE_HINT, joinCircle } from "./circles";
import { useAppAccount } from "./hooks";

/**
 * Watches the URL fragment for an invite and joins the circle.
 * Mounted once, above the routes — invites can land on any screen.
 */
export function InviteListener() {
  const account = useAppAccount();
  const navigate = useNavigate();

  useAcceptInvite({
    invitedObjectSchema: Circle,
    forValueHint: INVITE_HINT,
    onAccept: (circleId) => {
      if (!account.$isLoaded) return;
      void joinCircle(account, circleId).then(() => navigate(`/circle/${circleId}`));
    },
  });

  return null;
}
