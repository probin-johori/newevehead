import { Navigate } from "react-router-dom";

// Signup is now unified with Login
export default function SignupPage() {
  return <Navigate to="/login" replace />;
}
