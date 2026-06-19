"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function UserMenu() {
  const { user, profile, loading, signInWithGoogle } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="rounded-md p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
        aria-label="Sign In"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </button>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white whitespace-nowrap"
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="h-6 w-6 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )}
      <span className="hidden xl:inline">
        {profile?.full_name?.split(" ")[0] || "Account"}
      </span>
    </Link>
  );
}
