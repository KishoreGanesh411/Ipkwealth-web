import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

import { auth } from "@/core/firebase/firebaseInit";
import { ChevronLeftIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export default function ConfirmResetPasswordForm({ oobCode }: { oobCode: string }) {
  const [busy, setBusy] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const e = await verifyPasswordResetCode(auth, oobCode);
        if (mounted) setEmail(e);
      } catch (err: any) {
        if (mounted) setError("Your reset link is invalid or has expired.");
      } finally {
        if (mounted) setBusy(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [oobCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err: any) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-600">Validating link…</div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Back to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <Alert
            variant="success"
            title="Password updated"
            message="Your password has been reset successfully. You can now sign in with your new password."
            showLink
            linkHref="/signin"
            linkText="Go to sign in"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Set New Password
            </h1>
            {email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">For account: {email}</p>
            )}
          </div>

          {error && (
            <div className="mb-6">
              <Alert variant="error" title="Problem resetting password" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>New password <span className="text-error-500">*</span></Label>
                <Input
                  type="password"
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Confirm password <span className="text-error-500">*</span></Label>
                <Input
                  type="password"
                  placeholder="Re-enter the new password"
                  value={confirm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <div>
                <Button type="submit" className="w-full" size="sm" disabled={busy}>
                  {busy ? "Saving..." : "Update password"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

