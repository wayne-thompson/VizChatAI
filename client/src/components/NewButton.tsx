import { useLocation } from "wouter";

export default function NewButton() {
  const [, navigate] = useLocation();
  
  const handleNewVisualization = () => {
    navigate("/analyze");
  };
  
  return (
    <button
      onClick={handleNewVisualization}
      className="hidden md:flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
    >
      <i className="fas fa-plus mr-2"></i>
      New
    </button>
  );
}