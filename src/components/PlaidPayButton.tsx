"use client";

import { useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

interface PlaidPayButtonProps {
  linkToken: string | null;
  onSuccess: (publicToken: string, accountId: string) => void;
  onExit?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function PlaidPayButton({
  linkToken,
  onSuccess,
  onExit,
  disabled,
  loading,
}: PlaidPayButtonProps) {
  const onPlaidSuccess = useCallback(
    (publicToken: string, metadata: { accounts: { id: string }[] }) => {
      const accountId = metadata.accounts[0]?.id;
      if (accountId) {
        onSuccess(publicToken, accountId);
      }
    },
    [onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onExit || (() => {}),
  });

  return (
    <button
      type="button"
      onClick={() => open()}
      disabled={disabled || !ready || !linkToken || loading}
      className="w-full rounded-lg bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing Payment...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
          </svg>
          Pay with Bank Account
        </span>
      )}
    </button>
  );
}
