// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/context/AuthContex";

// const navigate = useNavigate();
// const { user, login } = useAuth();

// const onSubmit = async () => {
//   const ok = await login(email, password);
//   if (!ok) return setError("Invalid credentials");

//   // land them by role
//   if (user?.role === "RM") navigate("/sales/dashboard", { replace: true });
//   else if (user?.role === "MARKETING") navigate("/marketing/dashboard", { replace: true });
//   else if (user?.role === "ADMIN") navigate("/admin/dashboard", { replace: true });
//   else navigate("/unauthorized", { replace: true });
// };
