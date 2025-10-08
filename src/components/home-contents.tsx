
import { MockAnalytics } from "./Sections/MockAnalytics";
import { Chats } from "./Sections/Chats";
import { LeftSideMenu } from "./left-side-menu";
import ProfileComponent from "./ui/ProfileComponent";

export function HomeContents() {
  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      <LeftSideMenu />
      
      {/* ProfileComponent positioned at top right */}
      <div className="fixed top-4 right-4 z-20">
        <ProfileComponent />
      </div>
      
      <div className="flex-1 ml-[220px] h-screen overflow-hidden flex flex-col">
        <div className="w-full flex-1 flex justify-center items-start p-8 gap-8 overflow-y-auto">
          <Chats />
          <MockAnalytics />
        </div>
      </div>
    </div>
  );
}
