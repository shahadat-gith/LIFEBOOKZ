import { Suspense, lazy, useEffect } from "react";
import {BrowserRouter} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
   <BrowserRouter>
      <AuthProvider>
       <App/>
      </AuthProvider>
    </BrowserRouter>
);
