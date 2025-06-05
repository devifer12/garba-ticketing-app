import React from "react";
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";
import { useParams } from "react-router-dom";

const Auth = () => {
  const { mode } = useParams(); // 'login' or 'register'
  return (
    <div className="flex items-center justify-center bg-primarybg h-screen w-screen">
        {mode === "Login" ? <Login /> : <Register />}
    </div>
  );
};

export default Auth;
