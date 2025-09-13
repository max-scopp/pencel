import type { FunctionalComponent } from "../../src";
import { h, render } from "../../src/index";

interface ButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary";
}

const Button: FunctionalComponent<ButtonProps> = (
  { onClick, variant = "primary" },
  children,
) => (
  <button type="button" onClick={onClick} className={`button ${variant}`}>
    {children}
  </button>
);

interface CardProps {
  title: string;
}

const Card: FunctionalComponent<CardProps> = (props, children) => {
  return (
    <div className="card">
      <div className="card-header">{props.title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
};

interface UserProfileProps {
  name: string;
  email: string;
  onEdit: () => void;
}

const UserProfile: FunctionalComponent<UserProfileProps> = ({
  name,
  email,
  onEdit,
}) => (
  <Card title="User Profile">
    <div className="profile-content">
      <p>
        <strong>Name:</strong> {name}
      </p>
      <p>
        <strong>Email:</strong> {email}
      </p>
      <Button onClick={onEdit}>Edit Profile</Button>
    </div>
  </Card>
);

// Example usage
const App = () => (
  <div className="container">
    <h1>Functional Components Example</h1>

    <UserProfile
      name="John Doe"
      email="john@example.com"
      onEdit={() => alert("Edit profile clicked!")}
    />

    <Card title="Actions">
      <div className="button-group">
        <Button onClick={() => alert("Primary clicked!")} variant="primary">
          Primary Action
        </Button>
        <Button onClick={() => alert("Secondary clicked!")} variant="secondary">
          Secondary Action
        </Button>
      </div>
    </Card>
  </div>
);

// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(<App />, root);
}
