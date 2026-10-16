
import React from "react";

function Header({ profileName = "" }) {
  const initial = profileName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#overview" aria-label="PennyWise home">
          <span className="brand-mark">P</span>
          <span>PennyWise</span>
        </a>

        <nav className="header-nav" aria-label="Main navigation">
          <a className="nav-active" href="#overview">
            Overview
          </a>
          <a href="#transactions">Transactions</a>
        </nav>

        <a className="profile-nav" href="#profile">
          <span className="profile-avatar">{initial}</span>
          <span className="profile-nav-text">
            {profileName.trim() || "My Profile"}
          </span>
        </a>
      </div>
    </header>
  );
}

export default Header;
