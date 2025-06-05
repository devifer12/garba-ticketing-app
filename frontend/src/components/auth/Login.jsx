import React, { useState } from "react";


const Login = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleChangeEmail = (e) => {
        setEmail(e.target.value)
    }

    const handleChangePassword = (e) => {
        setPassword(e.target.value)
    }

    const handleSubmit = (e) => {
        console.log(email);
        console.log(password);
        console.log("Login Button Pressed");
        e.preventDefault();
    }
  return (
    <section>
      <form className="flex flex-col gap-2">
        <div className="flex flex-col justify-center items-center">
          <label
            className="text-primarytext text-lg font-semibold"
            htmlFor="email">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            required
            className="p-2 placeholder:text-primarytext/50 w-50 h-7 rounded bg-day2/20"
            value={email}
            onChange={handleChangeEmail}
          />
        </div>
        <div className="flex flex-col items-center">
          <label
            htmlFor="password"
            className="text-primarytext text-lg font-semibold">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Enter your password"
            typeof="password"
            required
            className="p-2 placeholder:text-primarytext/50 w-50 h-7 rounded bg-day2/20"
            value={password}
            onChange={handleChangePassword}
          />
        </div>
        <button onClick={handleSubmit} className="rounded cursor-pointer bg-day3 mt-2" type="submit">
          Login
        </button>
      </form>
      <span className="flex text-primarytext mt-4">
        Don't have an account?{" "}
        <a href="/auth/Register" className="text-secondarytext">
          Register
        </a>
      </span>
    </section>
  );
};

export default Login;

