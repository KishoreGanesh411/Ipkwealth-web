import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";

import { auth } from "../core/firebase/firebaseInit";
import { ME } from "@/core/graphql/user/user.gql";

export type Role = "ADMIN" | "RM" | "STAFF" | "MARKETING" | "ANALYST";
export type AppUserRole = Role | "UNKNOWN";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  status?: string | null;
};

export type LoginErrorTarget = "email" | "password";
export type LoginFailure = {
  success: false;
  code?: string;
  title: string;
  message: string;
  target?: LoginErrorTarget;
  fieldMessage?: string;
  variant: "error" | "warning";
};
export type LoginResult = { success: true } | LoginFailure;

type AuthContextType = {
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  loading: boolean;
  idToken: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KNOWN_ROLES: Role[] = ["ADMIN", "RM", "STAFF", "MARKETING", "ANALYST"];
type MeQueryResult = {
  me: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string | null;
  } | null;
};

type LoginErrorDescriptor = {
  title: string;
  message: string;
  target?: LoginErrorTarget;
  fieldMessage?: string;
  variant?: "error" | "warning";
};

const AUTH_ERROR_MESSAGES: Record<string, LoginErrorDescriptor> = {
  "auth/wrong-password": {
    title: "Incorrect password",
    message: "Please check your password and try again.",
    target: "password",
    fieldMessage: "The password you entered is incorrect.",
  },
  "auth/invalid-credential": {
    title: "Incorrect password",
    message: "Please check your password and try again.",
    target: "password",
    fieldMessage: "The password you entered is incorrect.",
  },
  "auth/user-not-found": {
    title: "Account not found",
    message: "We couldn't find an account for that email. Contact your administrator if you need access.",
    target: "email",
    fieldMessage: "No user exists with this email address.",
  },
  "auth/user-disabled": {
    title: "Account disabled",
    message: "Your account has been disabled. Please contact your administrator for help.",
  },
  "auth/too-many-requests": {
    title: "Too many attempts",
    message: "We've temporarily locked sign-in because of too many attempts. Please wait a moment and try again.",
    target: "password",
    variant: "warning",
  },
};

const DEFAULT_LOGIN_ERROR: LoginErrorDescriptor = {
  title: "Sign-in failed",
  message: "We couldn't sign you in. Please try again or contact your administrator.",
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const client = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: import.meta.env.VITE_GRAPHQL_URL,
        headers: { Authorization: idToken ? 'Bearer ' + idToken : "" },
      }),
      cache: new InMemoryCache(),
    });
  }, [idToken]);

  const normalizeRole = useCallback((rawRole: string | null | undefined): AppUserRole => {
    if (rawRole && KNOWN_ROLES.includes(rawRole as Role)) {
      return rawRole as Role;
    }
    return "UNKNOWN";
  }, []);

  const loadProfile = useCallback(async () => {
    if (!idToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.query<MeQueryResult>({
        query: ME,
        fetchPolicy: "network-only",
      });

      if (data?.me) {
        setUser({
          id: data.me.id,
          name: data.me.name,
          email: data.me.email,
          role: normalizeRole(data.me.role),
          status: data.me.status ?? null,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load authenticated user", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [client, idToken, normalizeRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      if (!current) {
        setFirebaseUser(null);
        setIdToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFirebaseUser(current);

      try {
        const token = await current.getIdToken(true);
        setIdToken(token);
      } catch (error) {
        console.error("Failed to retrieve ID token", error);
        await signOut(auth);
        setFirebaseUser(null);
        setIdToken(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);

      if (error instanceof FirebaseError) {
        const info = AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_LOGIN_ERROR;
        return {
          success: false,
          code: error.code,
          title: info.title,
          message: info.message,
          target: info.target,
          fieldMessage: info.fieldMessage,
          variant: info.variant ?? "error",
        };
      }

      return {
        success: false,
        title: DEFAULT_LOGIN_ERROR.title,
        message: DEFAULT_LOGIN_ERROR.message,
        variant: "error",
      };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIdToken(null);
    setFirebaseUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        idToken,
        login,
        logout,
        refresh: loadProfile,
      }}
    >
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
