import { type Component } from "../../src";

interface ButtonProps {
  onClick: () => void;
  children: unknown;
  variant?: "primary" | "secondary";
}

const Button: Component<ButtonProps> = ({
  onClick,
  children,
  variant = "primary",
}) => (
  <button type="button" onClick={onClick} className={`button ${variant}`}>
    {children}
  </button>
);

interface CardProps {
  title: string;
  children: unknown;
}

const Card: Component<CardProps> = ({ title, children }) => (
  <div className="card">
    <div className="card-header">{title}</div>
    <div className="card-body">{children}</div>
  </div>
);

interface UserProfileProps {
  name: string;
  email: string;
  onEdit: () => void;
}

const UserProfile: Component<UserProfileProps> = ({ name, email, onEdit }) => (
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
