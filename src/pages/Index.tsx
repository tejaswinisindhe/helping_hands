
import { Navigate } from "react-router-dom";

// Redirect from old Index page to the new HomePage
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
