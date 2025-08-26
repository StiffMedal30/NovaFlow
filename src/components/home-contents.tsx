
import { ChatSection } from "./Sections/ChatSection";
import { LeftSideMenu } from "./left-side-menu";

export function HomeContents() {
  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <LeftSideMenu />
      <div style={{ 
        flex: 1, 
        marginLeft: "220px", 
        height: "100vh", 
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{
          width: "100%",
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "2rem 0",
          overflowY: "auto"
        }}>
          <ChatSection />
        </div>
      </div>
    </div>
  );
}
