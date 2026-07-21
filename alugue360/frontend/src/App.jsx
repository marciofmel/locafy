import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Plans from "./pages/Plans";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewListing from "./pages/NewListing";
import EditListing from "./pages/EditListing";
import Favorites from "./pages/Favorites";
import Documents from "./pages/Documents";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentCardForm from "./pages/PaymentCardForm";
import Checkout from "./pages/Checkout";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:slug" element={<Listings />} />
            <Route path="/anuncio/:id" element={<ListingDetail />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/anunciar" element={<NewListing />} />
            <Route path="/editar/:id" element={<EditListing />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/documentos" element={<Documents />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/card/:planId" element={<PaymentCardForm />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/checkout/:planId" element={<Checkout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
