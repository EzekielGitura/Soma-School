import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LibraryBig,
  Menu,
  Scale,
  School,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/streams", label: "Class streams", icon: School },
  { to: "/students", label: "Students", icon: Users },
  { to: "/subjects", label: "Subjects", icon: LibraryBig },
  { to: "/scores", label: "Scores", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BookOpen },
  { to: "/grading", label: "Grading", icon: Scale },
];

const schoolLogo = "/soma-school-logo.png";

export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(() => window.innerWidth >= 980);

  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : "menu-collapsed"}`}>
      <button
        type="button"
        className="menu-toggle"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <button
        type="button"
        className="sidebar-scrim"
        aria-label="Close navigation menu"
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar ${menuOpen ? "open" : "collapsed"}`}>
        <div className="brand">
          <span className="brand-icon">
            <img src={schoolLogo} alt="Soma School logo" />
          </span>
          <span className="brand-copy">
            <strong>Soma</strong>
            <b>School SMS</b>
          </span>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                <Icon size={17} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <p className="sidebar-note">&copy; 2026 Soma School</p>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}

export function Alert({ message, type = "success" }) {
  if (!message) return null;
  return <div className={`alert ${type}`}>{message}</div>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Spinner() {
  return <div className="empty-state">Loading...</div>;
}
