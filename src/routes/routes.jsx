import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/auth/ProtectedRoute";
import RoleProtectedRoute from "@/auth/RoleProtectedRoute";

import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import TournamentsPage from "@/pages/TournamentsPage";
import TournamentDetailPage from "@/pages/TournamentDetailPage";
import TournamentRegisterPage from "@/pages/TournamentRegisterPage";
import TournamentResultsPage from "@/pages/TournamentResultsPage";
import NewsPage from "@/pages/news/NewsPage";
import NewsDetailPage from "@/pages/news/NewsDetailPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import HorseOwnerPage from "@/pages/dashboard/HorseOwnerPage";
import JockeyPage from "@/pages/dashboard/JockeyPage";
import RefereePage from "@/pages/dashboard/RefereePage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import UnauthorizedPage from "@/pages/errors/UnauthorizedPage";
import { adminRoutes } from "./adminRoutes";
import { withAuth } from "./guards";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", Component: HomePage },
      { path: "/about", Component: AboutPage },
      { path: "/news", Component: NewsPage },
      { path: "/news/:id", Component: NewsDetailPage },
      { path: "/tournaments", Component: TournamentsPage },
      { path: "/tournaments/:id", Component: TournamentDetailPage },
      { path: "/tournaments/:id/register", Component: TournamentRegisterPage },
      { path: "/tournaments/:id/results", Component: TournamentResultsPage },
      { path: "/rankings", Component: HomePage },
      { path: "/dashboard", element: withAuth(<DashboardPage />) },
      { path: "/profile", element: withAuth(<ProfilePage />) },
      { path: "/unauthorized", element: withAuth(<UnauthorizedPage />) },
      {
        path: "/horse-owner",
        element: withAuth(
          <RoleProtectedRoute allowedRoles={["OWNER"]}>
            <HorseOwnerPage />
          </RoleProtectedRoute>,
        ),
      },
      {
        path: "/jockey",
        element: withAuth(
          <RoleProtectedRoute allowedRoles={["JOCKEY"]}>
            <JockeyPage />
          </RoleProtectedRoute>,
        ),
      },
      {
        path: "/referee",
        element: withAuth(
          <RoleProtectedRoute allowedRoles={["REFEREE"]}>
            <RefereePage />
          </RoleProtectedRoute>,
        ),
      },
    ],
  },
  ...adminRoutes,
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/forgot-password", Component: ForgotPasswordPage },
  { path: "/verify-otp", Component: VerifyOtpPage },
  { path: "/reset-password", Component: ResetPasswordPage },
  { path: "/logout-demo", element: <Navigate to="/" replace /> },
  { path: "*", Component: NotFoundPage },
]);
