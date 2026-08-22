import { Navigate } from "react-router-dom";

/** /admin is the Super Admin entry point — it redirects to the overview module. */
const Admin = () => <Navigate to="/admin/overview" replace />;

export default Admin;
