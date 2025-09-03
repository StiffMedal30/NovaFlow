
import { MockAnalytics } from "./Sections/MockAnalytics";
import { Ideas } from "./Sections/Ideas";
import { LeftSideMenu } from "./left-side-menu";

export function HomeContents() {
  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      <LeftSideMenu />
      <div className="flex-1 ml-[220px] h-screen overflow-hidden flex flex-col">
        <div className="w-full flex-1 flex justify-center items-start p-8 gap-8 overflow-y-auto">
          <Ideas />
          <MockAnalytics />
        </div>
      </div>
    </div>
  );
}
