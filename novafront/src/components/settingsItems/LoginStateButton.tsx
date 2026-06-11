import { LogInIcon, LogOutIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LoginStateButton() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <div>
      {isLoggedIn && (
        <div>
          {/* Logout Button */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setIsLoggedIn(false)}
          >
            <LogOutIcon className="text-red-500" size={25} strokeWidth={1} />
            <a className="ml-3 text-red-500 hover:text-red-600 transition-colors inline-block text-sm font-medium">
              Logout
            </a>
          </div>
        </div>
      )}
      {!isLoggedIn && (
        <div>
          {/* Login Button */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              // Route to login page
              navigate("/login");
              setIsLoggedIn(true); // For testing only, remove in production
            }}
          >
            <LogInIcon className="text-text" size={25} strokeWidth={1} />
            <a className="ml-3 text-text hover:text-primary transition-colors inline-block text-sm font-normal">
              Login
            </a>
          </div>
        </div>
      )}
    </div>
  );
}