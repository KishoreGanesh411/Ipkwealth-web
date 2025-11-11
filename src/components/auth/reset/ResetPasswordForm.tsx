import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { useMutation } from "@apollo/client";

import { auth } from "@/core/firebase/firebaseInit";
import { ChevronLeftIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { GENERATE_PASSWORD_RESET_LINK } from "@/core/graphql/user/passwordReset.gql";

type Banner = {
  title: string;
  message: string;
  variant: "error" | "warning" | "success";
};

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const [mutate] = useMutation(GENERATE_PASSWORD_RESET_LINK);

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFieldError(undefined);
    if (banner) setBanner(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const target = email.trim();
    if (!target) {
      setFieldError("Email is required");
      return;
    }

    setBusy(true);
    setBanner(null);
    setResetLink(null);

    try {
      // Prefer backend-generated link if supported (uses Firebase Admin)
      try {
        const { data } = await mutate({ variables: { email: target } });
        const link = data?.generatePasswordResetLink as string | undefined;
        if (link) {
          setResetLink(link);
          setBanner({
            title: "Reset link ready",
            message: "Click the button below to continue resetting your password.",
            variant: "success",
          });
          return; // skip client email send
        }
      } catch {
        // ignore and fall back to client SDK
      }

      // Fallback to Firebase client SDK to send reset email.
      await sendPasswordResetEmail(auth, target);
      setBanner({
        title: "Check your email",
        message:
          "If an account exists for that email, a password reset link has been sent.",
        variant: "success",
      });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      // Provide friendly messages while keeping security best‑practice wording.
      if (code === "auth/invalid-email") {
        setFieldError("Please enter a valid email address.");
      }
      // Show generic message for all outcomes to avoid user enumeration.
      setBanner({
        title: "Email sent (if account exists)",
        message:
          "We’ll send a reset link if the email is registered. Please check your inbox and spam folder.",
        variant: "success",
      });
    } finally {
      setBusy(false);
    }
  };

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
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email to receive a reset link.
            </p>
          </div>

          {banner && (
            <div className="mb-6">
              <Alert
                variant={banner.variant as any}
                title={banner.title}
                message={banner.message}
                showLink={Boolean(resetLink)}
                linkHref={resetLink || undefined}
                linkText="Reset now"
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={onEmailChange}
                  autoComplete="email"
                  required
                  error={Boolean(fieldError)}
                  hint={fieldError}
                />
              </div>

              <div>
                <Button type="submit" className="w-full" size="sm" disabled={busy}>
                  {busy ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
