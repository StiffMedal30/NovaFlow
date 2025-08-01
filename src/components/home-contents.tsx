import { ChatSection } from "./sections/ChatSection";

export function HomeContents() {
  return (
    <div style={{ 
      width: "100%", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "flex-start", 
      padding: "2rem 0" 
    }}>
      <ChatSection />
    </div>
  );
}
