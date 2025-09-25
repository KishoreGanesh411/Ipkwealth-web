import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailIcon, ArrowRightIcon } from "@/icons";

const REDIRECT_SECONDS = 5;

export default function Unauthorized() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate("/signin", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsLeft, navigate]);

  const progressWidth = useMemo(() => {
    const ratio = ((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100;
    return `${Math.min(100, Math.max(0, ratio))}%`;
  }, [secondsLeft]);

  const formattedCountdown = useMemo(
    () => secondsLeft.toString().padStart(2, "0"),
    [secondsLeft],
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-20 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-24 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl rounded-3xl border border-gray-200 bg-white/90 p-10 shadow-[0_40px_80px_-40px_rgba(70,95,255,0.45)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-brand-500/10 px-4 py-1 text-sm font-medium text-brand-600">Access pending admin approval</div>
          <header>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">Hold on, we are reviewing your access</h1>
            <p className="mt-3 text-base text-gray-500 md:text-lg">
              Only IPK Admin accounts can open this workspace. We have logged your request.
              You will be redirected to the sign-in screen once the timer completes. You can also reach out to your
              administrator for a faster approval.
            </p>
          </header>

          <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-left">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-400">Auto redirect in</p>
                <p className="mt-1 text-4xl font-semibold text-brand-500 md:text-5xl">00:00:{formattedCountdown}</p>
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm text-gray-500">Need immediate help?</p>
                <a
                  href="mailto:access@ipkwealth.com"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-500"
                >
                  Contact admin team
                  <ArrowRightIcon className="size-4" />
                </a>
              </div>
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300 ease-out"
                style={{ width: progressWidth }}
              />
            </div>
            <p className="mt-3 text-xs text-gray-400">
              When the timer ends you will be moved back to sign in automatically.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <a
              href="mailto:access@ipkwealth.com"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              <MailIcon className="size-5" />
              Notify Admin via Email
            </a>
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-brand-200 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              Go to sign in now
            </button>
          </div>

          <div className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <span>
              Redirecting in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}
            </span>
            <Link to="/" className="font-medium text-brand-500 hover:text-brand-600">
              Return to marketing site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
