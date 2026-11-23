import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createElement, lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/ui/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Loadin from "./components/ui/loadin";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUpdateUsers = lazy(() => import("./pages/AdminUpdateUsers"));
const Players = lazy(() => import("./pages/Players"));
const PlayerDetails = lazy(() => import("./components/player/PlayerDetails"));
const AuctionSection = lazy(() => import("./components/auction/AuctionSection"));
const AdminAuctionControl = lazy(() =>
  import("./components/auction/AdminAuctionControl")
);
const UpdateTournament = lazy(() =>
  import("./components/Tournament/UpdateTournament")
);
const TournamentStats = lazy(() =>
  import("./components/Tournament/TournamentStats")
);
const TournamentResults = lazy(() =>
  import("./components/Tournament/TournamentResults")
);
const PlayerTableAssign = lazy(() =>
  import("./components/Squads/PlayerTableAssign")
);
const DisplaySquad = lazy(() => import("./components/Squads/DisplaySquad"));
const SquadBuilder = lazy(() => import("./components/Squads/SquadBuilder"));
const About = lazy(() => import("./pages/About"));
const Upload = lazy(() => import("./hooks/Upload"));
const PlayerTest = lazy(() => import("./pages/PlayerTest"));

const withRole = (role, Element) => (
  <ProtectedRoute role={role}>
    {createElement(Element)}
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="relative isolate min-h-screen overflow-hidden bg-fifa-bg text-fifa-text">
            <div
              aria-hidden="true"
              className="pointer-events-none fixed left-[-12rem] top-[-10rem] z-0 h-[34rem] w-[34rem] rounded-full bg-fifa-accent/[0.10] blur-[110px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed right-[-14rem] top-[18%] z-0 h-[30rem] w-[30rem] rounded-full bg-fifa-info/[0.08] blur-[120px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed bottom-[-16rem] left-[35%] z-0 h-[32rem] w-[32rem] rounded-full bg-fifa-accent/[0.055] blur-[130px]"
            />
            <Navbar />
            <main className="relative z-0 mt-0 min-h-screen w-full pb-20 md:mt-4 md:min-h-[calc(100vh-4.5rem)] md:pb-0">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-fifa-bg">
                    <Loadin>Loading...</Loadin>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/upload"
                    element={withRole(["admin"], Upload)}
                  />

                  <Route path="/user" element={withRole(["user","admin"], UserDashboard)} />
                  <Route
                    path="/admin"
                    element={withRole(["admin"], AdminDashboard)}
                  />
                  <Route
                    path="/admin/update-users"
                    element={withRole(["admin"], AdminUpdateUsers)}
                  />
                  <Route
                    path="/players"
                    element={withRole(["admin", "user"], Players)}
                  />
                  <Route
                    path="/squadupdate"
                    element={withRole(["user", "admin"], PlayerTableAssign)}
                  />
                  <Route
                    path="/admin/auction"
                    element={withRole(["admin"], AdminAuctionControl)}
                  />
                  <Route
                    path="/admin/updatetournament"
                    element={withRole(["admin"], UpdateTournament)}
                  />
                  <Route
                    path="/player-details"
                    element={withRole(["user", "admin"], PlayerDetails)}
                  />
                  <Route path="/auction" element={<AuctionSection />} />

                  <Route
                    path="/tournamentstats"
                    element={withRole(["user", "admin"], TournamentStats)}
                  />
                  <Route
                    path="/tournamentresults"
                    element={withRole(["user", "admin"], TournamentResults)}
                  />
                  <Route
                    path="/user/squad"
                    element={withRole(["user", "admin"], DisplaySquad)}
                  />
                  <Route
                    path="/user/buildsquad"
                    element={withRole(["user", "admin"], SquadBuilder)}
                  />
                  <Route path="/about" element={<About />} />
                  <Route
                    path="/playertest"
                    element={withRole(["user", "admin"], PlayerTest)}
                  />
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
