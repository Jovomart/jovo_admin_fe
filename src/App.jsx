import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import PageLoader from "./components/PageLoader";

const App = () => (
  <AuthProvider>
    <PageLoader />
    <AppRoutes />
  </AuthProvider>
);

export default App;