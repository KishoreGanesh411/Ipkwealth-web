import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "@/components/auth/reset/ResetPasswordForm";
import ConfirmResetPasswordForm from "@/components/auth/reset/ConfirmResetPasswordForm";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  return (
    <>
      <PageMeta
        title="Reset Password | IPKwealth"
        description="Request a password reset link for your IPKwealth account."
      />
      <AuthLayout>
        {mode === "resetPassword" && oobCode ? (
          <ConfirmResetPasswordForm oobCode={oobCode} />
        ) : (
          <ResetPasswordForm />
        )}
      </AuthLayout>
    </>
  );
}
