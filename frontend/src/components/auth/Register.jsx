import React, { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import axios from "axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaVerifierRef = useRef(null);

  // Initialize reCAPTCHA
  useEffect(() => {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "sign-in-button", {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          onSignInSubmit();
        },
      });

      return () => {
        // Cleanup recaptcha on unmount
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }
      };
    } catch (err) {
      console.error("Recaptcha initialization error:", err);
      setError(
        "Failed to initialize security verification. Please refresh the page."
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!showOtpField) {
      // Step 1: Send OTP
      try {
        if (!recaptchaVerifierRef.current) {
          throw new Error(
            "Security verification not ready. Please wait and try again."
          );
        }

        const formattedPhone = `+91${phone.replace(/\D/g, "")}`;
        const result = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaVerifierRef.current
        );
        setConfirmationResult(result);
        setShowOtpField(true);
      } catch (error) {
        console.error("OTP send error:", error);
        setError(`OTP failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Step 2: Verify OTP and register
      try {
        if (!confirmationResult) {
          throw new Error("Session expired. Please start the process again.");
        }

        await confirmationResult.confirm(otp);
        await registerUser();
      } catch (error) {
        console.error("OTP verify error:", error);
        setError("Invalid OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const registerUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          phone: `+91${phone.replace(/\D/g, "")}`,
          password,
        }
      );

      alert("Registration successful!");
      console.log("User created:", response.data);
      // Redirect to login/dashboard
      window.location.href = "/login";
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message || error.message || "Registration failed"
      );
    }
  };

  return (
    <section className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 p-2 w-full border rounded"
            disabled={loading || showOtpField}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 p-2 w-full border rounded"
            disabled={loading || showOtpField}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 p-2 w-full border rounded"
            placeholder="9876543210"
            disabled={loading || showOtpField}
          />
        </div>

        {showOtpField && (
          <div>
            <label className="block text-sm font-medium">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="mt-1 p-2 w-full border rounded"
              disabled={loading}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 p-2 w-full border rounded"
            disabled={loading || showOtpField}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={loading}>
          {loading
            ? "Processing..."
            : showOtpField
            ? "Verify OTP & Register"
            : "Send OTP"}
        </button>
      </form>

      <div id="recaptcha-container" className="invisible"></div>

      <div className="mt-4 text-center">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </div>
    </section>
  );
};

export default Register;
