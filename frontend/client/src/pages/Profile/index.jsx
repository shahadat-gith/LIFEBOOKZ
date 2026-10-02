import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";

import IdentityCard from "./components/IdentityCard";
import ProfileStats from "./components/ProfileStats";
import QuickLinks from "./components/QuickLinks";
import {
  ProfileLoading,
  SignedOutNotice,
} from "./components/ProfileStates";
import useBookingActivity from "./hooks/useBookingActivity";

/**
 * The member's profile, read-only — the same identity-card layout as the
 * author portal: cover with share + edit actions, overlapping avatar, then
 * the stats and quick links. Editing lives on `/profile/edit`.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { activity, failed, reload } = useBookingActivity(
    !authLoading && isAuthenticated,
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) window.scrollTo(0, 0);
  }, [authLoading, isAuthenticated]);

  if (authLoading) return <ProfileLoading />;
  if (!isAuthenticated) return <SignedOutNotice />;

  function handleShare() {
    const url = `${window.location.origin}/authors/${user.id || user._id}`;
    if (navigator.share) {
      navigator.share({ title: user.fullName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-foreground selection:bg-accent/20 md:pb-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6">
        <IdentityCard
          user={user}
          avatarSrc={user?.avatar?.url}
          coverSrc={user?.coverImage?.url}
          onShare={handleShare}
          onEdit={() => navigate("/profile/edit")}
        />

        <ProfileStats
          user={user}
          activity={activity}
          failed={failed}
          onRetry={reload}
        />

        <QuickLinks />
      </div>
    </div>
  );
}
